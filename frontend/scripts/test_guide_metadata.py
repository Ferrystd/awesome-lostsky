import unittest
from datetime import date
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

from guide_metadata import audience_index, validate


class MetadataTests(unittest.TestCase):
    config = {"audience": {"all": "所有读者", "member": "团队成员", "admin": "平台管理员"},
              "guide_tags": {"概念": "concept"}, "status": {"new": "新增内容", "beta": "试用阶段", "deprecated": "已弃用"}}

    def page(self, **overrides):
        return dict(title="页面", description="页面说明", audience=["all"], tags=["概念"], **overrides)

    def test_unreviewed_and_valid_date(self):
        for reviewed in (None, "2026-09-26", date(2026, 9, 26)):
            self.assertEqual(validate(self.page(reviewed_at=reviewed), self.config, date(2026, 9, 26)), ([], []))

    def test_bad_and_future_dates(self):
        for reviewed in ("", "2026-02-30", "tomorrow", "2026-09-27", True):
            self.assertTrue(validate(self.page(reviewed_at=reviewed), self.config, date(2026, 9, 26))[0])

    def test_review_reminder_is_not_failure(self):
        errors, warnings = validate(self.page(reviewed_at="2025-01-01"), self.config, date(2026, 9, 26))
        self.assertFalse(errors)
        self.assertTrue(warnings)

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

    def test_role_index(self):
        shared = self.page()
        member = self.page()
        member["audience"] = ["member"]
        output = audience_index([("common.md", shared), ("member.md", member)], self.config)
        self.assertEqual(output.count("](common.md)"), 3)
        self.assertEqual(output.count("](member.md)"), 1)
        self.assertNotIn("](member.md)", output.split("## 团队成员")[0])
        self.assertIn("{#member}", output)

    def test_metadata_template(self):
        root = Path(__file__).resolve().parents[2]
        import zensical
        native = Path(zensical.__file__).parent / "templates"
        env = Environment(loader=FileSystemLoader([root / "guide_theme", native]), autoescape=True)
        env.filters["url"] = lambda value: value
        template = env.get_template("partials/guide-meta.html")
        html = template.render(page={"meta": self.page(reviewed_at="2026-09-26", status="beta", status_note="范围有限")}, config={"extra": self.config}, tags=[])
        self.assertIn('<time datetime="2026-09-26">2026-09-26</time>', html)
        self.assertIn("试用阶段", html)
        self.assertIn("范围有限", html)
        self.assertNotIn("待核对", html)


if __name__ == "__main__":
    unittest.main()
