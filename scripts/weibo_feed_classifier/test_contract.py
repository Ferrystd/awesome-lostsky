import json
import unittest
from pathlib import Path

from preprocess import VERSION, fingerprint, self_test, transform


class ClassifierContractTest(unittest.TestCase):
    def test_preprocess_contract(self):
        self_test()
        self.assertEqual(transform("#光遇陪玩[超话]# 正文 #第二个[超话]#"), " 正文 #第二个[超话]#")
        self.assertEqual(VERSION, "remove-first-leading-supertopic-v1")
        self.assertEqual(fingerprint(), "16d7c94edc197e5620acd410c58f0fbeeff5917e503d88d0c96a0dc461bbb565")

    def test_manifest_locks_all_runtime_assets(self):
        manifest = json.loads((Path(__file__).parent / "model-manifest.json").read_text(encoding="utf-8"))
        self.assertEqual(manifest["threshold"], 0.46)
        self.assertEqual(manifest["max_length"], 160)
        self.assertEqual(manifest["training_report"], "training-2e-5.json")
        self.assertEqual(manifest["training_report_sha256"], "bf353a843c408ef82d88ab133d6aed30aedf02f9be685a7d3c4fd69dca8b1ce9")
        self.assertEqual(set(manifest["assets"]), {"config.json", "model.safetensors", "tokenizer_config.json", "tokenizer.json"})
        self.assertEqual(manifest["preprocess"]["version"], VERSION)
        self.assertEqual(manifest["preprocess"]["fingerprint"], fingerprint())


if __name__ == "__main__":
    unittest.main()
