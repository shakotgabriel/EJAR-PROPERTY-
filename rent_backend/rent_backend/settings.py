from pathlib import Path
from datetime import timedelta
import os
from dotenv import load_dotenv
load_dotenv()
BASE_DIR = Path(__file__).resolve().parent.parent
def _env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "y", "on"}
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "change-me")
DEBUG = _env_bool("DJANGO_DEBUG", False)
_allowed_hosts = os.getenv("DJANGO_ALLOWED_HOSTS", "*")
ALLOWED_HOSTS = [h.strip() for h in _allowed_hosts.split(",") if h.strip()]
AUTH_USER_MODEL = 'users.User'
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.AllowAny",
    ),
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.ScopedRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "login": "10/min",
        "password_reset": "5/hour",
        "verification_start": "5/hour",
        "verification_confirm": "20/hour",
    },
}
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
}
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://ejarproperties.netlify.app")
SMS_BACKEND = os.getenv("SMS_BACKEND", "console")
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER")
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    'corsheaders',
    'django_extensions',
    'django_filters',
    "rest_framework",
    'rest_framework_simplejwt',
    'properties',
    'users.apps.UsersConfig',
    'notifications.apps.NotificationsConfig',
    'messages.apps.MessagesConfig',
]
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    'corsheaders.middleware.CorsMiddleware',
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]
ROOT_URLCONF = "rent_backend.urls"
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]
WSGI_APPLICATION = "rent_backend.wsgi.application"
DATABASES = {
    "default": {}
}

# Render (and many other hosts) commonly provide a single DATABASE_URL.
# If neither DATABASE_URL nor the DB_* vars are set, fall back to local sqlite.
from urllib.parse import urlparse, parse_qs  # noqa: E402

_database_url = os.getenv("DATABASE_URL")
_db_name = os.getenv("DB_NAME")
_db_user = os.getenv("DB_USER")

if _database_url:
    _u = urlparse(_database_url)
    _scheme = (_u.scheme or "").lower()

    if _scheme in {"postgres", "postgresql"}:
        _query = parse_qs(_u.query)
        DATABASES["default"] = {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": (_u.path or "").lstrip("/"),
            "USER": _u.username,
            "PASSWORD": _u.password,
            "HOST": _u.hostname,
            "PORT": _u.port or 5432,
        }
        # Preserve common SSL options like ?sslmode=require
        if "sslmode" in _query:
            DATABASES["default"].setdefault("OPTIONS", {})
            DATABASES["default"]["OPTIONS"]["sslmode"] = _query["sslmode"][0]
    elif _scheme == "sqlite":
        db_path = (_u.path or "").lstrip("/")
        DATABASES["default"] = {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": db_path or (BASE_DIR / "db.sqlite3"),
        }
    else:
        # Unknown scheme; keep Django's normal error path.
        DATABASES["default"] = {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("DB_NAME"),
            "USER": os.getenv("DB_USER"),
            "PASSWORD": os.getenv("DB_PASSWORD"),
            "HOST": os.getenv("DB_HOST"),
            "PORT": os.getenv("DB_PORT", 5432),
        }
elif _db_name and _db_user:
    DATABASES["default"] = {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": _db_name,
        "USER": _db_user,
        "PASSWORD": os.getenv("DB_PASSWORD"),
        "HOST": os.getenv("DB_HOST"),
        "PORT": int(os.getenv("DB_PORT", "5432")),
    }
else:
    DATABASES["default"] = {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True
STATIC_URL = "static/"
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
_cors_origins = os.getenv("CORS_ALLOWED_ORIGINS")
if _cors_origins:
    CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors_origins.split(",") if o.strip()]
else:
    # Sensible defaults for local dev + production frontend.
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        FRONTEND_URL,
        "https://ejarproperties.netlify.app",
    ]

# Netlify deploy previews use randomized subdomains like:
# https://<hash>--ejarproperties.netlify.app
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*--ejarproperties\\.netlify\\.app$",
]
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

