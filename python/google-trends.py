#!/usr/bin/env python3
"""
Google Trends Scraper for Ava's Online Market
Uses the internal API endpoint with proper headers + cookie jar.
Proxy-aware: works with residential proxy when configured.
"""
import json
import re
import sys
from typing import List, Dict
import requests
from config import get_proxy_dict, TRENDS_GEO


def get_daily_trends(geo: str = TRENDS_GEO) -> List[Dict]:
    """
    Fetch daily trending searches from Google Trends.
    Uses the internal API endpoint that the web UI calls.
    """
    proxy = get_proxy_dict()
    session = requests.Session()
    
    # Step 1: Get the main page to establish cookies
    main_url = f"https://trends.google.com/trends/trendingsearches/daily?geo={geo}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
    }
    
    try:
        # Get main page to establish session
        r1 = session.get(
            main_url,
            headers=headers,
            proxies=proxy,
            timeout=20,
            allow_redirects=True
        )
        r1.raise_for_status()
        
        # Extract the token from the page
        token_match = re.search(r'"token":"([^"]+)"', r1.text)
        if not token_match:
            # Try alternative pattern
            token_match = re.search(r'"SNlM0e":"([^"]+)"', r1.text)
        
        token = token_match.group(1) if token_match else ""
        
        # Step 2: Call the internal API
        api_url = f"https://trends.google.com/trends/api/dailytrends"
        params = {
            "hl": "en-US",
            "tz": "-240",
            "geo": geo,
            "ns": "15",
        }
        if token:
            params["token"] = token
        
        api_headers = {
            **headers,
            "Accept": "application/json, text/plain, */*",
            "Referer": main_url,
            "X-Requested-With": "XMLHttpRequest",
        }
        
        r2 = session.get(
            api_url,
            headers=api_headers,
            params=params,
            proxies=proxy,
            timeout=20,
        )
        r2.raise_for_status()
        
        # Parse response - Google prefixes JSON with )]}',
        text = r2.text
        if text.startswith(")]}'"):
            text = text[4:]
        
        data = json.loads(text)
        
        results = []
        default_stories = data.get("default", {}).get("trendingSearchesDays", [])
        
        for day_data in default_stories[:1]:  # Just today
            for story in day_data.get("trendingSearches", [])[:20]:
                title = story.get("title", {}).get("query", "")
                traffic = story.get("formattedTraffic", "")
                
                # Extract related articles for context
                articles = []
                for article in story.get("articles", [])[:3]:
                    articles.append({
                        "title": article.get("title", ""),
                        "source": article.get("source", ""),
                        "url": article.get("url", ""),
                    })
                
                results.append({
                    "term": title,
                    "traffic": traffic,
                    "articles": articles,
                    "rank": len(results) + 1,
                    "source": "google_trends",
                    "geo": geo,
                })
        
        return results
        
    except requests.exceptions.ProxyError as e:
        return [{
            "error": "PROXY_ERROR",
            "message": f"Proxy failed: {str(e)}. Check credentials in .env",
        }]
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 429:
            return [{
                "error": "RATE_LIMITED",
                "message": "Google rate limited. Enable residential proxy (PROXY_MODE=webshare_rotating) in .env",
            }]
        return [{
            "error": "HTTP_ERROR",
            "message": f"HTTP {e.response.status_code}: {e.response.text[:200]}",
        }]
    except Exception as e:
        return [{
            "error": "FETCH_FAILED",
            "message": str(e),
        }]


def get_trending_searches(geo: str = TRENDS_GEO) -> List[Dict]:
    """Alias for get_daily_trends."""
    return get_daily_trends(geo)


def get_interest_over_time(keywords: List[str], geo: str = TRENDS_GEO) -> Dict:
    """
    Get interest-over-time data via Google Trends explore API.
    Simplified: returns trend direction only.
    """
    proxy = get_proxy_dict()
    results = {}
    
    for keyword in keywords:
        try:
            session = requests.Session()
            
            # Get explore page
            explore_url = f"https://trends.google.com/trends/explore"
            params = {
                "q": keyword,
                "geo": geo,
                "hl": "en",
            }
            
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            }
            
            r = session.get(
                explore_url,
                headers=headers,
                params=params,
                proxies=proxy,
                timeout=15,
            )
            
            text = r.text
            
            # Extract timeline data
            match = re.search(r'"timelineData":(\[.*?\])', text)
            
            if match:
                import ast
                timeline = ast.literal_eval(match.group(1))
                values = [point.get("value", [0])[0] for point in timeline]
                
                if len(values) >= 2:
                    first_half = sum(values[:len(values)//2]) / max(len(values)//2, 1)
                    second_half = sum(values[len(values)//2:]) / max(len(values) - len(values)//2, 1)
                    
                    if second_half > first_half * 1.2:
                        trend = "rising"
                    elif second_half < first_half * 0.8:
                        trend = "falling"
                    else:
                        trend = "stable"
                else:
                    trend = "unknown"
                
                results[keyword] = {
                    "trend": trend,
                    "values": values[-12:] if len(values) > 12 else values,
                }
            else:
                results[keyword] = {"trend": "unknown", "values": []}
                
        except Exception as e:
            results[keyword] = {"error": str(e)}
    
    return results


def get_related_queries(keyword: str, geo: str = TRENDS_GEO) -> Dict:
    """
    Get related queries from Google Trends explore page.
    """
    proxy = get_proxy_dict()
    
    try:
        session = requests.Session()
        url = f"https://trends.google.com/trends/explore?q={requests.utils.quote(keyword)}&geo={geo}"
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }
        
        r = session.get(url, headers=headers, proxies=proxy, timeout=15)
        text = r.text
        
        # Extract related queries
        top = []
        rising = []
        
        related_pattern = re.findall(r'"query":"([^"]+)","value":(\d+)', text)
        for query, value in related_pattern[:10]:
            top.append({"query": query, "value": int(value)})
        
        return {"top": top, "rising": rising}
        
    except Exception as e:
        return {"top": [], "rising": [], "error": str(e)}


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Google Trends Scraper")
    parser.add_argument("--action", choices=["trending", "interest", "related"], default="trending")
    parser.add_argument("--keywords", nargs="+", help="Keywords for interest/related")
    parser.add_argument("--geo", default=TRENDS_GEO, help="Geo code (US, CA, GB)")
    
    args = parser.parse_args()
    
    if args.action == "trending":
        results = get_daily_trends(args.geo)
        print(json.dumps(results, indent=2))
    elif args.action == "interest":
        if not args.keywords:
            print(json.dumps({"error": "No keywords"}))
            sys.exit(1)
        results = get_interest_over_time(args.keywords, args.geo)
        print(json.dumps(results, indent=2))
    elif args.action == "related":
        if not args.keywords:
            print(json.dumps({"error": "No keywords"}))
            sys.exit(1)
        results = get_related_queries(args.keywords[0], args.geo)
        print(json.dumps(results, indent=2))
