#!/usr/bin/env python3
"""
Demo data generator for Ava's Online Market
Returns realistic sample trends when APIs are unavailable.
"""
import json
from datetime import datetime, timezone

DEMO_TRENDS = [
    {
        "term": "Digital Product Planner 2025",
        "score": 87.5,
        "source": "google_trends",
        "rank": 1,
        "traffic": "200K+",
    },
    {
        "term": "Passive Income Side Hustle Guide",
        "score": 82.0,
        "source": "reddit",
        "rank": 2,
        "upvotes": 3420,
        "comments": 287,
    },
    {
        "term": "How to start print on demand business?",
        "score": 78.5,
        "source": "people_also_ask",
        "rank": 3,
        "question": "How to start print on demand business?",
    },
    {
        "term": "Etsy SEO Checklist Template",
        "score": 75.0,
        "source": "reddit",
        "rank": 4,
        "upvotes": 1850,
        "comments": 134,
    },
    {
        "term": "Budget Tracker Spreadsheet",
        "score": 71.5,
        "source": "google_trends",
        "rank": 5,
        "traffic": "100K+",
    },
    {
        "term": "Best digital products to sell on Etsy",
        "score": 68.0,
        "source": "people_also_ask",
        "rank": 6,
        "question": "Best digital products to sell on Etsy?",
    },
    {
        "term": "Social Media Content Calendar",
        "score": 65.5,
        "source": "reddit",
        "rank": 7,
        "upvotes": 920,
        "comments": 67,
    },
    {
        "term": "Meal Prep Planner Printable",
        "score": 62.0,
        "source": "google_trends",
        "rank": 8,
        "traffic": "50K+",
    },
    {
        "term": "How to make money with Canva templates?",
        "score": 58.5,
        "source": "people_also_ask",
        "rank": 9,
        "question": "How to make money with Canva templates?",
    },
    {
        "term": "Freelance Rate Calculator",
        "score": 55.0,
        "source": "reddit",
        "rank": 10,
        "upvotes": 670,
        "comments": 45,
    },
]


def get_demo_trends():
    """Return demo trends with timestamps."""
    now = datetime.now(timezone.utc).isoformat()
    for t in DEMO_TRENDS:
        t["discovered_at"] = now
    return DEMO_TRENDS


if __name__ == "__main__":
    print(json.dumps(get_demo_trends(), indent=2))
