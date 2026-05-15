#!/usr/bin/env python3
"""
Ava's Online Market - Master Trend Engine
Orchestrates Google Trends, Reddit, and People Also Ask into unified trend feed.
Proxy-aware: gracefully degrades when proxy is not configured.
"""
import json
import sys
import time
import os
from typing import List, Dict
from datetime import datetime, timezone

from config import (
    PROXY_MODE,
    MAX_TRENDS_PER_RUN,
    MIN_INTEREST_SCORE,
    FOCUS_CATEGORIES,
    get_proxy_dict,
)


def fetch_google_trends(geo: str = "US") -> List[Dict]:
    """Fetch from Google Trends (requires proxy for reliable VPS usage)."""
    try:
        from google_trends import get_trending_searches
        trends = get_trending_searches(geo)
        
        # Check for error responses
        if trends and "error" in trends[0]:
            print(json.dumps({"warn": f"Google Trends: {trends[0]['message']}"}), file=sys.stderr)
            return []
        
        return trends
    except Exception as e:
        print(json.dumps({"warn": f"Google Trends failed: {str(e)}"}), file=sys.stderr)
        return []


def fetch_reddit_trends(limit: int = 25) -> List[Dict]:
    """Fetch from Reddit (works without proxy)."""
    try:
        from reddit_scraper import get_reddit_trends
        trends = get_reddit_trends(limit=limit)
        
        if trends and "error" in trends[0]:
            print(json.dumps({"warn": f"Reddit: {trends[0]['message']}"}), file=sys.stderr)
            return []
        
        return trends
    except Exception as e:
        print(json.dumps({"warn": f"Reddit failed: {str(e)}"}), file=sys.stderr)
        return []


def fetch_paa_trends(seed_keywords: List[str] = None) -> List[Dict]:
    """Fetch from People Also Ask (works without proxy, benefits from it)."""
    if seed_keywords is None:
        seed_keywords = [
            "side hustle ideas",
            "passive income",
            "print on demand",
            "digital products",
            "Etsy selling",
        ]
    
    try:
        from people_also_ask import discover_trends_from_paa
        trends = discover_trends_from_paa(seed_keywords)
        
        if trends and "error" in trends[0]:
            print(json.dumps({"warn": f"PAA: {trends[0]['message']}"}), file=sys.stderr)
            return []
        
        return trends
    except Exception as e:
        print(json.dumps({"warn": f"PAA failed: {str(e)}"}), file=sys.stderr)
        return []


def fetch_demo_trends() -> List[Dict]:
    """Return demo trends when all sources fail."""
    try:
        from demo_data import get_demo_trends
        return get_demo_trends()
    except Exception as e:
        print(json.dumps({"warn": f"Demo data failed: {str(e)}"}), file=sys.stderr)
        return []


def score_trend(trend: Dict) -> float:
    """
    Score a trend for business potential (0-100).
    Higher = better opportunity for PDF product.
    """
    score = 50.0  # Base score
    
    # Source weighting
    source_weights = {
        "google_trends": 1.0,
        "reddit": 0.8,
        "people_also_ask": 0.7,
    }
    score *= source_weights.get(trend.get("source", ""), 0.5)
    
    # Reddit-specific scoring
    if trend.get("source") == "reddit":
        upvotes = trend.get("upvotes", 0)
        comments = trend.get("comments", 0)
        # Engagement ratio matters more than raw numbers
        if upvotes > 100:
            score += min(upvotes / 100, 20)
        if comments > 20:
            score += min(comments / 10, 15)
    
    # PAA-specific: questions indicate buyer intent
    if trend.get("source") == "people_also_ask":
        question = trend.get("question", "")
        buyer_keywords = ["how to", "best", "guide", "template", "checklist", "planner"]
        for kw in buyer_keywords:
            if kw in question.lower():
                score += 10
                break
    
    # Google Trends rank bonus (lower rank = higher score)
    rank = trend.get("rank", 999)
    if rank <= 3:
        score += 20
    elif rank <= 10:
        score += 10
    
    return min(score, 100)


