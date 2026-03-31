import asyncio
import logging
from typing import List, Dict, Any
from models import ResearchArtifacts, ResearchPlan, Source, Evidence, ResearchReport
from config import Config
from tools.search_fetch import TavilySearchClient, PageFetcher
from tools.ai_tools import AIService, ResearchPlanner, EvidenceExtractor, ReportSynthesizer, VerificationChecker

logger = logging.getLogger(__name__)

class ResearchOrchestrator:
    def __init__(self):
        self.config = Config()
        self.ai_service = AIService()
        self.planner = ResearchPlanner(self.ai_service)
        self.search_client = TavilySearchClient(Config.TAVILY_API_KEY)
        self.fetcher = PageFetcher()
        self.extractor = EvidenceExtractor(self.ai_service)
        self.synthesizer = ReportSynthesizer(self.ai_service)
        self.verifier = VerificationChecker(self.ai_service)
        
        self.artifacts = None

    async def run(self, topic: str) -> ResearchArtifacts:
        logger.info(f"Starting research on: {topic}")
        
        # 1. Plan
        plan = await self.planner.create_plan(topic)
        self.artifacts = ResearchArtifacts(plan=plan)
        self.artifacts.changelog.append("Created initial research plan.")
        
        # 2. Iterative Research
        for round_num in range(Config.MAX_SEARCH_ROUNDS):
            logger.info(f"Starting research round {round_num + 1}")
            
            pending_questions = [sq for sq in self.artifacts.plan.subquestions if sq.status != "analyzed"]
            if not pending_questions:
                break
                
            tasks = []
            for sq in pending_questions:
                tasks.append(self._process_subquestion(sq))
            
            await asyncio.gather(*tasks)
            self.artifacts.changelog.append(f"Completed research round {round_num + 1}.")

        # 3. Synthesize
        logger.info("Synthesizing final report...")
        report = await self.synthesizer.synthesize(
            topic=topic,
            evidence=self.artifacts.evidence,
            sources=self.artifacts.sources
        )
        self.artifacts.report = report
        self.artifacts.changelog.append("Synthesized final report.")

        # 4. Verify
        logger.info("Verifying report...")
        verification = await self.verifier.verify(report, self.artifacts.evidence)
        self.artifacts.changelog.append(f"Verified report with score: {verification.get('score', 'N/A')}")
        
        return self.artifacts

    async def _process_subquestion(self, sq):
        sq.status = "searching"
        
        # Generate queries (simplified for now, could use AI)
        queries = [sq.question]
        sq.queries.extend(queries)
        
        # Search
        all_results = []
        for query in queries:
            results = await self.search_client.search(query)
            all_results.extend(results)
            
        # Deduplicate and filter sources
        new_sources = []
        existing_urls = {s.url for s in self.artifacts.sources}
        for res in all_results:
            if res.url not in existing_urls:
                new_sources.append(res)
                existing_urls.add(res.url)
        
        self.artifacts.sources.extend(new_sources)
        
        # Fetch and Extract
        fetch_limit = Config.MAX_FETCHES_PER_QUESTION
        for source in new_sources[:fetch_limit]:
            content = await self.fetcher.fetch(source.url)
            if content:
                source.content = content
                evidence = await self.extractor.extract(content, sq.question, source.url)
                self.artifacts.evidence.extend(evidence)
                
        sq.status = "analyzed"
        logger.info(f"Finished analyzing: {sq.question}")
