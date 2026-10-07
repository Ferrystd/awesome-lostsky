#!/usr/bin/env python3
"""Read-only Git/file snapshot and exact preservation verification (stdlib only)."""

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import stat
import subprocess
import sys


class SnapshotError(Exception):
    pass


def digest(data):
    return hashlib.sha256(data).hexdigest()


def no_links(path):
    """Reject every existing symlink/reparse component, including Windows junctions."""
    for component in [*reversed(path.parents), path]:
        try:
            info = component.lstat()
        except FileNotFoundError:
            continue
        if stat.S_ISLNK(info.st_mode) or getattr(info, "st_file_attributes", 0) & 0x400:
            raise SnapshotError("symlink/junction path rejected: " + str(component))


def absolute(path):
    path = Path(path)
    if not path.is_absolute():
        raise SnapshotError("absolute path required")
    no_links(path)
    return path.resolve()


def inside(path, root):
    try:
        path.relative_to(root)
        return True
    except ValueError:
        return False


def git(repo, *args, optional=False):
    environment = dict(os.environ, GIT_OPTIONAL_LOCKS="0")
    result = subprocess.run(
        ["git", "--no-optional-locks", "-c", "core.fsmonitor=false", "-C", str(repo), *args],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=environment,
    )
    if result.returncode:
        if optional and result.returncode == 1:
            return b""
        raise SnapshotError("Git read failed: " + args[0])
    return result.stdout


def repository(path):
    repo = absolute(path)
    top = Path(os.fsdecode(git(repo, "rev-parse", "--show-toplevel").rstrip(b"\r\n"))).resolve()
    if repo != top:
        raise SnapshotError("--repo must be a worktree root")
    return repo


def read_file(path):
    no_links(path)
    try:
        before = path.lstat()
    except FileNotFoundError:
        return None
    if not stat.S_ISREG(before.st_mode):
        raise SnapshotError("non-regular dirty path rejected: " + str(path))
    data = path.read_bytes()
    no_links(path)
    after = path.lstat()
    fingerprint = lambda info: (info.st_dev, info.st_ino, info.st_size, info.st_mtime_ns, info.st_ctime_ns)
    if fingerprint(before) != fingerprint(after) or len(data) != after.st_size:
        raise SnapshotError("file changed during read: " + str(path))
    return data


def state(repo):
    index_path = Path(os.fsdecode(git(repo, "rev-parse", "--path-format=absolute", "--git-path", "index").strip()))
    return {
        "head": git(repo, "rev-parse", "HEAD").strip().decode("ascii"),
        "branch": os.fsdecode(git(repo, "symbolic-ref", "--quiet", "HEAD", optional=True).strip()) or None,
        "stash_ref": git(repo, "rev-parse", "--verify", "--quiet", "refs/stash", optional=True).strip().decode("ascii") or None,
        "status": git(repo, "status", "--porcelain=v1", "-z", "--untracked-files=all", "--ignore-submodules=none"),
        "index_semantic": git(repo, "ls-files", "--stage", "-z"),
        "index_flags": index_flags(git(repo, "ls-files", "--debug", "-z")),
        "index_raw": read_file(index_path),
        "staged_patch": git(repo, "diff", "--cached", "--binary", "--full-index", "--no-ext-diff", "--no-textconv"),
        "unstaged_patch": git(repo, "diff", "--binary", "--full-index", "--no-ext-diff", "--no-textconv"),
    }


def index_flags(data):
    """Keep persisted assume-unchanged/skip-worktree/intent-to-add, not stat cache."""
    flags = []
    position = 0
    while position < len(data):
        end_name = data.index(b"\0", position)
        start_flags = data.index(b"\tflags: ", end_name + 1) + len(b"\tflags: ")
        end_flags = data.index(b"\n", start_flags)
        # CE_VALID, CE_SKIP_WORKTREE, CE_INTENT_TO_ADD. Stages/modes are kept separately.
        persisted = int(data[start_flags:end_flags], 16) & 0x60008000
        flags.append([os.fsdecode(data[position:end_name]), persisted])
        position = end_flags + 1
    return json.dumps(flags, ensure_ascii=True, separators=(",", ":")).encode()


def dirty_paths(status):
    records = status.split(b"\0")
    paths = set()
    position = 0
    while position < len(records) and records[position]:
        entry = records[position]
        if len(entry) < 4 or entry[2:3] != b" ":
            raise SnapshotError("invalid porcelain status")
        paths.add(os.fsdecode(entry[3:]))
        position += 1
        if b"R" in entry[:2] or b"C" in entry[:2]:
            if position >= len(records) or not records[position]:
                raise SnapshotError("invalid rename status")
            paths.add(os.fsdecode(records[position]))
            position += 1
    return sorted(paths)


def original_path(repo, name):
    relative = PurePosixPath(name)
    if relative.is_absolute() or not relative.parts or any(part in ("..", ".") for part in relative.parts):
        raise SnapshotError("invalid original relative path")
    path = repo.joinpath(*relative.parts)
    no_links(path)
    if not inside(path.resolve(), repo):
        raise SnapshotError("original path escapes worktree: " + name)
    return path


