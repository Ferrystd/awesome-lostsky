import argparse
import hashlib
import json
import math
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

from preprocess import VERSION, fingerprint, self_test, transform


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_identity(manifest_path: Path, model_root: Path) -> tuple[dict, Path]:
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    lock_path = model_root / "model-lock.json"
    if sha256(lock_path) != manifest["model_lock_sha256"]:
        raise RuntimeError("model lock hash mismatch")
    lock = json.loads(lock_path.read_text(encoding="utf-8"))
    required = {
        "model_directory": manifest["model_directory"],
        "model_sha256": manifest["model_sha256"],
        "threshold": manifest["threshold"],
        "preprocess_version": manifest["preprocess"]["version"],
        "preprocess_fingerprint": manifest["preprocess"]["fingerprint"],
        "preprocess_source_sha256": manifest["preprocess"]["source_sha256"],
    }
    for key, expected in required.items():
        if lock.get(key) != expected:
            raise RuntimeError(f"model lock field mismatch: {key}")
    report_path = model_root / manifest["training_report"]
    if lock.get("training_report_sha256") != manifest["training_report_sha256"] or sha256(report_path) != manifest["training_report_sha256"]:
        raise RuntimeError("training report hash mismatch")
    report = json.loads(report_path.read_text(encoding="utf-8"))
    if report.get("max_length") != manifest["max_length"] or report.get("model_sha256") != manifest["model_sha256"]:
        raise RuntimeError("training report identity mismatch")
    self_test()
    preprocess_path = Path(__file__).with_name("preprocess.py")
    if (VERSION != manifest["preprocess"]["version"]
            or fingerprint() != manifest["preprocess"]["fingerprint"]
            or sha256(preprocess_path) != manifest["preprocess"]["source_sha256"]):
        raise RuntimeError("preprocess implementation mismatch")
    model_dir = model_root / manifest["model_directory"]
    for name, expected in manifest["assets"].items():
        if sha256(model_dir / name) != expected:
            raise RuntimeError(f"model asset hash mismatch: {name}")
    return manifest, model_dir


class Classifier:
    def __init__(self, manifest: dict, model_dir: Path, threads: int, inference_batch_size: int):
        import torch
        from transformers import AutoModelForSequenceClassification, AutoTokenizer

        self.torch = torch
        self.manifest = manifest
        self.inference_batch_size = inference_batch_size
        torch.set_num_threads(threads)
        self.tokenizer = AutoTokenizer.from_pretrained(model_dir, local_files_only=True)
        self.model = AutoModelForSequenceClassification.from_pretrained(model_dir, local_files_only=True)
        self.model.eval()
        if self.model.config.label2id != {"negative": 0, "positive": 1} or self.model.config.id2label != {0: "negative", 1: "positive"}:
            raise RuntimeError("model label mapping mismatch")

    def identity(self) -> dict:
        return {
            "model": self.manifest["model"],
            "model_sha256": self.manifest["model_sha256"],
            "threshold": self.manifest["threshold"],
            "max_length": self.manifest["max_length"],
            "preprocess": {
                "version": self.manifest["preprocess"]["version"],
                "fingerprint": self.manifest["preprocess"]["fingerprint"],
            },
        }

    def classify(self, items: list[dict]) -> list[dict]:
        predictions = []
        with self.torch.no_grad():
            for offset in range(0, len(items), self.inference_batch_size):
                batch = items[offset:offset + self.inference_batch_size]
                encoded = self.tokenizer(
                    [transform(item["text"]) for item in batch],
                    padding=True,
                    truncation=True,
                    max_length=self.manifest["max_length"],
                    return_tensors="pt",
                )
                scores = self.torch.softmax(self.model(**encoded).logits, dim=1)[:, 1].tolist()
                for item, score in zip(batch, scores):
                    if not math.isfinite(score) or not 0 <= score <= 1:
                        raise RuntimeError("model produced invalid score")
                    predictions.append({"id": item["id"], "score": score})
        return predictions


def make_handler(classifier: Classifier, max_request_batch: int):
    class Handler(BaseHTTPRequestHandler):
        server_version = "LostSkyWeiboFeedClassifier/1.0"

        def do_GET(self):
            if self.path != "/health":
                self.send_error(404)
                return
            self.respond(200, {"ready": True, **classifier.identity()})

        def do_POST(self):
            if self.path != "/classify":
                self.send_error(404)
                return
            try:
                if self.headers.get_content_type() != "application/json":
                    raise ValueError("content type must be application/json")
                length = int(self.headers.get("Content-Length", "0"))
                if length < 2 or length > 2 * 1024 * 1024:
                    raise ValueError("invalid content length")
                payload = json.loads(self.rfile.read(length))
                if not isinstance(payload, dict) or set(payload) != {"texts"} or not isinstance(payload["texts"], list):
                    raise ValueError("body must contain only texts")
                items = payload["texts"]
                if not 1 <= len(items) <= max_request_batch:
                    raise ValueError("invalid batch size")
                ids = set()
                for item in items:
                    if not isinstance(item, dict) or set(item) != {"id", "text"}:
                        raise ValueError("invalid text item")
                    if not isinstance(item["id"], str) or not item["id"] or len(item["id"]) > 64 or item["id"] in ids:
                        raise ValueError("invalid or duplicate id")
                    if not isinstance(item["text"], str) or not item["text"].strip() or len(item["text"]) > 20000:
                        raise ValueError("invalid text")
                    ids.add(item["id"])
                self.respond(200, {**classifier.identity(), "predictions": classifier.classify(items)})
            except (ValueError, json.JSONDecodeError) as error:
                self.respond(400, {"error": str(error)})
            except Exception:
                self.respond(500, {"error": "classification failed"})

        def respond(self, status: int, payload: dict):
            body = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, message, *args):
            print(f"{self.address_string()} - {message % args}")

    return Handler


def main():
    base = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description="Serve the locked LostSky Weibo feed classifier.")
    parser.add_argument("--manifest", type=Path, default=base / "model-manifest.json")
    parser.add_argument("--model-root", type=Path, required=True)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--threads", type=int, default=4)
    parser.add_argument("--inference-batch-size", type=int, default=16)
    parser.add_argument("--max-request-batch", type=int, default=100)
    args = parser.parse_args()
    if args.threads < 1 or args.inference_batch_size < 1 or not 1 <= args.max_request_batch <= 100:
        parser.error("thread and batch settings must be positive; max request batch cannot exceed 100")
    manifest, model_dir = load_identity(args.manifest.resolve(), args.model_root.resolve())
    classifier = Classifier(manifest, model_dir, args.threads, args.inference_batch_size)
    server = HTTPServer((args.host, args.port), make_handler(classifier, args.max_request_batch))
    print(json.dumps({"ready": True, "host": args.host, "port": args.port, **classifier.identity()}), flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
