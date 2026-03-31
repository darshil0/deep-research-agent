import sys
import asyncio
import logging
from orchestrator import ResearchOrchestrator
from utils.artifact_writer import ArtifactWriter
from config import Config

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

async def main():
    print("--- Deep Research Agent ---")
    topic = input("Enter your research topic or question: ").strip()
    
    if not topic:
        print("Error: Research topic cannot be empty.")
        return
    
    try:
        Config.validate()
    except ValueError as e:
        print(f"Configuration error: {e}")
        return

    orchestrator = ResearchOrchestrator()
    writer = ArtifactWriter(Config.OUTPUT_DIR)
    
    print(f"--- Starting Deep Research: {topic} ---")
    
    artifacts = await orchestrator.run(topic)
    
    writer.write_all(artifacts)
    
    print("\n--- Research Complete ---")
    if artifacts.report:
        print(f"Confidence Score: {artifacts.report.confidence_score}")
        print(f"Sources Found: {len(artifacts.sources)}")
        print(f"Evidence Points: {len(artifacts.evidence)}")

if __name__ == "__main__":
    asyncio.run(main())
