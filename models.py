import os
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class Source(BaseModel):
    url: str
    title: str
    snippet: Optional[str] = None
    content: Optional[str] = None
    score: float = 0.0

class Evidence(BaseModel):
    claim: str
    source_url: str
    context: str
    confidence: float = 1.0

class ResearchSubQuestion(BaseModel):
    question: str
    rationale: str
    status: str = "pending"  # pending, searching, fetched, analyzed
    queries: List[str] = []
    evidence_ids: List[str] = []

class ResearchPlan(BaseModel):
    topic: str
    subquestions: List[ResearchSubQuestion]
    strategy: str
    created_at: datetime = Field(default_factory=datetime.now)

class ResearchReport(BaseModel):
    topic: str
    executive_summary: str
    sections: List[Dict[str, Any]]
    conclusions: List[str]
    limitations: List[str]
    uncertainties: List[str]
    sources: List[Source]
    confidence_score: float
    created_at: datetime = Field(default_factory=datetime.now)

class ResearchArtifacts(BaseModel):
    plan: ResearchPlan
    search_log: List[Dict[str, Any]] = []
    sources: List[Source] = []
    evidence: List[Evidence] = []
    report: Optional[ResearchReport] = None
    changelog: List[str] = []
