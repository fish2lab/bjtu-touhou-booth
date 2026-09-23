# 北交摊位 4K 展示屏

展位现场：27 寸 4K 显示器（3840×2160），浏览器全屏循环播放，可能没有网络。

## 约束

- 双击 `index.html` 就能跑：页面以 `file://` 打开，只用经典 `<script>`，不用 ES module、不走 CDN。第三方库放 `vendor/`（gsap 3.15.0、pixi.js 8.21.0）。
- `file://` 下图片文件不能进 WebGL 纹理（跨源污染）。照片、立绘用 DOM `<img>` 叠在 canvas 上；WebGL 里只放程序生成的纹理。
- 舞台固定 3840×2160 像素，整体按窗口等比缩放。设计稿就是 4K 实际像素。
- 素材只从 `assets/` 读，原图备份在 `source/`，不改。文案、价格只抄 `docs/素材事实.md`，不编。

## 验收

- 截图：`node scripts/shot.mjs <页面> "<查询串>" out/<名>.png [等待ms]`，默认 4K、`file://` 打开，有控制台报错时退出码为 1。
- worktree 里没有 `node_modules`：先 `ln -s /Users/fish2lab/Project/BX/node_modules node_modules`。
