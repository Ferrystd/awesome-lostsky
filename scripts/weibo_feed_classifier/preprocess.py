import hashlib
import re

VERSION = "remove-first-leading-supertopic-v1"
PATTERN = re.compile(r"\A([\s\u200b\u200c\u200d\ufeff]*)(?:#[^#\r\n]*?\[超话\]#|#[^#\r\n]*?超话#)")


def transform(text: str) -> str:
    return PATTERN.sub(r"\1", text, count=1)


def fingerprint() -> str:
    return hashlib.sha256((VERSION + "\0" + PATTERN.pattern).encode("utf-8")).hexdigest()


def self_test() -> None:
    cases = {
        "#光遇陪玩[超话]# 正文 #第二个[超话]#": " 正文 #第二个[超话]#",
        "\u200b #王者荣耀超话#正文": "\u200b 正文",
        "#普通标签# 正文": "#普通标签# 正文",
        "正文 #中间超话#": "正文 #中间超话#",
        "#唯一[超话]#": "",
    }
    for source, expected in cases.items():
        if transform(source) != expected:
            raise RuntimeError(f"preprocess self-test failed: {source!r}")
