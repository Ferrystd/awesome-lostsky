# LostSky 媒体素材

## 首屏视频交付

将以下文件放入 `frontend/media/source/site/` 后重新构建：

- `lostsky-loop.webm`：优先格式，5–8秒、静音、无缝循环、最大1280×960、24/30fps。
- `lostsky-loop.mp4`：H.264回退格式，画面与WebM一致。
- `lostsky-loop-poster.webp`：视频第一帧或代表帧，建议1600px宽。

构建检测到 WebM 后才会在官网输出 `<video>`，否则使用静态主视觉，不产生无效请求。视频需要表现“青色天光消退进入深空，地平线残留琥珀信号”，不得包含生成文字或Logo。

## 图片

AI生成图片、产品截图或网络授权素材均先进入 `source/`。每个正式素材都必须登记到 `manifest.json`；网络素材还需把许可证或购买凭证保存到 `licenses/`。AI加工不改变原素材的版权要求。
