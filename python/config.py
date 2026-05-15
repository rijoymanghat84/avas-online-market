"""
Ava's Online Market - Trend Engine Configuration
Proxy-ready: toggle between no-proxy and residential proxy modes
"""
import os
from dotenv import load_dotenv

load_dotenv()

# ── Proxy Configuration ──────────────────────────────────────────────
# Set PROXY_MODE to one of: "none", "webshare_rotating", "webshare_static"
PROXY_MODE = os.getenv("PROXY_MODE", "none")

# WebShare credentials (fill these in when you buy proxy)
WEBSHARE_USERNAME = os.getenv("WEBSHARE_USERNAME", "")
WEBSHARE_PASSWORD = os.getenv("WEBSHARE_PASSWORD", "")
WEBSHARE_PROXY_HOST = os.getenv("WEBSHARE_PROXY_HOST", "p.webshare.io")
WEBSHARE_PROXY_PORT = int(os.getenv("WEBSHARE_PROXY_PORT", "80"))

# Rotating residential endpoint (WebShare)
# Format: http://username:password@p.webshare.io:80
WEBSHARE_ROTATING_URL = os.getenv(
    "WEBSHARE_ROTATING_URL",
    f"http://{WEBSHARE_USERNAME}:{WEBSHARE_PASSWORD}@{WEBSHARE_PROXY_HOST}:{WEBSHARE_PROXY_PORT}"
)

# Static residential endpoint (if you buy a static IP)
WEBSHARE_STATIC_URL = os.getenv("WEBSHARE_STATIC_URL", "")

# ── Reddit API Credentials ───────────────────────────────────────────
REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID", "")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET", "")
REDDIT_USER_AGENT = os.getenv("REDDIT_USER_AGENT", "AvasOnlineMarket/1.0")

# ── Google Trends Settings ───────────────────────────────────────────
# Geo target: US, CA, GB, etc.
TRENDS_GEO = os.getenv("TRENDS_GEO", "US")
TRENDS_TIMEFRAME = os.getenv("TRENDS_TIMEFRAME", "today 12-m")

# ── Discovery Settings ───────────────────────────────────────────────
# Number of trends to discover per run
MAX_TRENDS_PER_RUN = int(os.getenv("MAX_TRENDS_PER_RUN", "20"))
# Minimum interest score to consider (0-100)
MIN_INTEREST_SCORE = int(os.getenv("MIN_INTEREST_SCORE", "25"))
# Categories to focus on (comma-separated)
FOCUS_CATEGORIES = os.getenv("FOCUS_CATEGORIES", "business,finance,health,technology,lifestyle")


def get_proxy_dict():
    """
    Returns proxy dict for requests library based on PROXY_MODE.
    Usage: requests.get(url, proxies=get_proxy_dict())
    """
    if PROXY_MODE == "none":
        return None
    elif PROXY_MODE == "webshare_rotating":
        if not WEBSHARE_USERNAME or not WEBSHARE_PASSWORD:
            print("[WARN] Proxy mode is webshare_rotating but credentials not set. Falling back to no proxy.")
            return None
        return {
            "http": WEBSHARE_ROTATING_URL,
            "https": WEBSHARE_ROTATING_URL,
        }
    elif PROXY_MODE == "webshare_static":
        if not WEBSHARE_STATIC_URL:
            print("[WARN] Proxy mode is webshare_static but STATIC_URL not set. Falling back to no proxy.")
            return None
        return {
            "http": WEBSHARE_STATIC_URL,
            "https": WEBSHARE_STATIC_URL,
        }
    else:
        return None


def get_pytrends_proxy():
    """
    Returns proxy string for pytrends (Google Trends).
    pytrends uses a single proxy string, not a dict.
    """
    if PROXY_MODE == "none":
        return None
    elif PROXY_MODE == "webshare_rotating":
        if not WEBSHARE_USERNAME or not WEBSHARE_PASSWORD:
            return None
        return WEBSHARE_ROTATING_URL
    elif PROXY_MODE == "webshare_static":
        return WEBSHARE_STATIC_URL or None
    return None


if __name__ == "__main__":
    print(f"Proxy mode: {PROXY_MODE}")
    print(f"Proxy dict: {get_proxy_dict()}")
    print(f"PyTrends proxy: {get_pytrends_proxy()}")