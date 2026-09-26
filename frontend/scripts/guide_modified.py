"""Update modified_at for staged user-guide pages without losing unstaged edits."""
from datetime import date
from pathlib import Path, PurePosixPath
import re
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[2]
SKIPPED_PARTS = {"Templates", "includes", ".obsidian"}
FRONT_MATTER = re.compile(br"\A(?:\xef\xbb\xbf)?---(?P<nl>\r?\n).*?\r?\n---(?:\r?\n|$)", re.S)
DATE_FIELD = re.compile(br"(?m)^(?:reviewed_at|modified_at):[^\r\n]*(?:\r?\n|$)")


def run_git(*args, cwd=ROOT, input_bytes=None, check=True):
    return subprocess.run(
        ["git", *args], cwd=cwd, input=input_bytes, stdout=subprocess.PIPE,
        stderr=subprocess.PIPE, check=check,
    )


def is_guide_page(path):
    parts = PurePosixPath(path).parts
    return len(parts) >= 3 and parts[:2] == ("docs", "user") and parts[-1].endswith(".md") and not SKIPPED_PARTS.intersection(parts)


def update_front_matter(content, today=None):
    today = today or date.today()
    match = FRONT_MATTER.match(content)
    if not match:
        raise ValueError("缺少 YAML front matter")
    front_matter = match.group(0)
    newline = match.group("nl")
    replacement = b"modified_at: " + today.isoformat().encode("ascii") + newline
    if DATE_FIELD.search(front_matter):
        updated = DATE_FIELD.sub(replacement, front_matter, count=1)
    else:
        closing = front_matter.rfind(newline + b"---")
        updated = front_matter[:closing + len(newline)] + replacement + front_matter[closing + len(newline):]
    return updated + content[match.end():]


def staged_paths(cwd=ROOT):
    result = run_git("diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z", "--", "docs/user", cwd=cwd)
    return [path.decode("utf-8") for path in result.stdout.rstrip(b"\0").split(b"\0") if path and is_guide_page(path.decode("utf-8"))]


def update_staged(cwd=ROOT, today=None):
    updated_paths = []
    for path in staged_paths(cwd):
        original = run_git("show", f":{path}", cwd=cwd).stdout
        updated = update_front_matter(original, today)
        if updated == original:
            continue
        worktree_clean = run_git("diff", "--quiet", "--", path, cwd=cwd, check=False).returncode == 0
        if worktree_clean:
            target = Path(cwd, *PurePosixPath(path).parts)
            target.write_bytes(updated)
            run_git("add", "--", path, cwd=cwd)
        else:
            entry = run_git("ls-files", "-s", "--", path, cwd=cwd).stdout.decode("utf-8").split()
            if len(entry) < 3:
                raise RuntimeError(f"无法读取暂存条目：{path}")
            blob = run_git("hash-object", "-w", "--stdin", cwd=cwd, input_bytes=updated).stdout.strip().decode("ascii")
            run_git("update-index", "--cacheinfo", entry[0], blob, path, cwd=cwd)
            print(f"已仅更新暂存区日期，保留未暂存编辑：{path}")
        updated_paths.append(path)
    return updated_paths


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    try:
        paths = update_staged()
    except (OSError, subprocess.CalledProcessError, ValueError, RuntimeError) as exc:
        print(f"更新用户文档 modified_at 失败：{exc}", file=sys.stderr)
        return 1
    if paths:
        print(f"已更新并暂存 modified_at：{', '.join(paths)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
