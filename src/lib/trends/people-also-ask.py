#!/usr/bin/env python3
"""
People Also Ask (PAA) scraper.
Extracts related questions from Google SERP.
Uses requests + BeautifulSoup (no browser needed for PAA).
"""

import json
import re
import sys
import time
import urllib.request
import urllib.parse
from typing import List, Dict, Any

# Seed keywords to explore PAA for
DEFAULT_SEED_KEYWORDS = [
    "how to meal prep", "adhd organization tips", "keto diet for beginners",
    "digital detox challenge", "minimalist wardrobe essentials",
    "home workout plan", "budget travel tips", "side hustle ideas 2026",
]


def fetch_serp(keyword: str) -> str:
    """Fetch Google SERP HTML for a keyword."""
    query = urllib.parse.quote_plus(keyword)
    url = f"https://www.google.com/search?q={query}&hl=en&gl=us"

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept": (
            "text/html,application/xhtml+xml,application/xml;q=0.9,"
            "image/webp,*/*;q=0.8"
        ),
        "Accept-Language": "en-US,en;q=0.5",
    }

    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.read().decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"Error fetching SERP for '{keyword}': {e}", file=sys.stderr)
        return ""


def extract_paa_questions(html: str) -> List[str]:
    """Extract People Also Ask questions from SERP HTML."""
    questions = []

    # Pattern 1: data-q attribute (most common)
    pattern1 = re.findall(r'data-q="([^"]+)"', html)
    questions.extend(pattern1)

    # Pattern 2: aria-level questions
    pattern2 = re.findall(r'aria-level="3"[^>]*>([^<]+)', html)
    questions.extend(pattern2)

    # Pattern 3: jsname with question text
    pattern3 = re.findall(r'<span[^>]*>(How [^<]+|What [^<]+|Why [^<]+|Can [^<]+|Is [^<]+|Does [^<]+)</span>', html)
    questions.extend(pattern3)

    # Clean and deduplicate
    cleaned = []
    for q in questions:
        q = q.strip()
        if len(q) > 15 and len(q) < 200 and q.endswith("?"):
            if q not in cleaned:
                cleaned.append(q)

    return cleaned[:10]  # Top 10 unique questions


def discover_all(seed_keywords: List[str] = None) -> List[Dict[str, Any]]:
    """Fetch PAA questions for all seed keywords."""
    seeds = seed_keywords or DEFAULT_SEED_KEYWORDS
    all_results = []

    for seed in seeds:
        print(f"Fetching PAA for: {seed}")
        html = fetch_serp(seed)
        if html:
            questions = extract_paa_questions(html)
            for idx, q in enumerate(questions):
                all_results.append({
                    "keyword": q,
                    "source": "paa",
                    "score": 80 - idx * 5,
                    "category": seed,
                    "metadata": {
                        "parent_keyword": seed,
                        "question_position": idx + 1,
                    },
                })
        time.sleep(2)  # Be polite to Google

    # Deduplicate
    seen = {}
    for r in all_results:
        kw = r["keyword"].lower().strip()
        if kw not in seen or r["score"] > seen[kw]["score"]:
            seen[kw] = r

    return list(seen.values())


if __name__ == "__main__":
    results = discover_all()
    print(json.dumps(results, indent=2))
