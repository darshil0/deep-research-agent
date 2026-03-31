import json
import logging
from typing import List, Dict, Any
from google import genai
from google.genai import types
from models import ResearchPlan, ResearchSubQuestion, Evidence, Source, ResearchReport
from config import Config

logger = logging.getLogger(__name__)

class AIService:
    """Wrapper for Gemini API calls."""
    def __init__(self):
        self.client = genai.Client(api_key=Config.GEMINI_API_KEY)
        self.model = Config.DEFAULT_MODEL

    async def generate_json(self, prompt: str, system_instruction: str = "") -> Dict[str, Any]:
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json"
                )
            )
            return json.loads(response.text)
        except Exception as e:
            logger.error(f"AI Generation error: {e}")
            return {}

    async def generate_text(self, prompt: str, system_instruction: str = "") -> str:
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction
                )
            )
            return response.text
        except Exception as e:
            logger.error(f"AI Generation error: {e}")
            return ""

class ResearchPlanner:
    def __init__(self, ai_service: AIService):
        self.ai = ai_service

    async def create_plan(self, topic: str) -> ResearchPlan:
        system = "You are a research director. Decompose a complex topic into 3-5 specific, high-value subquestions."
        prompt = f"Topic: {topic}\n\nReturn a JSON object with 'topic', 'strategy', and 'subquestions' (list of objects with 'question' and 'rationale')."
        
        data = await self.ai.generate_json(prompt, system)
        
        subquestions = [
            ResearchSubQuestion(question=sq["question"], rationale=sq["rationale"])
            for sq in data.get("subquestions", [])
        ]
        
        return ResearchPlan(
            topic=data.get("topic", topic),
            subquestions=subquestions,
            strategy=data.get("strategy", "Iterative deep research")
        )

class EvidenceExtractor:
    def __init__(self, ai_service: AIService):
        self.ai = ai_service

    async def extract(self, content: str, question: str, url: str) -> List[Evidence]:
        system = "You are an evidence extractor. Extract specific claims, data points, and evidence related to the question."
        prompt = f"Question: {question}\nSource: {url}\nContent: {content[:10000]}\n\nReturn a JSON list of objects with 'claim', 'context', and 'confidence' (0.0 to 1.0)."
        
        data = await self.ai.generate_json(prompt, system)
        
        evidences = []
        for item in data if isinstance(data, list) else data.get("evidence", []):
            evidences.append(Evidence(
                claim=item["claim"],
                source_url=url,
                context=item["context"],
                confidence=item.get("confidence", 1.0)
            ))
        return evidences

class VerificationChecker:
    def __init__(self, ai_service: AIService):
        self.ai = ai_service

    async def verify(self, report: ResearchReport, evidence: List[Evidence]) -> Dict[str, Any]:
        system = "You are a fact-checker. Verify the claims in a research report against the provided evidence."
        
        evidence_text = "\n".join([f"- {e.claim} (Source: {e.source_url})" for e in evidence])
        report_text = f"Executive Summary: {report.executive_summary}\n\nConclusions: {', '.join(report.conclusions)}"
        
        prompt = f"""
        Report to Verify:
        {report_text}
        
        Available Evidence:
        {evidence_text}
        
        Instructions:
        1. Check if major claims in the report are supported by the evidence.
        2. Identify any claims that are unsupported or contradicted.
        3. Assign a final verification score (0.0 to 1.0).
        4. Return a JSON object with 'score', 'supported_claims' (list), 'unsupported_claims' (list), and 'contradictions' (list).
        """
        
        return await self.ai.generate_json(prompt, system)

class ReportSynthesizer:
    def __init__(self, ai_service: AIService):
        self.ai = ai_service

    async def synthesize(self, topic: str, evidence: List[Evidence], sources: List[Source]) -> ResearchReport:
        system = "You are a professional research analyst. Synthesize a comprehensive report based on the provided evidence and sources."
        
        # Create a mapping of URL to Title for the LLM
        source_list_text = "\n".join([f"- {s.title}: {s.url}" for s in sources])
        evidence_text = "\n".join([f"- {e.claim} (Source URL: {e.source_url})" for e in evidence])
        
        prompt = f"""
        Topic: {topic}
        
        Available Sources (Title: URL):
        {source_list_text}
        
        Evidence Points:
        {evidence_text}
        
        Instructions:
        1. Write a high-quality executive summary.
        2. Create detailed sections. 
        3. **MANDATORY**: For every factual claim, include an inline citation formatted EXACTLY as [Source Title](Source URL). 
           Use the 'Available Sources' list above to match URLs to their correct Titles.
        4. List major conclusions and limitations.
        5. Identify areas of uncertainty.
        6. Return a JSON object with:
           - 'executive_summary' (string)
           - 'sections' (list of objects with 'title' and 'content')
           - 'conclusions' (list of strings)
           - 'limitations' (list of strings)
           - 'uncertainties' (list of strings)
           - 'confidence_score' (float between 0 and 1)
        """
        
        data = await self.ai.generate_json(prompt, system)
        
        return ResearchReport(
            topic=topic,
            executive_summary=data.get("executive_summary", ""),
            sections=data.get("sections", []),
            conclusions=data.get("conclusions", []),
            limitations=data.get("limitations", []),
            uncertainties=data.get("uncertainties", []),
            sources=sources,
            confidence_score=data.get("confidence_score", 0.8)
        )
