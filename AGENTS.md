# 北交摊位 4K 展示屏

展位现场：27 寸 4K 显示器（3840×2160），循环播放一部无声短片，可能没有网络。

## 约束

- 交付是 `out/booth-4k.mp4`（3840×2160，24fps）。备用方案是双击 `animation/index.html?booth`，全屏循环。页面以 `file://` 打开，只用经典 `<script>`，不用 ES module、不走 CDN。
- 图片以 data URL 内嵌在 `animation/photos.js`（由 `animation/tools/make-photos.py` 生成），这样画布不会被跨源污染。
- 逻辑画面 1920×1080，出片时整体 ×2。
- 素材只从 `assets/` 读，原图备份在 `source/`，不改。屏上文字、价格只抄 `docs/素材事实.md`，不编。
- 文档分工：
  - `docs/方案.md`：目的、主线、取舍。
  - `docs/动画施工.md`：分段、画风、接口、交接、验收。
- 第一版（电车剪纸片、弹幕游戏）在 git 标签 `legacy/v1-tram-film`，只在明确要复用某个部件时取回。

## 验收

- 抽帧：`node animation/tools/frames.mjs --q scene=<key> --grid 36`。4K 整帧加 `--frames a,b --w 3840`。有控制台报错时退出码为 1。
- 出片：`node animation/tools/render.mjs`，默认输出 `out/booth-4k.mp4`，参数见文件头。
- worktree 里没有 `node_modules` 和 `.venv`，先软链：`ln -s /Users/fish2lab/Project/BX/node_modules node_modules && ln -s /Users/fish2lab/Project/BX/.venv .venv`。
