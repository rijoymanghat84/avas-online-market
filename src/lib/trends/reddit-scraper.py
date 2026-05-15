#!/usr/bin/env python3
"""
Reddit trend scraper using the official OAuth API.
Discovers hot posts from relevant subreddits.

Requires Reddit app registration at:
https://www.reddit.com/prefs/apps/

Set environment variables:
  REDDIT_CLIENT_ID
  REDDIT_CLIENT_SECRET
  REDDIT_USER_AGENT
"""

import json
import os
import sys
import time
from typing import List, Dict, Any
import urllib.request
import urllib.parse

# Subreddits to monitor for PDF guide ideas
DEFAULT_SUBREDDITS = [
    "productivity", "selfimprovement", "personalfinance", "minimalism",
    "fitness", "mealprep", "keto", "adhd", "digitalminimalism",
    "sidehustle", "passiveincome", "entrepreneur", "smallbusiness",
    "declutter", "organization", "habits", "getdisciplined",
]

REDDIT_API_BASE = "https://oauth.reddit.com"


def get_access_token() -> str:
    """Get OAuth access token using client credentials flow."""
    client_id = os.environ.get("REDDIT_CLIENT_ID")
    client_secret = os.environ.get("REDDIT_CLIENT_SECRET")
    user_agent = os.environ.get("REDDIT_USER_AGENT", "Ava'sOnlineMarket/1.0")

    if not client_id or not client_secret:
        raise ValueError("REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET must be set")

    auth = f"{client_id}:{client_secret}"
    import base64
    auth_b64 = base64.b64encode(auth.encode()).decode()

    req = urllib.request.Request(
        "https://www.reddit.com/api/v1/access_token",
        data=b"grant_type=client_credentials",
        headers={
            "Authorization": f"Basic {auth_b64}",
            "User-Agent": user_agent,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        method="POST",
    )

    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
        return data["access_token"]


def fetch_subreddit_posts(subreddit: str, token: str, sort: str = "hot", limit: int = 25) -> List[Dict[str, Any]]:
    """Fetch hot/top posts from a subreddit."""
    user_agent = os.environ.get("REDDIT_USER_AGENT", "Ava'sOnlineMarket/1.0")

    url = f"{REDDIT_API_BASE}/r/{subreddit}/{sort}?limit={limit}"
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {token}",
            "User-Agent": user_agent,
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read())
            posts = []
            for child in data.get("data", {}).get("children", []):
                post = child["data"]
                posts.append({
                    "keyword": post["title"],
                    "source": "reddit",
                    "score": min(post.get("score", 0), 100),
                    "category": subreddit,
                    "metadata": {
                        "subreddit": subreddit,
                        "upvotes": post.get("score", 0),
                        "comments": post.get("num_comments", 0),
                        "permalink": post.get("permalink", ""),
                        "url": post.get("url", ""),
                    },
                })
            return posts
    except Exception as e:
        print(f"Error fetching r/{subreddit}: {e}", file=sys.stderr)
        return []


def discover_all(subreddits: List[str] = None) -> List[Dict[str, Any]]:
    """Fetch hot posts from all monitored subreddits."""
    subs = subreddits or DEFAULT_SUBREDDITS

    try:
        token = get_access_token()
    except ValueError as e:
        print(f"Reddit auth not configured: {e}", file=sys.stderr)
        return []
    except Exception as e:
        print(f"Reddit auth failed: {e}", file=sys.stderr)
        return []

    all_results = []
    for sub in subs:
        print(f"Fetching r/{sub}...")
        posts = fetch_subreddit_posts(sub, token)
        all_results.extend(posts)
        time.sleep(1)  # Rate limit: 60 req/min for OAuth

    # Deduplicate by keyword
    seen = {}
    for r in all_results:
        kw = r["keyword"].lower().strip()[:100]
        if kw not in seen or r["score"] > seen[kw]["score"]:
            seen[kw] = r

    return list(seen.values())


if __name__ == "__main__":
    results = discover_all()
    print(json.dumps(results, indent=2))
