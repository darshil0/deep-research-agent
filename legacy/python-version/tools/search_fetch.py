import httpx
from bs4 import BeautifulSoup
from typing import List, Dict, Any, Optional
import logging
from models import Source
from config import Config

logger = logging.getLogger(__name__)

class SearchClient:
    """Interface for search functionality."""
    async def search(self, query: str, max_results: int = 5) -> List[Source]:
        raise NotImplementedError

class TavilySearchClient(SearchClient):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.tavily.com/search"

    async def search(self, query: str, max_results: int = 5) -> List[Source]:
        if not self.api_key:
            logger.warning("No Tavily API key, returning empty results.")
            return []
            
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    self.base_url,
                    json={
                        "api_key": self.api_key,
                        "query": query,
                        "search_depth": "advanced",
                        "max_results": max_results
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                
                results = []
                for res in data.get("results", []):
                    results.append(Source(
                        url=res["url"],
                        title=res["title"],
                        snippet=res.get("content", ""),
                        score=res.get("score", 0.0)
                    ))
                return results
            except Exception as e:
                logger.error(f"Tavily search error: {e}")
                return []

class PageFetcher:
    """Fetches and cleans content from URLs."""
    async def fetch(self, url: str) -> Optional[str]:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            try:
                response = await client.get(
                    url, 
                    headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"},
                    timeout=15.0
                )
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Remove script and style elements
                for script in soup(["script", "style", "nav", "footer", "header"]):
                    script.decompose()
                
                # Get text
                text = soup.get_text(separator=' ', strip=True)
                
                # Basic cleaning
                lines = (line.strip() for line in text.splitlines())
                chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
                text = '\n'.join(chunk for chunk in chunks if chunk)
                
                return text[:20000]  # Limit to 20k chars for LLM context
            except Exception as e:
                logger.error(f"Error fetching {url}: {e}")
                return None
