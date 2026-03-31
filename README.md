# Deep Research Agent

An autonomous, iterative research agent built in Python 3.

## Features
- **Iterative Research**: Expands search queries based on findings.
- **Full-Page Analysis**: Fetches and extracts evidence from web sources.
- **Citation Management**: Automatically tracks and cites sources.
- **Verification**: Self-verifies reports against extracted evidence.
- **Multi-format Output**: Produces Markdown reports and structured JSON artifacts.

## Setup

1. Install dependencies:
   ```bash
   pip install pydantic google-genai httpx beautifulsoup4 python-dotenv tavily-python
   ```

2. Configure environment variables in `.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   TAVILY_API_KEY=your_tavily_api_key
   ```

## Usage

Run the agent with a research topic:
```bash
python main.py "The impact of solid-state batteries on the EV market by 2030"
```

## Architecture
- `ResearchOrchestrator`: Manages the workflow.
- `ResearchPlanner`: Decomposes topics into subquestions.
- `SearchClient`: Interfaces with search APIs (Tavily).
- `PageFetcher`: Extracts text from URLs.
- `EvidenceExtractor`: Distills claims from text.
- `ReportSynthesizer`: Generates the final report with citations.
- `VerificationChecker`: Validates the report against evidence.
