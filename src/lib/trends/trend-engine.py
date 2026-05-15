#!/usr/bin/env python3
"""
Master Trend Engine for Ava'sOnlineMarket.
Orchestrates Google Trends, Reddit, and PAA discovery.
Outputs unified JSON for the Next.js API to consume.
"""

import json
import sys
import os
from datetime import datetime
from typing import List, Dict, Any

# Import individual scrapers
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from google_trends import discover_all as discover_google
from reddit_scraper import discover_all as discover_reddit
from people_also_ask import discover_all as discover_paa


def merge_results(
    google_results: List[Dict],
    reddit_results: List[Dict],
    paa_results: List[Dict],
) -> List[Dict[str, Any]]:
    """Merge and rank results from all sources."""
    all_results = []

    # Weight scores by source reliability
    for r in google_results:
        r["weighted_score"] = r.get("score", 50) * 1.2  # Google = highest trust
        all_results.append(r)

    for r in reddit_results:
        r["weighted_score"] = r.get("score", 50) * 1.0  # Reddit = community signal
        all_results.append(r)

    for r in paa_results:
        r["weighted_score"] = r.get("score", 50) * 0.9  # PAA = intent signal
        all_results.append(r)

    # Sort by weighted score descending
    all_results.sort(key=lambda x: x["weighted_score"], reverse=True)

    # Add rank and timestamp
    for idx, r in enumerate(all_results):
        r["rank"] = idx + 1
        r["discovered_at"] = datetime.utcnow().isoformat()

    return all_results


def run_discovery(
    seed_keywords: List[str] = None,
    enable_google: bool = True,
    enable_reddit: bool = True,
    enable_paa: bool = True,
) -> Dict[str, Any]:
    """Run full discovery across all sources."""
    print("🚀 Ava'sOnlineMarket Trend Engine")
    print("=" * 50)

    google_results = []
    reddit_results = []
    paa_results = []

    if enable_google:
        print("\n📈 Discovering Google Trends...")
        try:
            google_results = discover_google(seed_keywords)
            print(f"   Found {len(google_results)} trending queries")
        except Exception as e:
            print(f"   Google Trends failed: {e}")

    if enable_reddit:
        print("\n🔥 Discovering Reddit trends...")
        try:
            reddit_results = discover_reddit()
            print(f"   Found {len(reddit_results)} hot posts")
        except Exception as e:
            print(f"   Reddit failed: {e}")

    if enable_paa:
        print("\n❓ Discovering People Also Ask...")
        try:
            paa_results = discover_paa(seed_keywords)
            print(f"   Found {len(paa_results)} PAA questions")
        except Exception as e:
            print(f"   PAA failed: {e}")

    merged = merge_results(google_results, reddit_results, paa_results)

    output = {
        "run_id": datetime.utcnow().strftime("%Y%m%d_%H%M%S"),
        "timestamp": datetime.utcnow().isoformat(),
        "sources": {
            "google_trends": len(google_results),
            "reddit": len(reddit_results),
            "paa": len(paa_results),
        },
        "total_discovered": len(merged),
        "results": merged[:50],  # Top 50
    }

    print(f"\n✅ Discovery complete: {len(merged)} unique ideas")
    return output


if __name__ == "__main__":
    results = run_discovery()
    print(json.dumps(results, indent=2))
