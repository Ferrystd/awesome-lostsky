#!/usr/bin/env python3
"""Real temporary Git repositories; no changes to the calling repository."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest import mock
import worktree_snapshot as helper


class SnapshotTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix="worktree-snapshot-test-")
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name).resolve()
        self.repo = self.root / "repo"
        self.repo.mkdir()
        self.git("init", "--quiet")
        self.git("config", "user.name", "Snapshot Test")
        self.git("config", "user.email", "snapshot@example.invalid")
        self.git("config", "core.autocrlf", "false")
        for name in ("both.txt", "delete.txt", "rename-source.txt", "stash.txt"):
            (self.repo / name).write_bytes(b"HEAD\r\n")
        (self.repo / ".gitignore").write_bytes(b"ignored.secret\n")
        self.git("add", "--", "both.txt", "delete.txt", "rename-source.txt", "stash.txt", ".gitignore")
        self.git("commit", "--quiet", "-m", "fixture baseline")
        (self.repo / "both.txt").write_bytes(b"staged\r\n")
        self.git("add", "--", "both.txt")
        (self.repo / "both.txt").write_bytes(b"staged\r\nunstaged\x00\xff\r\n")
        (self.repo / "delete.txt").unlink()
        (self.repo / "rename-source.txt").rename(self.repo / "重命名 目标.txt")
        self.git("add", "--", "rename-source.txt", "重命名 目标.txt")
        (self.repo / "中文 空格.bin").write_bytes(b"untracked\x00\xfe\r\n")
        (self.repo / "ignored.secret").write_bytes(b"DO-NOT-COPY-IGNORED-SECRET")
        self.output = self.root / "snapshot"

    def git(self, *args):
        result = subprocess.run(["git", "-C", str(self.repo), *args], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        self.assertEqual(result.returncode, 0, "fixture Git failed: " + args[0])
        return result.stdout

    def capture(self):
        helper.snapshot(str(self.repo), str(self.output))
        return json.loads((self.output / "manifest.json").read_bytes())

    def test_staged_unstaged_crlf_untracked_rename_delete_exact(self):
        before = helper.state(self.repo)
        manifest = self.capture()
        self.assertEqual(helper.state(self.repo), before)
        entries = {entry["path"]: entry for entry in manifest["files"]}
        self.assertEqual(set(entries), {"both.txt", "delete.txt", "rename-source.txt", "重命名 目标.txt", "中文 空格.bin"})
        for name in ("delete.txt", "rename-source.txt"):
            self.assertFalse(entries[name]["exists"])
        for name in ("both.txt", "重命名 目标.txt", "中文 空格.bin"):
            original = (self.repo / name).read_bytes()
            self.assertEqual((self.output / entries[name]["backup"]).read_bytes(), original)
            self.assertEqual(entries[name]["sha256"], helper.digest(original))
        self.assertEqual((self.output / "index_raw.bin").read_bytes(), before["index_raw"])
        self.assertIn(b"staged", (self.output / "staged_patch.bin").read_bytes())
        self.assertIn(b"GIT binary patch", (self.output / "unstaged_patch.bin").read_bytes())
        self.assertTrue(helper.verify(str(self.output))["matched"])

    def test_ignored_secret_is_not_backed_up(self):
        manifest = self.capture()
        self.assertNotIn("ignored.secret", {entry["path"] for entry in manifest["files"]})
        for path in self.output.iterdir():
            self.assertNotIn(b"DO-NOT-COPY-IGNORED-SECRET", path.read_bytes())

    def test_existing_output_is_never_overwritten(self):
        self.capture()
        baseline = {file.name: file.read_bytes() for file in self.output.iterdir()}
        with self.assertRaises(helper.SnapshotError):
            self.capture()
        self.assertEqual({file.name: file.read_bytes() for file in self.output.iterdir()}, baseline)

    def test_rejects_output_in_any_worktree(self):
        with self.assertRaises(helper.SnapshotError):
            helper.snapshot(str(self.repo), str(self.repo / "snapshot"))
        linked = self.root / "linked"
        self.git("worktree", "add", "--quiet", "-b", "linked-test", str(linked))
        with self.assertRaises(helper.SnapshotError):
            helper.snapshot(str(self.repo), str(linked / "snapshot"))
        self.assertFalse((linked / "snapshot").exists())

    def test_rejects_relative_paths(self):
        with self.assertRaises(helper.SnapshotError):
            helper.snapshot(str(self.repo), "relative-output")

    def test_old_stash_sha_recorded_without_claiming_new_stash(self):
        self.git("stash", "push", "--include-untracked", "--quiet", "-m", "old-unique-stash")
        old = self.git("rev-parse", "refs/stash").strip().decode()
        self.git("stash", "apply", "--index", "--quiet", old)
        manifest = self.capture()
        self.assertEqual(manifest["state"]["stash_ref"], old)
        self.assertTrue(helper.verify(str(self.output))["matched"])
        self.assertNotIn("new_stash_sha", manifest)

    def test_verify_detects_bytes_and_cli_exits_nonzero_without_content(self):
        self.capture()
        (self.repo / "both.txt").write_bytes(b"different\n")
        result = helper.verify(str(self.output))
        self.assertFalse(result["matched"])
        self.assertIn("both.txt", result["file_mismatches"])
        command = subprocess.run([sys.executable, helper.__file__, "verify", "--snapshot", str(self.output)], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        self.assertEqual(command.returncode, 1)
        self.assertNotIn(b"different", command.stdout + command.stderr)

    def test_verify_detects_index_semantic_change(self):
        self.capture()
        self.git("add", "--", "both.txt")
        result = helper.verify(str(self.output))
        self.assertIn("index_semantic", result["git_mismatches"])
        self.assertFalse(result["file_mismatches"])

    def test_verify_reports_head_change_separately(self):
        self.capture()
        self.git("commit", "--quiet", "--allow-empty", "-m", "changed HEAD")
        result = helper.verify(str(self.output))
        self.assertTrue(result["head_changed"])
        self.assertFalse(result["file_mismatches"])
        self.assertFalse(result["matched"])

    def test_index_persisted_flags_are_compared(self):
        self.capture()
        for flag, undo in (("--assume-unchanged", "--no-assume-unchanged"), ("--skip-worktree", "--no-skip-worktree")):
            with self.subTest(flag=flag):
                self.git("update-index", flag, "--", "stash.txt")
                result = helper.verify(str(self.output))
                self.assertFalse(result["matched"])
                self.assertIn("index_flags", result["git_mismatches"])
                self.git("update-index", undo, "--", "stash.txt")
        self.assertTrue(helper.verify(str(self.output))["matched"])

    def test_intent_to_add_flag_is_preserved(self):
        extra = self.repo / "intent.txt"
        extra.write_bytes(b"")
        self.git("add", "--intent-to-add", "--", "intent.txt")
        self.capture()
        baseline = helper.state(self.repo)["index_flags"]
        self.git("add", "--", "intent.txt")
        self.assertNotEqual(helper.state(self.repo)["index_flags"], baseline)
        self.assertIn("index_flags", helper.verify(str(self.output))["git_mismatches"])

    def assert_hidden_index_rejected(self, flag):
        self.git("update-index", flag, "--", "stash.txt")
        (self.repo / "stash.txt").write_bytes(b"hidden original bytes")
        with self.assertRaisesRegex(helper.SnapshotError, "index hides worktree content"):
            self.capture()
        self.assertFalse(self.output.exists())
        self.assertEqual((self.repo / "stash.txt").read_bytes(), b"hidden original bytes")

    def test_preexisting_assume_unchanged_content_is_rejected(self):
        self.assert_hidden_index_rejected("--assume-unchanged")

    def test_preexisting_skip_worktree_content_is_rejected(self):
        self.assert_hidden_index_rejected("--skip-worktree")

    def test_raw_index_artifact_integrity_is_required(self):
        self.capture()
        saved = (self.output / "index_raw.bin").read_bytes()
        (self.output / "index_raw.bin").write_bytes(b"corrupted raw index")
        with self.assertRaises(helper.SnapshotError):
            helper.verify(str(self.output))
        (self.output / "index_raw.bin").write_bytes(saved)
        (self.output / "index_raw.bin").unlink()
        with self.assertRaises(helper.SnapshotError):
            helper.verify(str(self.output))

    def test_index_stat_refresh_does_not_fail_semantic_verification(self):
        self.capture()
        baseline = helper.state(self.repo)["index_raw"]
        path = self.repo / "stash.txt"
        info = path.stat()
        # Git for Windows may ignore subsecond mtime; force a distinct second then refresh.
        os.utime(path, ns=(info.st_atime_ns, info.st_mtime_ns + 2000000000))
        self.git("add", "--", "stash.txt")
        self.assertNotEqual(helper.digest(helper.state(self.repo)["index_raw"]), helper.digest(baseline))
        self.assertTrue(helper.verify(str(self.output))["matched"])

    def test_verify_detects_new_untracked_and_recreated_deleted_path(self):
        self.capture()
        (self.repo / "extra.txt").write_bytes(b"new")
        (self.repo / "delete.txt").write_bytes(b"recreated")
        result = helper.verify(str(self.output))
        self.assertIn("delete.txt", result["file_mismatches"])
        self.assertIn("status", result["git_mismatches"])

    def test_snapshot_rejects_concurrent_git_change(self):
        baseline = helper.state(self.repo)
        with mock.patch.object(helper, "state", side_effect=[baseline, dict(baseline, head="0" * 40)]):
            with self.assertRaises(helper.SnapshotError):
                self.capture()
        self.assertFalse((self.output / "manifest.json").exists())
        self.assertTrue((self.output / "INCOMPLETE").exists())

    def test_snapshot_rejects_concurrent_file_change(self):
        actual_read = helper.read_file
        hits = 0
        def changing(path):
            nonlocal hits
            data = actual_read(path)
            if path == self.repo / "both.txt":
                hits += 1
                if hits == 2:
                    return b"concurrent-write"
            return data
        with mock.patch.object(helper, "read_file", side_effect=changing):
            with self.assertRaises(helper.SnapshotError):
                self.capture()
        self.assertFalse((self.output / "manifest.json").exists())

    def test_symlink_or_junction_escape_is_rejected(self):
        external = self.root / "external"
        external.mkdir()
        link = self.repo / "escape"
        try:
            link.symlink_to(external, target_is_directory=True)
        except OSError:
            if os.name != "nt":
                raise
            command = subprocess.run(["cmd", "/c", "mklink", "/J", str(link), str(external)], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            self.assertEqual(command.returncode, 0, "junction fixture could not be created")
        with self.assertRaises(helper.SnapshotError):
            helper.original_path(self.repo, "escape/file.txt")
        with self.assertRaises(helper.SnapshotError):
            helper.snapshot(str(self.repo), str(link / "snapshot"))

    def test_manifest_relative_escape_is_rejected(self):
        self.capture()
        manifest_path = self.output / "manifest.json"
        manifest = json.loads(manifest_path.read_bytes())
        manifest["files"][0]["path"] = "../outside-file"
        manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
        with self.assertRaises(helper.SnapshotError):
            helper.verify(str(self.output))

    def test_corrupted_backup_is_rejected(self):
        manifest = self.capture()
        entry = next(item for item in manifest["files"] if item["exists"])
        (self.output / entry["backup"]).write_bytes(b"corrupted")
        with self.assertRaises(helper.SnapshotError):
            helper.verify(str(self.output))


if __name__ == "__main__":
    unittest.main(verbosity=1)
