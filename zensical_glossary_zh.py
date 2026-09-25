r"""Chinese matching adapter for :mod:`zensical_glossary`.

The upstream extension intentionally treats every Unicode ``\w`` character as
a word character. That is correct for alphabetic words, but prevents a term
such as ``团队`` from matching in ``团队可以``. Keep its processors and
configuration intact while limiting word-boundary protection to identifier
characters, so contiguous Chinese terminology is annotated.
"""

from __future__ import annotations

import re

from zensical_glossary import extension as upstream
from zensical_glossary.extension import GlossaryStore, makeExtension as upstream_make_extension


_upstream_slugify = upstream.slugify


def slugify(value: str, separator: str) -> str:
    """Retain a Chinese term when Python-Markdown would produce an empty ID."""
    slug = _upstream_slugify(value, separator)
    if not slug and re.search(r"[\u3400-\u9fff]", value):
        return value.strip()
    return slug


def build_regex(self: GlossaryStore, *, case_sensitive: bool) -> re.Pattern[str] | None:
    """Build an identifier-aware pattern that permits contiguous CJK terms."""
    if case_sensitive in self._patterns:
        return self._patterns[case_sensitive]

    pattern: re.Pattern[str] | None = None
    if self._units:
        alternation = "|".join(re.escape(surface) for surface, _ in self._units)
        flags = 0 if case_sensitive else re.IGNORECASE
        pattern = re.compile(rf"(?<![A-Za-z0-9_-])(?:{alternation})(?![A-Za-z0-9_-])", flags)
    self._patterns[case_sensitive] = pattern
    return pattern


GlossaryStore.build_regex = build_regex
upstream.slugify = slugify


def makeExtension(**kwargs):
    """Load the upstream extension after applying the CJK compatibility rule."""
    return upstream_make_extension(**kwargs)