def write_new(path, data):
    no_links(path)
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, "wb") as output:
        output.write(data)


def snapshot(repo_path, output_path):
    repo = repository(repo_path)
    output = absolute(output_path)
    if output.exists() or not output.parent.is_dir():
        raise SnapshotError("output must be a new directory with an existing parent")
    worktrees = git(repo, "worktree", "list", "--porcelain", "-z").split(b"\0")
    for record in worktrees:
        if record.startswith(b"worktree "):
            worktree = Path(os.fsdecode(record[9:])).resolve()
            if inside(output, worktree):
                raise SnapshotError("output is inside a repository worktree")
    baseline = state(repo)
    for name, flags in json.loads(baseline["index_flags"]):
        if flags & 0x40008000:
            raise SnapshotError("index hides worktree content (assume-unchanged/skip-worktree): " + name)
    output.mkdir(mode=0o700)
    write_new(output / "INCOMPLETE", b"Snapshot is not verified complete until manifest.json exists.\n")
    entries = []
    for index, name in enumerate(dirty_paths(baseline["status"])):
        data = read_file(original_path(repo, name))
        entry = {"path": name, "exists": data is not None}
        if data is not None:
            backup = f"file-{index:06d}.bin"
            write_new(output / backup, data)
            entry.update(backup=backup, sha256=digest(data), size=len(data))
        entries.append(entry)
    manifest = {"version": 1, "repo": str(repo), "files": entries, "state": {}, "artifacts": {}}
    for key, value in baseline.items():
        if isinstance(value, bytes):
            artifact = key + ".bin"
            write_new(output / artifact, value)
            manifest["artifacts"][key] = {"file": artifact, "sha256": digest(value)}
        else:
            manifest["state"][key] = value
    for entry in entries:
        data = read_file(original_path(repo, entry["path"]))
        if (data is not None) != entry["exists"] or (data is not None and digest(data) != entry["sha256"]):
            raise SnapshotError("unstable snapshot file: " + entry["path"])
    if state(repo) != baseline:
        raise SnapshotError("Git state changed during snapshot; incomplete output retained")
    write_new(output / "manifest.json", (json.dumps(manifest, ensure_ascii=True, indent=2) + "\n").encode())
    return {"snapshot": str(output), "files": len(entries), "complete": True, "stash_ref": baseline["stash_ref"]}


def artifact(directory, record):
    name = record["file"]
    if Path(name).name != name:
        raise SnapshotError("invalid snapshot artifact path")
    data = read_file(directory / name)
    if data is None or digest(data) != record["sha256"]:
        raise SnapshotError("snapshot artifact is missing or corrupted: " + name)
    return data


def verify(snapshot_path):
    directory = absolute(snapshot_path)
    data = read_file(directory / "manifest.json")
    if data is None:
        raise SnapshotError("missing complete snapshot manifest")
    manifest = json.loads(data)
    if manifest["version"] != 1:
        raise SnapshotError("unsupported snapshot version")
    repo = repository(manifest["repo"])
    before = state(repo)
    # Check every saved artifact, including raw index; compare current index by semantics.
    saved = {key: artifact(directory, record) for key, record in manifest["artifacts"].items()}
    mismatches = []
    for entry in manifest["files"]:
        expected = artifact(directory, {"file": entry["backup"], "sha256": entry["sha256"]}) if entry["exists"] else None
        actual = read_file(original_path(repo, entry["path"]))
        if actual != expected:
            mismatches.append(entry["path"])
    changed = []
    for key in ("status", "index_semantic", "index_flags", "staged_patch", "unstaged_patch"):
        if before[key] != saved[key]:
            changed.append(key)
    if before != state(repo):
        raise SnapshotError("Git state changed during verification")
    head_changed = before["head"] != manifest["state"]["head"]
    branch_changed = before["branch"] != manifest["state"]["branch"]
    return {
        "matched": not (mismatches or changed or head_changed or branch_changed),
        "file_mismatches": mismatches, "git_mismatches": changed,
        "head_changed": head_changed, "branch_changed": branch_changed,
        "stash_ref_changed": before["stash_ref"] != manifest["state"]["stash_ref"],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    subcommands = parser.add_subparsers(dest="command", required=True)
    capture = subcommands.add_parser("snapshot")
    capture.add_argument("--repo", required=True)
    capture.add_argument("--output", required=True)
    check = subcommands.add_parser("verify")
    check.add_argument("--snapshot", required=True)
    arguments = parser.parse_args()
    try:
        result = snapshot(arguments.repo, arguments.output) if arguments.command == "snapshot" else verify(arguments.snapshot)
        print(json.dumps(result, ensure_ascii=True))
        return 0 if result.get("matched", True) else 1
    except (SnapshotError, OSError, ValueError, KeyError) as exception:
        # Error text contains paths/summary only; never Git stderr, patches or original bytes.
        print(json.dumps({"error": str(exception)}, ensure_ascii=True), file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
