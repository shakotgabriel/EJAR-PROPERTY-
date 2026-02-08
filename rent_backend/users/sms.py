import base64
import json
import logging
import os
import urllib.parse
import urllib.request
from django.conf import settings
logger = logging.getLogger(__name__)
def send_sms(*, to: str, message: str) -> None:
    backend = getattr(settings, "SMS_BACKEND", os.getenv("SMS_BACKEND", "console"))
    if backend == "console":
        logger.info("[SMS console] to=%s message=%s", to, message)
        return
    if backend == "twilio":
        _send_sms_twilio(to=to, message=message)
        return
    raise RuntimeError(f"Unsupported SMS_BACKEND: {backend}")
def _send_sms_twilio(*, to: str, message: str) -> None:
    account_sid = getattr(settings, "TWILIO_ACCOUNT_SID", None)
    auth_token = getattr(settings, "TWILIO_AUTH_TOKEN", None)
    from_number = getattr(settings, "TWILIO_FROM_NUMBER", None)
    if not account_sid or not auth_token or not from_number:
        raise RuntimeError("Twilio settings missing: TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_FROM_NUMBER")
    url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
    data = urllib.parse.urlencode({"To": to, "From": from_number, "Body": message}).encode("utf-8")
    auth = base64.b64encode(f"{account_sid}:{auth_token}".encode("utf-8")).decode("ascii")
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Authorization", f"Basic {auth}")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    with urllib.request.urlopen(req, timeout=15) as resp:
        body = resp.read().decode("utf-8")
        if resp.status >= 400:
            raise RuntimeError(f"Twilio SMS failed: {resp.status} {body}")
        try:
            parsed = json.loads(body)
            sid = parsed.get("sid")
        except Exception:
            sid = None
        logger.info("Twilio SMS sent sid=%s to=%s", sid, to)

