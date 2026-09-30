# 微博信息流本地分类服务

在项目根目录使用现有 CPU 环境和原始锁定模型目录启动：

```powershell
runtime/feed-training-20260929/.venv/Scripts/python.exe scripts/weibo_feed_classifier/server.py --model-root runtime/feed-training-round3-20260930 --host 127.0.0.1 --port 8765 --threads 4 --inference-batch-size 16 --max-request-batch 100
```

`requirements.txt` 锁定的是当前已验收 CPU 运行环境中的包元数据版本。新建环境时，先准备与目标 Python 和 CPU 平台匹配的安装包；安装包应来自部署方维护的离线制品或已配置的软件源，不能假定任意远端源都提供相同版本。使用离线制品的示例：

```powershell
python -m venv runtime/weibo-feed-classifier-venv
runtime/weibo-feed-classifier-venv/Scripts/python.exe -m pip install --no-index --find-links <离线包目录> -r scripts/weibo_feed_classifier/requirements.txt
```

当前机器已经使用首条启动命令中的锁定环境，日常启动无需重复安装依赖。

服务监听前会校验 `model-lock.json`、训练报告、全部模型与 tokenizer 资产哈希、标签映射、阈值、最大长度和预处理身份。模型与 tokenizer 始终使用 `local_files_only=True`，运行时不会下载文件。`GET /health` 返回当前身份，`POST /classify` 只接受未经预处理的原始正文：

```json
{"texts":[{"id":"123","text":"#光遇陪玩[超话]# 想找陪玩"}]}
```

进程只加载一次模型，并串行处理 HTTP 推理请求。服务应绑定回环地址，并在 `weibo:feed-poll` 调度任务之前启动。