def discover_trends(
    sources: List[str] = None,
    max_trends: int = MAX_TRENDS_PER_RUN,
    min_score: float = MIN_INTEREST_SCORE,
    use_demo: bool = False,
) -> Dict:
    """
    Main discovery function. Fetches from all enabled sources,
    scores, ranks, and returns unified trend list.
    
    Args:
        sources: List of sources to use ["google", "reddit", "paa"]. None = all.
        max_trends: Max trends to return
        min_score: Minimum score threshold
        use_demo: Force demo data
    """
    if sources is None:
        sources = ["google", "reddit", "paa"]
    
    all_trends = []
    source_stats = {}
    
    if use_demo:
        print("[ENGINE] Using demo data...", file=sys.stderr)
        demo_trends = fetch_demo_trends()
        source_stats["demo"] = len(demo_trends)
        all_trends.extend(demo_trends)
    else:
        # Fetch from each source
        if "google" in sources:
            print("[ENGINE] Fetching Google Trends...", file=sys.stderr)
            gt = fetch_google_trends()
            source_stats["google_trends"] = len(gt)
            all_trends.extend(gt)
            time.sleep(1)
        
        if "reddit" in sources:
            print("[ENGINE] Fetching Reddit trends...", file=sys.stderr)
            rt = fetch_reddit_trends(limit=max_trends)
            source_stats["reddit"] = len(rt)
            all_trends.extend(rt)
            time.sleep(0.5)
        
        if "paa" in sources:
            print("[ENGINE] Fetching People Also Ask...", file=sys.stderr)
            pt = fetch_paa_trends()
            source_stats["people_also_ask"] = len(pt)
            all_trends.extend(pt)
    
    # If no trends found, fall back to demo
    if len(all_trends) == 0 and not use_demo:
        print("[ENGINE] No trends found from sources. Falling back to demo data...", file=sys.stderr)
        demo_trends = fetch_demo_trends()
        source_stats["demo"] = len(demo_trends)
        all_trends.extend(demo_trends)
    
    # Score each trend
    for trend in all_trends:
        trend["score"] = round(score_trend(trend), 1)
        trend["discovered_at"] = datetime.now(timezone.utc).isoformat()
    
    # Filter by minimum score
    filtered = [t for t in all_trends if t["score"] >= min_score]
    
    # Sort by score descending
    filtered.sort(key=lambda x: x["score"], reverse=True)
    
    # Take top N
    top_trends = filtered[:max_trends]
    
    # Re-rank
    for i, t in enumerate(top_trends):
        t["rank"] = i + 1
    
    return {
        "trends": top_trends,
        "meta": {
            "total_discovered": len(all_trends),
            "total_qualified": len(filtered),
            "returned": len(top_trends),
            "sources_used": sources,
            "source_counts": source_stats,
            "proxy_mode": PROXY_MODE,
            "min_score": min_score,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    }


def get_trend_details(keyword: str) -> Dict:
    """
    Get deep details for a specific trend keyword.
    Returns: interest over time, related queries, PAA questions.
    """
    from google_trends import get_interest_over_time, get_related_queries
    from people_also_ask import get_people_also_ask
    
    result = {
        "keyword": keyword,
        "interest_over_time": {},
        "related_queries": {"top": [], "rising": []},
        "people_also_ask": [],
    }
    
    try:
        result["interest_over_time"] = get_interest_over_time([keyword])
    except Exception as e:
        result["interest_error"] = str(e)
    
    try:
        result["related_queries"] = get_related_queries(keyword)
    except Exception as e:
        result["related_error"] = str(e)
    
    try:
        result["people_also_ask"] = get_people_also_ask(keyword)
    except Exception as e:
        result["paa_error"] = str(e)
    
    return result


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Ava's Online Market - Trend Engine")
    parser.add_argument("--discover", action="store_true", help="Run full discovery")
    parser.add_argument("--sources", nargs="+", choices=["google", "reddit", "paa"],
                        help="Sources to use (default: all)")
    parser.add_argument("--max", type=int, default=MAX_TRENDS_PER_RUN,
                        help=f"Max trends to return (default: {MAX_TRENDS_PER_RUN})")
    parser.add_argument("--min-score", type=int, default=MIN_INTEREST_SCORE,
                        help=f"Minimum score threshold (default: {MIN_INTEREST_SCORE})")
    parser.add_argument("--details", help="Get deep details for a keyword")
    parser.add_argument("--demo", action="store_true", help="Use demo data")
    
    args = parser.parse_args()
    
    if args.details:
        result = get_trend_details(args.details)
        print(json.dumps(result, indent=2))
    elif args.discover:
        result = discover_trends(
            sources=args.sources,
            max_trends=args.max,
            min_score=args.min_score,
            use_demo=args.demo,
        )
        print(json.dumps(result, indent=2))
    else:
        # Default: run discovery
        result = discover_trends()
        print(json.dumps(result, indent=2))
