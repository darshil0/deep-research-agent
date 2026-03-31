import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
    
    # Model Settings
    DEFAULT_MODEL = "gemini-2.0-flash"
    
    # Research Limits
    MAX_SEARCH_ROUNDS = 3
    MAX_QUERIES_PER_QUESTION = 3
    MAX_FETCHES_PER_QUESTION = 5
    MAX_TOTAL_SOURCES = 20
    
    # Output Settings
    OUTPUT_DIR = "research_outputs"
    
    @classmethod
    def validate(cls):
        if not cls.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is required in environment variables.")
        # Tavily is optional if using a mock or different client, but recommended
        if not cls.TAVILY_API_KEY:
            print("Warning: TAVILY_API_KEY not found. Search functionality may be limited.")
