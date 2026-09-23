"""把 assets/img 里的摊位素材写成 animation/photos.js（data URL 内嵌）。

data URL 让画布不被跨源污染：file:// 下能直接播放，渲染 MP4 时 toDataURL 也能用。
用法：.venv/bin/python animation/tools/make-photos.py
"""
import base64
import io
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
IMG = ROOT / "assets/img"
OUT = ROOT / "animation/photos.js"

# 名字, 文件, 最长边上限, 说明
PHOTOS = [
    ("kv", "kv-group.jpg", 1920, "北京交通大学摊位主视觉（水彩群像）"),
    ("badgeYes", "badge-yes.png", 700, "二创红黑榜吧唧 · 红 YES"),
    ("badgeNo", "badge-no.png", 700, "二创红黑榜吧唧 · 黑 NO"),
    ("vol1", "flyer-vol1.jpg", 1920, "北交摊宣 Vol.1 会赢的"),
    ("vol2", "flyer-vol2.jpg", 1920, "北交摊宣 Vol.2 键山雏"),
    ("vol3", "flyer-vol3.jpg", 1920, "北交摊宣 Vol.3 帕秋莉的炼金工坊"),
    ("omg", "joke-omg.jpg", 1920, "北交笑话大公开"),
    ("sanyan", "sanyan.jpg", 1920, "三眼的幻恋"),
    ("art1", "art-1-yukari.jpg", 2000, "隙间月影 01 戴珍珠耳环的17岁少女 · 画师 真菌_isomer"),
    ("art2", "art-2-patchouli.jpg", 2000, "隙间月影 02 不动的大图书馆 · 画师 青未Q"),
    ("art3", "art-3-meninas.jpg", 2000, "隙间月影 03 蓬莱宫娥 · 画师 amibazh"),
    ("art4", "art-4-swing.jpg", 2000, "隙间月影 04 妖怪之山的秋千 · 画师 真菌_isomer"),
    ("orig1", "orig-1-vermeer.jpg", 900, "维米尔《戴珍珠耳环的少女》公有领域"),
    ("orig2", "orig-2-spitzweg.jpg", 900, "斯皮茨韦格《书虫》公有领域"),
    ("orig3", "orig-3-velazquez.jpg", 900, "委拉斯开兹《宫娥》公有领域"),
    ("orig4", "orig-4-fragonard.jpg", 900, "弗拉戈纳尔《秋千》公有领域"),
    ("qr", "qr-sukima.png", 840, "隙间月影 QQ 群 917948669 二维码"),
    ("avatar", "sukima-avatar.jpg", 512, "隙间月影品牌头像"),
    ("sanyanInk", "sanyan-cover-ink.jpg", 1600, "三眼的幻恋封面 · 水墨版（用户提供）"),
    ("sanyanColor", "sanyan-cover-color.jpg", 1600, "三眼的幻恋封面 · 彩色版（用户提供）"),
    ("bottle1", "bottle-1.jpg", 640, "雏祭漂流瓶头像 1（用户提供）"),
    ("bottle2", "bottle-2.jpg", 640, "雏祭漂流瓶头像 2（用户提供）"),
    ("bottle3", "bottle-3.jpg", 640, "雏祭漂流瓶头像 3（用户提供）"),
]


def encode(path: Path, max_side: int):
    im = Image.open(path)
    has_alpha = im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)
    im = im.convert("RGBA" if has_alpha else "RGB")
    if max(im.size) > max_side:
        im.thumbnail((max_side, max_side), Image.LANCZOS)
    buf = io.BytesIO()
    if has_alpha:
        im.save(buf, "WEBP", lossless=True, method=6)
        mime = "image/webp"
    else:
        im.save(buf, "JPEG", quality=90, optimize=True, progressive=True)
        mime = "image/jpeg"
    return im.size, f"data:{mime};base64," + base64.b64encode(buf.getvalue()).decode()


def main():
    lines = ["// 摊位素材，由 animation/tools/make-photos.py 生成，勿手改。在 core.js 之后加载。"]
    total = 0
    for name, file, max_side, credit in PHOTOS:
        (w, h), src = encode(IMG / file, max_side)
        total += len(src)
        meta = {"w": w, "h": h, "credit": credit, "source": f"assets/img/{file}", "src": src}
        lines.append(f"registerPhoto({json.dumps(name)}, {json.dumps(meta, ensure_ascii=False)});")
        print(f"{name:10s} {w}x{h}  {len(src) / 1e6:.2f} MB")
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"-> {OUT}  {total / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
