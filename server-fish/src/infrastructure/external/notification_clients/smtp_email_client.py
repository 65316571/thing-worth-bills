"""
SMTP 邮件通知客户端
支持通过 SMTP 发送商品推荐邮件
"""
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict

from .base import NotificationClient, NotificationMessage


class SmtpEmailClient(NotificationClient):
    """SMTP 邮件客户端"""

    channel_key = "smtp_email"
    display_name = "邮件 (SMTP)"

    def __init__(
        self,
        host: str | None = None,
        port: int | None = None,
        username: str | None = None,
        password: str | None = None,
        sender: str | None = None,
        recipient: str | None = None,
        use_tls: bool = True,
        pcurl_to_mobile: bool = True,
    ):
        enabled = all([host, username, password, sender, recipient])
        super().__init__(enabled=enabled, pcurl_to_mobile=pcurl_to_mobile)
        self._host = host or ""
        self._port = port or (587 if use_tls else 25)
        self._username = username or ""
        self._password = password or ""
        self._sender = sender or ""
        self._recipient = recipient or ""
        self._use_tls = use_tls

    async def send(self, product_data: Dict, reason: str) -> bool:
        if not all([self._host, self._username, self._password, self._sender, self._recipient]):
            raise ValueError("SMTP 配置不完整")

        msg = self._build_message(product_data, reason)

        email = MIMEMultipart("alternative")
        email["Subject"] = msg.notification_title
        email["From"] = self._sender
        email["To"] = self._recipient

        # 纯文本内容
        text_body = f"""{msg.title}

价格: {msg.price}
原因: {msg.reason}
链接: {msg.desktop_link}
"""
        if msg.mobile_link:
            text_body += f"手机端链接: {msg.mobile_link}\n"

        # HTML 内容
        html_body = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }}
        .card {{ max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }}
        .header {{ background: #e53935; color: #fff; padding: 16px 20px; font-size: 16px; font-weight: 600; }}
        .body {{ padding: 20px; }}
        .title {{ font-size: 18px; font-weight: 600; color: #1a1a1a; margin-bottom: 12px; }}
        .row {{ display: flex; margin-bottom: 8px; color: #555; }}
        .label {{ width: 60px; color: #888; flex-shrink: 0; }}
        .link {{ display: inline-block; margin-top: 16px; padding: 10px 24px; background: #e53935; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px; }}
        .footer {{ padding: 12px 20px; background: #fafafa; font-size: 12px; color: #999; text-align: center; }}
    </style>
</head>
<body>
    <div class="card">
        <div class="header">🚨 闲鱼智能监控 - 新推荐</div>
        <div class="body">
            <div class="title">{msg.title}</div>
            <div class="row"><span class="label">价格</span><span>{msg.price}</span></div>
            <div class="row"><span class="label">原因</span><span>{msg.reason}</span></div>
            <a href="{msg.desktop_link}" class="link">查看商品</a>
        </div>
        <div class="footer">由 Thing Worth Bills 自动发送</div>
    </div>
</body>
</html>"""

        email.attach(MIMEText(text_body, "plain", "utf-8"))
        email.attach(MIMEText(html_body, "html", "utf-8"))

        with smtplib.SMTP(self._host, self._port, timeout=30) as server:
            if self._use_tls:
                server.starttls()
            server.login(self._username, self._password)
            server.sendmail(self._sender, [self._recipient], email.as_string())

        return True

