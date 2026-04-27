"""
飞书机器人通知客户端
支持飞书自定义机器人 Webhook 推送
文档: https://open.feishu.cn/document/client-docs/bot-v3/add-custom-bot
"""
import json
from typing import Dict

import requests

from .base import NotificationClient, NotificationMessage


class FeishuBotClient(NotificationClient):
    """飞书自定义机器人客户端"""

    channel_key = "feishu"
    display_name = "飞书机器人"

    def __init__(self, webhook_url: str | None = None, secret: str | None = None, pcurl_to_mobile: bool = True):
        enabled = bool(webhook_url)
        super().__init__(enabled=enabled, pcurl_to_mobile=pcurl_to_mobile)
        self._webhook_url = webhook_url or ""
        self._secret = secret or ""

    def _sign(self) -> str | None:
        """生成飞书签名（如果配置了 secret）"""
        if not self._secret:
            return None
        import time
        import hmac
        import hashlib
        import base64

        timestamp = str(int(time.time()))
        string_to_sign = f"{timestamp}\n{self._secret}"
        hmac_code = hmac.new(
            string_to_sign.encode("utf-8"),
            digestmod=hashlib.sha256,
        ).digest()
        sign = base64.b64encode(hmac_code).decode("utf-8")
        return sign

    async def send(self, product_data: Dict, reason: str) -> bool:
        if not self._webhook_url:
            raise ValueError("飞书机器人 Webhook 地址未配置")

        msg = self._build_message(product_data, reason)

        payload: Dict = {
            "msg_type": "interactive",
            "card": {
                "header": {
                    "title": {
                        "tag": "plain_text",
                        "content": msg.notification_title,
                    },
                    "template": "red",
                },
                "elements": [
                    {
                        "tag": "div",
                        "text": {
                            "tag": "lark_md",
                            "content": f"**价格:** {msg.price}\n**原因:** {msg.reason}",
                        },
                    },
                    {
                        "tag": "action",
                        "actions": [
                            {
                                "tag": "button",
                                "text": {
                                    "tag": "plain_text",
                                    "content": "查看商品",
                                },
                                "url": msg.desktop_link,
                                "type": "primary",
                            }
                        ],
                    },
                ],
            },
        }

        if msg.image_url:
            payload["card"]["elements"].insert(
                0,
                {
                    "tag": "img",
                    "img_key": msg.image_url,
                    "alt": {
                        "tag": "plain_text",
                        "content": msg.title,
                    },
                },
            )

        sign = self._sign()
        if sign:
            payload["timestamp"] = str(int(__import__("time").time()))
            payload["sign"] = sign

        response = requests.post(
            self._webhook_url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30,
        )
        response.raise_for_status()
        result = response.json()
        if result.get("code") != 0:
            raise RuntimeError(f"飞书 API 错误: {result.get('msg', '未知错误')}")
        return True
