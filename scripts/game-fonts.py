"""把游戏页面用到的字从大字体里裁出来，生成 game/fonts/*.woff2。

用法：/Users/fish2lab/Project/BX/.venv/bin/python scripts/game-fonts.py
改了 game/ 里任何屏上文字后重跑一次。字表 = game/*.html + game/*.js 里出现的所有字符 + 全部 ASCII。
"""
import pathlib
import shutil

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "fonts"
OUT = ROOT / "game" / "fonts"
OUT.mkdir(parents=True, exist_ok=True)

chars = set(chr(c) for c in range(0x20, 0x7F))
chars |= set("·—…「」『』《》（）！？，。、：；“”‘’¥×　")
for p in list((ROOT / "game").glob("*.html")) + list((ROOT / "game").glob("*.js")):
    chars |= set(p.read_text(encoding="utf-8"))
chars = {c for c in chars if c.isprintable() or c == "　"}
text = "".join(sorted(chars))


def make(src, dst, font=None):
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["*"]
    opts.name_IDs = ["*"]
    opts.notdef_outline = True
    f = font or TTFont(src)
    s = subset.Subsetter(opts)
    s.populate(text=text)
    s.subset(f)
    f.flavor = "woff2"
    f.save(dst)
    print(f"{dst.name:34s} {dst.stat().st_size / 1024:8.1f} KB")


make(SRC / "Xiaolai-Regular.ttf", OUT / "Xiaolai-sub.woff2")
make(SRC / "NotoSansSC-Medium.ttf", OUT / "NotoSansSC-Medium-sub.woff2")
make(SRC / "NotoSansSC-Regular.ttf", OUT / "NotoSansSC-Regular-sub.woff2")
vf = TTFont(SRC / "NotoSerifSC-VF.ttf")
black = instancer.instantiateVariableFont(vf, {"wght": 900})
make(None, OUT / "NotoSerifSC-Black-sub.woff2", black)
shutil.copy(SRC / "Xiaolai-OFL.txt", OUT / "Xiaolai-OFL.txt")
print(f"{len(text)} chars")
