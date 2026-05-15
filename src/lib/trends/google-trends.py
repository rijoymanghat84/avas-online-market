#!/usr/bin/env python3
"""
Google Trends scraper using pytrends.
Discovers rising search queries and interest data.
"""

import json
import sys
import time
from typing import List, Dict, Any
from pytrends.request import TrendReq

# Seed keywords to explore — expand over time
DEFAULT_SEED_KEYWORDS = [
    "meal prep", "adhd organization", "keto diet", "digital detox",
    "minimalist wardrobe", "home workout", "budget travel", "side hustle",
    "productivity planner", "self care routine", "intermittent fasting",
    "sleep hygiene", "morning routine", "habit tracker", "goal setting",
]


def get_trending_searches(country: str = "united_states") -> List[Dict[str, Any]]:
    """Fetch today's top trending searches."""
    pytrends = TrendReq(hl="en-US", tz=360)
    try:
        trending = pytrends.trending_searches(pn=country)
        results = []
        for idx, row in trending.head(20).iterrows():
            results.append({
                "keyword": row[0],
                "source": "google_trends",
                "score": 100 - idx * 5,  # Approximate ranking score
                "category": None,
                "metadata": {"rank": idx + 1, "country": country},
            })
        return results
    except Exception as e:
        print(f"Error fetching trending searches: {e}", file=sys.stderr)
        return []


def get_rising_queries(keyword: str, timeframe: str = "today 1-m") -> List[Dict[str, Any]]:
    """Get rising related queries for a seed keyword."""
    pytrends = TrendReq(hl="en-US", tz=360)
    try:
        pytrends.build_payload([keyword], cat=0, timeframe=timeframe, geo="US")
        related = pytrends.related_queries()

        results = []
        if related and keyword in related:
            rising = related[keyword].get("rising")
            if rising is not None and not rising.empty:
                for idx, row in rising.head(10).iterrows():
                    results.append({
                        "keyword": row["query"],
                        "source": "google_trends_rising",
                        "score": min(int(row.get("value", 0)), 100),
                        "category": keyword,
                        "metadata": {
                            "parent_keyword": keyword,
                            "breakout": row.get("value", 0) > 5000,
                        },
                    })
        return results
    except Exception as e:
        print(f"Error fetching rising queries for '{keyword}': {e}", file=sys.stderr)
        return []


def get_interest_over_time(keywords: List[str]) -> Dict[str, Any]:
    """Get interest over time for multiple keywords."""
    pytrends = TrendReq(hl="en-US", tz=360)
    try:
        pytrends.build_payload(keywords, cat=0, timeframe="today 3-m", geo="US")
        data = pytrends.interest_over_time()
        if data.empty:
            return {}

        # Get latest interest values
        latest = data.iloc[-1]
        return {
            kw: int(latest[kw]) for kw in keywords if kw in latest
        }
    except Exception as e:
        print(f"Error fetching interest over time: {e}", file=sys.stderr)
        return {}


def discover_all(seed_keywords: List[str] = None) -> List[Dict[str, Any]]:
    """Full discovery: trending + rising queries for all seeds."""
    seeds = seed_keywords or DEFAULT_SEED_KEYWORDS
    all_results = []

    # 1. Top trending searches today
    print("Fetching trending searches...", file=sys.stderr)
    trending = get_trending_searches()
    all_results.extend(trending)
    time.sleep(3)  # Rate limit protection

    # 2. Rising queries for each seed keyword (with backoff)
    for seed in seeds[:8]:  # Limit to avoid rate limits
        print(f"Fetching rising queries for: {seed}", file=sys.stderr)
        rising = get_rising_queries(seed)
        all_results.extend(rising)
        time.sleep(5)  # Generous rate limit protection

    # Deduplicate by keyword (keep highest score)
    seen = {}
    for r in all_results:
        kw = r["keyword"].lower().strip()
        if kw not in seen or r["score"] > seen[kw]["score"]:
            seen[kw] = r

    return list(seen.values())


if __name__ == "__main__":
    results = discover_all()
    print(json.dumps(results, indent=2), file=sys.stdout)
    sys.stdout.flush()
