#!/usr/bin/env python3
"""
Reddit Trend Scraper for Ava's Online Market
Scrapes trending topics from subreddits related to business/side-hustles.
Works without proxy (Reddit doesn't block VPS IPs like Google does).
"""
import json
import re
from typing import List, Dict
from config import REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER_AGENT, get_proxy_dict


def get_reddit_trends(subreddits: List[str] = None, limit: int = 25) -> List[Dict]:
    """
    Fetch hot posts from business/side-hustle subreddits.
    Returns list of {title, subreddit, upvotes, comments, url} dicts.
    """
    if subreddits is None:
        subreddits = [
            "sidehustle",
            "passive_income",
            "smallbusiness",
            "Entrepreneur",
            "beermoney",
            "WorkOnline",
            "Flipping",
            "Etsy",
            "printondemand",
        ]
    
    # Check if Reddit credentials are configured
    if not REDDIT_CLIENT_ID or not REDDIT_CLIENT_SECRET:
        return [{
            "error": "REDDIT_NOT_CONFIGURED",
            "message": "Reddit API credentials not set. Add REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET to .env",
            "setup_url": "https://www.reddit.com/prefs/apps"
        }]
    
    try:
        import praw
        
        reddit = praw.Reddit(
            client_id=REDDIT_CLIENT_ID,
            client_secret=REDDIT_CLIENT_SECRET,
            user_agent=REDDIT_USER_AGENT,
        )
        
        results = []
        for sub_name in subreddits:
            try:
                subreddit = reddit.subreddit(sub_name)
                for post in subreddit.hot(limit=limit // len(subreddits)):
                    # Skip pinned/announcement posts
                    if post.stickied:
                        continue
                    
                    results.append({
                        "term": post.title,
                        "subreddit": sub_name,
                        "upvotes": post.score,
                        "comments": post.num_comments,
                        "url": f"https://reddit.com{post.permalink}",
                        "source": "reddit",
                        "rank": len(results) + 1,
                    })
            except Exception as e:
                print(json.dumps({"warn": f"Failed to fetch r/{sub_name}: {str(e)}"}))
                continue
        
        # Sort by upvotes descending
        results.sort(key=lambda x: x.get("upvotes", 0), reverse=True)
        
        # Re-rank after sort
        for i, r in enumerate(results):
            r["rank"] = i + 1
        
        return results[:limit]
        
    except Exception as e:
        return [{
            "error": "REDDIT_FETCH_FAILED",
            "message": str(e)
        }]


def extract_keywords_from_posts(posts: List[Dict]) -> List[str]:
    """
    Extract potential product/trend keywords from Reddit post titles.
    Simple keyword extraction — can be enhanced with NLP later.
    """
    keywords = set()
    
    # Common patterns that indicate a trend or product
    patterns = [
        r"\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b",  # Title Case phrases
        r"\b(\w+\s+guide)\b",
        r"\b(\w+\s+template)\b",
        r"\b(\w+\s+planner)\b",
        r"\b(\w+\s+checklist)\b",
        r"\b(\w+\s+tracker)\b",
    ]
    
    for post in posts:
        title = post.get("term", "")
        for pattern in patterns:
            matches = re.findall(pattern, title, re.IGNORECASE)
            for match in matches:
                keywords.add(match.lower())
    
    return sorted(list(keywords))


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Reddit Trend Scraper")
    parser.add_argument("--limit", type=int, default=25, help="Max posts to fetch")
    parser.add_argument("--extract-keywords", action="store_true", help="Extract keywords from titles")
    
    args = parser.parse_args()
    
    posts = get_reddit_trends(limit=args.limit)
    
    if args.extract_keywords:
        keywords = extract_keywords_from_posts(posts)
        print(json.dumps({"posts": posts, "keywords": keywords}, indent=2))
    else:
        print(json.dumps(posts, indent=2))
