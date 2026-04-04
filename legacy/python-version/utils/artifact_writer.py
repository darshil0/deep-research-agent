import json
import os
from typing import Any, Dict
from models import ResearchArtifacts

class ArtifactWriter:
    def __init__(self, output_dir: str):
        self.output_dir = output_dir
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

    def write_all(self, artifacts: ResearchArtifacts):
        # Save JSON
        json_path = os.path.join(self.output_dir, "artifacts.json")
        with open(json_path, "w") as f:
            f.write(artifacts.model_dump_json(indent=2))
            
        # Save Markdown Report
        if artifacts.report:
            md_path = os.path.join(self.output_dir, "report.md")
            with open(md_path, "w") as f:
                f.write(self._to_markdown(artifacts))
                
        print(f"Artifacts saved to {self.output_dir}")

    def _to_markdown(self, artifacts: ResearchArtifacts) -> str:
        report = artifacts.report
        md = f"# Research Report: {report.topic}\n\n"
        md += f"## Executive Summary\n{report.executive_summary}\n\n"
        
        for section in report.sections:
            md += f"### {section.get('title', 'Section')}\n"
            md += f"{section.get('content', '')}\n\n"
            
        md += "## Conclusions\n"
        for c in report.conclusions:
            md += f"- {c}\n"
        md += "\n"
        
        md += "## Limitations & Uncertainties\n"
        for l in report.limitations:
            md += f"- {l}\n"
        for u in report.uncertainties:
            md += f"- {u}\n"
        md += "\n"
        
        md += "## Sources\n"
        for s in report.sources:
            md += f"- [{s.title}]({s.url})\n"
            
        return md
