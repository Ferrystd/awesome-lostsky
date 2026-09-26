"""Validate user-guide front matter."""
from datetime import date
from pathlib import Path
import re
import sys
import tomllib

import yaml

ROOT = Path(__file__).resolve().parents[2]


def read_page(path):
    text = path.read_text(encoding="utf-8-sig")
    match = re.match(r"\A---\r?\n(.*?)\r?\n---(?:\r?\n|$)", text, re.S)
    if not match:
        raise ValueError("缺少 YAML front matter")
    meta = yaml.safe_load(match.group(1))
    if not isinstance(meta, dict):
        raise ValueError("front matter 必须是映射")
    return meta


def validate(meta, config, today=None):
    today = today or date.today()
    errors, warnings = [], []
    for key in ("title", "description"):
        if not isinstance(meta.get(key), str) or not meta[key].strip():
            errors.append(f"{key} 必须是非空文本")
    for key, choices in (("audience", config["audience"]), ("tags", config["guide_tags"])):
        values = meta.get(key)
        if not isinstance(values, list) or not values or any(not isinstance(v, str) for v in values):
            errors.append(f"{key} 必须是非空文本列表")
            continue
        if len(set(values)) != len(values):
            errors.append(f"{key} 不得重复")
        unknown = set(values) - choices.keys()
        if unknown:
            errors.append(f"{key} 未登记：{', '.join(sorted(unknown))}")
    status = meta.get("status")
    if status is not None and (not isinstance(status, str) or status not in config["status"]):
        errors.append("status 必须省略或使用已登记状态")
    if status in ("beta", "deprecated") and (not isinstance(meta.get("status_note"), str) or not meta["status_note"].strip()):
        errors.append("beta/deprecated 必须提供 status_note，说明限制或替代方案")
    modified = meta.get("modified_at")
    try:
        if isinstance(modified, bool) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(modified)):
            raise ValueError
        modified = date.fromisoformat(str(modified))
        if modified > today:
            errors.append("modified_at 不得晚于今天")
    except (ValueError, TypeError):
        errors.append("modified_at 必须是有效的 YYYY-MM-DD 日期")
    return errors, warnings


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    config = tomllib.loads((ROOT / "zensical.guide.toml").read_text(encoding="utf-8"))["project"]["extra"]
    docs = ROOT / "docs/user"
    page_count, errors, warnings = 0, [], []
    for path in sorted(docs.rglob("*.md")):
        relative = path.relative_to(docs)
        if any(part in ("Templates", "includes", ".obsidian") for part in relative.parts):
            continue
        try:
            meta = read_page(path)
            page_errors, page_warnings = validate(meta, config)
            errors.extend(f"{relative}: {message}" for message in page_errors)
            warnings.extend(f"{relative}: {message}" for message in page_warnings)
            page_count += 1
        except (ValueError, yaml.YAMLError) as exc:
            errors.append(f"{relative}: {exc}")
    for message in warnings:
        print(f"提醒：{message}")
    for message in errors:
        print(f"错误：{message}", file=sys.stderr)
    print(f"用户指南元数据：{page_count} 页，{len(errors)} 个错误")
    return int(bool(errors))


if __name__ == "__main__":
    sys.exit(main())
