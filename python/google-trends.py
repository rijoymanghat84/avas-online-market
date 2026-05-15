#!/usr/bin/env python3
"""
Google Trends Scraper for Ava's Online Market
Fetches daily trending searches via direct HTTP (more reliable than pytrends).
Proxy-aware: works with residential proxy when configured.
"""
import json
import re
import sys
from typing import List, Dict
import requests
from bs4 import BeautifulSoup
from config import get_proxy_dict, TRENDS_GEO


def get_daily_trends(geo: str = TRENDS_GEO) -> List[Dict]:
    """
    Fetch daily trending searches from Google Trends.
    Uses the RSS feed endpoint which is more stable than the web API.
    """
    proxy = get_proxy_dict()
    
    # Google Trends RSS feed for daily trends
    # Geo codes: US, CA, GB, AU, IN, etc.
    url = f"https://trends.google.com/trends/trendingsearches/daily/rss?geo={geo}"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/rss+xml,application/xml;q=0.9,*/*;q=0.8",
    }
    
    try:
        response = requests.get(
            url,
            headers=headers,
            proxies=proxy,
            timeout=20,
            allow_redirects=True
        )
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, "xml")
        
        results = []
        items = soup.find_all("item")
        
        for idx, item in enumerate(items[:20]):  # Top 20
            title = item.find("title")
            traffic = item.find("ht:approx_traffic")
            pub_date = item.find("pubDate")
            picture = item.find("ht:picture")
            
            results.append({
                "term": title.text if title else "Unknown",
                "traffic": traffic.text if traffic else None,
                "published": pub_date.text if pub_date else None,
                "image": picture.text if picture else None,
                "rank": idx + 1,
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
            "message": f"HTTP {e.response.status_code}",
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
    Get interest-over-time data via Google Trends embed iframe.
    Returns simplified trend direction (rising/falling/stable).
    """
    proxy = get_proxy_dict()
    results = {}
    
    for keyword in keywords:
        try:
            # Use the Google Trends explore endpoint
            url = (
                f"https://trends.google.com/trends/explore"
                f"?q={requests.utils.quote(keyword)}"
                f"&geo={geo}"
                f"&hl=en"
            )
            
            response = requests.get(
                url,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0"},
                proxies=proxy,
                timeout=15,
            )
            
            # Extract trend data from embedded JSON
            text = response.text
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
                    "values": values[-12:] if len(values) > 12 else values,  # Last 12 points
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
        url = (
            f"https://trends.google.com/trends/explore"
            f"?q={requests.utils.quote(keyword)}"
            f"&geo={geo}"
        )
        
        response = requests.get(
            url,
            headers={"User-Agent": "Mozilla/5.0 Chrome/120.0.0.0"},
            proxies=proxy,
            timeout=15,
        )
        
        text = response.text
        
        # Extract related queries
        top = []
        rising = []
        
        # Look for related query patterns in the page
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
