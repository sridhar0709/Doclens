"""Defensive input sanitization helpers.

Even though the API is not browser-rendered today, free-text fields are stripped
of HTML/script content defensively so that stored/echoed values can never carry
an injection payload downstream (logs, drafted application text, a future UI).
"""

from __future__ import annotations

import html
import re

# Matches any HTML/XML-ish tag, including <script>...</script> content.
_SCRIPT_BLOCK_RE = re.compile(r"<script\b[^>]*>.*?</script\s*>", re.IGNORECASE | re.DOTALL)
_STYLE_BLOCK_RE = re.compile(r"<style\b[^>]*>.*?</style\s*>", re.IGNORECASE | re.DOTALL)
_TAG_RE = re.compile(r"<[^>]*>")
_WHITESPACE_RE = re.compile(r"\s+")


def sanitize_text(value: str) -> str:
    """Strip HTML/script markup from a free-text string, defensively.

    - Removes <script>/<style> blocks (including their contents).
    - Removes any remaining HTML tags.
    - Unescapes HTML entities, then collapses whitespace and trims.

    The result is plain text suitable for logging, templating, and display.
    """
    if not isinstance(value, str):
        return value

    cleaned = _SCRIPT_BLOCK_RE.sub("", value)
    cleaned = _STYLE_BLOCK_RE.sub("", cleaned)
    # Remove tags repeatedly to defeat nested/malformed constructs like "<<b>>".
    prev = None
    while prev != cleaned:
        prev = cleaned
        cleaned = _TAG_RE.sub("", cleaned)
    # Decode entities so "&lt;script&gt;" style payloads don't survive as literals,
    # then strip any tags that decoding may have revealed.
    cleaned = html.unescape(cleaned)
    prev = None
    while prev != cleaned:
        prev = cleaned
        cleaned = _TAG_RE.sub("", cleaned)

    # Drop any stray angle brackets left over from malformed/nested constructs
    # (e.g. "<<b>>" reduces to a lone ">"). They are never valid in these fields.
    cleaned = cleaned.replace("<", "").replace(">", "")

    cleaned = _WHITESPACE_RE.sub(" ", cleaned).strip()
    return cleaned
