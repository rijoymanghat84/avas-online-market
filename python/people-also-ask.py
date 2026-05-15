#!/usr/bin/env python3
"""
People Also Ask (PAA) Scraper for Ava's Online Market
Scrapes Google's "People Also Ask" questions for trend discovery.
Works without proxy but benefits from it for higher volume.
"""
import json
import re
import time
from typing import List, Dict
from urllib.parse import quote_plus
import requests
from bs4 import BeautifulSoup
from config import get_proxy_dict


def get_people_also_ask(keyword: str, max_questions: int = 8) -> List[Dict]:
    """
    Fetch "People Also Ask" questions for a given keyword.
    Returns list of {question, source} dicts.
    """
    proxy = get_proxy_dict()
    
    # Build Google search URL
    query = quote_plus(keyword)
    url = f"https://www.google.com/search?q={query}&hl=en"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
    }
    
    try:
        response = requests.get(
            url,
            headers=headers,
            proxies=proxy,
            timeout=15,
            allow_redirects=True
        )
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Find PAA containers — Google uses various selectors
        paa_selectors = [
            "div[jsname='Cpkphb']",  # Modern PAA container
            "div[class*='related-question']",
            "div[data-ved*='FQA']",
            "div[class*='wDYxhc']",
        ]
        
        questions = []
        seen = set()
        
        for selector in paa_selectors:
            elements = soup.select(selector)
            for elem in elements:
                # Extract question text
                text = elem.get_text(strip=True)
                
                # Filter: must be a question
                if text and text.endswith("?") and text not in seen:
                    seen.add(text)
                    questions.append({
                        "question": text,
                        "keyword": keyword,
                        "source": "people_also_ask",
                        "rank": len(questions) + 1,
                    })
                    
                    if len(questions) >= max_questions:
                        break
            
            if len(questions) >= max_questions:
                break
        
        return questions[:max_questions]
        
    except requests.exceptions.ProxyError as e:
        return [{
            "error": "PROXY_ERROR",
            "message": f"Proxy connection failed: {str(e)}. Check proxy credentials in .env",
        }]
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 429:
            return [{
                "error": "RATE_LIMITED",
                "message": "Google rate limited. Enable residential proxy (PROXY_MODE=webshare_rotating) in .env",
            }]
        return [{
            "error": "HTTP_ERROR",
            "message": f"HTTP {e.response.status_code}: {str(e)}",
        }]
    except Exception as e:
        return [{
            "error": "FETCH_FAILED",
            "message": str(e),
        }]


def discover_trends_from_paa(seed_keywords: List[str]) -> List[Dict]:
    """
    Discover trends by expanding seed keywords through PAA.
    Returns aggregated questions across all seeds.
    """
    all_questions = []
    
    for keyword in seed_keywords:
        questions = get_people_also_ask(keyword)
        
        # Check for errors
        if questions and "error" in questions[0]:
            print(json.dumps({"warn": f"PAA failed for '{keyword}': {questions[0]['message']}"}))
            continue
        
        all_questions.extend(questions)
        
        # Be nice to Google
        time.sleep(1.5)
    
    # Deduplicate by question text
    seen = set()
    unique = []
    for q in all_questions:
        if q["question"] not in seen:
            seen.add(q["question"])
            q["rank"] = len(unique) + 1
            unique.append(q)
    
    return unique


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="People Also Ask Scraper")
    parser.add_argument("--keyword", help="Single keyword to query")
    parser.add_argument("--seed-file", help="File with seed keywords (one per line)")
    parser.add_argument("--max", type=int, default=8, help="Max questions per keyword")
    
    args = parser.parse_args()
    
    if args.keyword:
        results = get_people_also_ask(args.keyword, args.max)
        print(json.dumps(results, indent=2))
    elif args.seed_file:
        with open(args.seed_file) as f:
            seeds = [line.strip() for line in f if line.strip()]
        results = discover_trends_from_paa(seeds)
        print(json.dumps(results, indent=2))
    else:
        # Default demo
        results = get_people_also_ask("side hustle ideas 2025")
        print(json.dumps(results, indent=2))
