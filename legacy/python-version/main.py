import sys
import asyncio
import logging
from orchestrator import ResearchOrchestrator
from utils.artifact_writer import ArtifactWriter
from config import Config

# Setup logging
logging.basicConfig(
    level=getattr(logging, Config.LOG_LEVEL, logging.INFO),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

async def main():
    print("\n" + "="*40)
    print("   🚀 DEEP RESEARCH AGENT 🚀")
    print("="*40 + "\n")
    
    topic = ""
    while not topic:
        try:
            user_input = input("Enter your research topic or question: ").strip()
            
            if not user_input:
                print("⚠️  Error: Research topic cannot be empty. Please try again.")
                continue
            
            if len(user_input) < 10:
                print(f"⚠️  Topic seems a bit short ('{user_input}').")
                confirm = input("Are you sure this is enough detail? (y/n): ").lower()
                if confirm != 'y':
                    continue
            
            topic = user_input
            
        except KeyboardInterrupt:
            print("\n\n👋 Research cancelled by user. Exiting...")
            return
        except Exception as e:
            print(f"❌ An unexpected error occurred during input: {e}")
            return

    try:
        Config.validate()
    except ValueError as e:
        print(f"\n❌ Configuration error: {e}")
        print("Please check your .env file and ensure all required API keys are set.")
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
