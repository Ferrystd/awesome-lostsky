import unittest
from datetime import date
from pathlib import Path
import subprocess
import tempfile

from jinja2 import Environment, FileSystemLoader

from guide_metadata import validate
from guide_modified import update_front_matter, update_staged


class MetadataTests(unittest.TestCase):
    config = {"audience": {"all": "所有读者", "member": "团队成员", "admin": "平台管理员"},
              "guide_tags": {"概念": "concept"}, "status": {"new": "新增内容", "beta": "试用阶段", "deprecated": "已弃用"}}

    def page(self, **overrides):
        meta = dict(title="页面", description="页面说明", audience=["all"], tags=["概念"], modified_at="2026-09-26")
        meta.update(overrides)
        return meta

    def test_valid_modified_date(self):
        for modified in ("2026-09-26", date(2026, 9, 26)):
            self.assertEqual(validate(self.page(modified_at=modified), self.config, date(2026, 9, 26)), ([], []))

    def test_bad_and_future_dates(self):
        for modified in (None, "", "2026-02-30", "tomorrow", "2026-09-27", True):
            self.assertTrue(validate(self.page(modified_at=modified), self.config, date(2026, 9, 26))[0])

    def test_controlled_lists(self):
        for values in (["all", "member"], ["unknown"], [], "all", ["member", "member"], [None]):
            meta = self.page()
            meta["audience"] = values
            self.assertTrue(validate(meta, self.config)[0])
        meta = self.page()
        meta["tags"] = ["concept"]
        self.assertTrue(validate(meta, self.config)[0])

    def test_status_explanation(self):
        self.assertTrue(validate(self.page(status="deprecated"), self.config)[0])
        self.assertFalse(validate(self.page(status="beta", status_note="此功能仍在试用。"), self.config)[0])
        self.assertTrue(validate(self.page(status="typo"), self.config)[0])

    def test_modified_at_front_matter_update(self):
        source = b"---\r\ntitle: Page\r\nreviewed_at:\r\n---\r\n\r\nBody\r\n"
        updated = update_front_matter(source, date(2026, 9, 27))
        self.assertIn(b"modified_at: 2026-09-27\r\n", updated)
        self.assertNotIn(b"reviewed_at", updated)
        self.assertTrue(updated.endswith(b"Body\r\n"))

    def test_staged_update_preserves_unstaged_edits(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            path = root / "docs/user/app/page.md"
            path.parent.mkdir(parents=True)
            subprocess.run(["git", "init", "-q"], cwd=root, check=True)
            subprocess.run(["git", "config", "user.email", "test@example.invalid"], cwd=root, check=True)
            subprocess.run(["git", "config", "user.name", "Guide Metadata Test"], cwd=root, check=True)
            original = "---\ntitle: Page\nmodified_at: 2026-09-01\n---\n\nBody\n"
            path.write_text(original, encoding="utf-8")
            subprocess.run(["git", "add", "--", "docs/user/app/page.md"], cwd=root, check=True)
            subprocess.run(["git", "commit", "-qm", "baseline"], cwd=root, check=True)
            path.write_text(original.replace("Body", "Staged"), encoding="utf-8")
            subprocess.run(["git", "add", "--", "docs/user/app/page.md"], cwd=root, check=True)
            path.write_text(path.read_text(encoding="utf-8") + "Unstaged\n", encoding="utf-8")

            self.assertEqual(update_staged(root, date(2026, 9, 27)), ["docs/user/app/page.md"])
            staged = subprocess.run(
                ["git", "show", ":docs/user/app/page.md"], cwd=root, check=True,
                capture_output=True, text=True, encoding="utf-8",
            ).stdout
            self.assertIn("modified_at: 2026-09-27", staged)
            self.assertIn("Staged", staged)
            self.assertNotIn("Unstaged", staged)
            self.assertIn("modified_at: 2026-09-01", path.read_text(encoding="utf-8"))
            self.assertIn("Unstaged", path.read_text(encoding="utf-8"))

    def test_metadata_template(self):
        root = Path(__file__).resolve().parents[2]
        import zensical
        native = Path(zensical.__file__).parent / "templates"
        env = Environment(loader=FileSystemLoader([root / "guide_theme", native]), autoescape=True)
        env.filters["url"] = lambda value: value
        template = env.get_template("partials/guide-meta.html")
        html = template.render(page={"meta": self.page(modified_at="2026-09-26", status="beta", status_note="范围有限")}, config={"extra": self.config}, tags=[])
        self.assertIn('<time datetime="2026-09-26">2026-09-26</time>', html)
        self.assertIn("试用阶段", html)
        self.assertIn("范围有限", html)
        self.assertNotIn("待核对", html)


if __name__ == "__main__":
    unittest.main()
