import logging
import random
from dataclasses import dataclass
from datetime import timedelta
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from .models import VerificationCode
from .sms import send_sms
logger = logging.getLogger(__name__)
@dataclass(frozen=True)
class VerificationConfig:
    code_length: int
    ttl_minutes: int
    max_attempts: int
def get_verification_config() -> VerificationConfig:
    return VerificationConfig(
        code_length=int(getattr(settings, "VERIFICATION_CODE_LENGTH", 6)),
        ttl_minutes=int(getattr(settings, "VERIFICATION_CODE_TTL_MINUTES", 10)),
        max_attempts=int(getattr(settings, "VERIFICATION_MAX_ATTEMPTS", 5)),
    )
def _generate_numeric_code(length: int) -> str:
    if length < 4 or length > 10:
        length = 6
    start = 10 ** (length - 1)
    end = (10 ** length) - 1
    return str(random.randint(start, end))
def mask_destination(destination: str, channel: str) -> str:
    destination = (destination or "").strip()
    if not destination:
        return ""
    if channel == VerificationCode.CHANNEL_EMAIL and "@" in destination:
        name, domain = destination.split("@", 1)
        if len(name) <= 2:
            masked_name = name[:1] + "*"
        else:
            masked_name = name[:1] + "*" * (len(name) - 2) + name[-1:]
        return f"{masked_name}@{domain}"
    if len(destination) <= 4:
        return "*" * len(destination)
    return "*" * (len(destination) - 4) + destination[-4:]
def create_and_send_code(*, user, channel: str, destination: str) -> VerificationCode:
    cfg = get_verification_config()
    code = _generate_numeric_code(cfg.code_length)
    expires_at = timezone.now() + timedelta(minutes=cfg.ttl_minutes)
    code_obj = VerificationCode(user=user, channel=channel, destination=destination, expires_at=expires_at)
    code_obj.set_code(code)
    code_obj.sent_at = timezone.now()
    code_obj.save()
    try:
        if channel == VerificationCode.CHANNEL_EMAIL:
            _send_email_code(email=destination, first_name=getattr(user, "first_name", ""), code=code)
        elif channel == VerificationCode.CHANNEL_PHONE:
            send_sms(to=destination, message=f"Your Rent verification code is {code}. It expires in {cfg.ttl_minutes} minutes.")
        else:
            logger.warning("Unknown verification channel: %s", channel)
    except Exception:
        logger.exception("Failed to send verification code")
    return code_obj
def _send_email_code(*, email: str, first_name: str, code: str) -> None:
    cfg = get_verification_config()
    subject_prefix = getattr(settings, "EMAIL_SUBJECT_PREFIX", "")
    subject = f"{subject_prefix}Verify your account".strip()
    greeting_name = (first_name or "").strip() or "there"
    message = (
        f"Hello {greeting_name},\n\n"
        f"Your verification code is: {code}\n\n"
        f"It expires in {cfg.ttl_minutes} minutes.\n\n"
        "If you did not create an account, you can ignore this email."
    )
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )

