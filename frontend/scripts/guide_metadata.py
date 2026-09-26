"""Validate the user guide and maintain its audience index from front matter."""
import argparse
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
        if key == "audience" and "all" in values and len(values) > 1:
            errors.append("audience 的 all 不得与其他角色混用")
    status = meta.get("status")
    if status is not None and (not isinstance(status, str) or status not in config["status"]):
        errors.append("status 必须省略或使用已登记状态")
    if status in ("beta", "deprecated") and (not isinstance(meta.get("status_note"), str) or not meta["status_note"].strip()):
        errors.append("beta/deprecated 必须提供 status_note，说明限制或替代方案")
    reviewed = meta.get("reviewed_at")
    if reviewed is None:
        return errors, warnings
    try:
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(reviewed)):
            raise ValueError
        reviewed = date.fromisoformat(str(reviewed))
        if reviewed > today:
            errors.append("reviewed_at 不得晚于今天")
        elif (today - reviewed).days > 180:
            warnings.append("内容核对日期已超过 180 天，请复核后更新 reviewed_at")
    except (ValueError, TypeError):
        errors.append("reviewed_at 必须为空或有效的 YYYY-MM-DD 日期")
    return errors, warnings


def audience_index(pages, config):
    lines = ["---", "title: 按角色阅读", "description: 按照您在 LostSky 中的角色，找到适合的指南。",
             "audience: [all]", "tags: [文档导航]", "reviewed_at:", "guide_index: audience", "---", "",
             "<!-- 此页由 npm run generate:docs:metadata 生成；编辑各文章的 audience 来调整分类。 -->", "",
             "选择您的角色。各组同时收录面向所有读者的通用说明；这只是阅读分类，不改变平台中的实际权限。", ""]
    for role, label in config["audience"].items():
        lines.extend([f"## {label} {{#{role}}}", ""])
        for path, meta in pages:
            if meta.get("guide_index"):
                continue
            if "all" in meta["audience"] or role in meta["audience"]:
                title = meta["title"].replace("[", r"\[").replace("]", r"\]")
                lines.append(f"- [{title}]({path}) — {meta['description']}")
        lines.append("")
    return "\n".join(lines)


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write-index", action="store_true")
    args = parser.parse_args()
    config = tomllib.loads((ROOT / "zensical.guide.toml").read_text(encoding="utf-8"))["project"]["extra"]
    docs = ROOT / "docs/user"
    pages, errors, warnings = [], [], []
    for path in sorted(docs.rglob("*.md")):
        relative = path.relative_to(docs)
        if any(part in ("Templates", "includes", ".obsidian") for part in relative.parts):
            continue
        try:
            meta = read_page(path)
            page_errors, page_warnings = validate(meta, config)
            errors.extend(f"{relative}: {message}" for message in page_errors)
            warnings.extend(f"{relative}: {message}" for message in page_warnings)
            pages.append((relative.as_posix(), meta))
        except (ValueError, yaml.YAMLError) as exc:
            errors.append(f"{relative}: {exc}")
    if not errors:
        expected = audience_index(pages, config)
        output = docs / "audience.md"
        if args.write_index:
            output.write_text(expected, encoding="utf-8", newline="\n")
        elif not output.exists() or output.read_text(encoding="utf-8").replace("\r\n", "\n") != expected:
            errors.append("audience.md 已过期，请运行 npm run generate:docs:metadata")
    for message in warnings:
        print(f"提醒：{message}")
    for message in errors:
        print(f"错误：{message}", file=sys.stderr)
    print(f"用户指南元数据：{len(pages)} 页，{len(errors)} 个错误，{len(warnings)} 条复核提醒")
    return int(bool(errors))


if __name__ == "__main__":
    sys.exit(main())
