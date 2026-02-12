/**
 * Effort requirements configuration for deep research
 */
import type { EffortLevel, EffortConfig } from "../domain/effort-level.schema.js";

export interface EffortRequirements {
  summary: string;
  sourcesToScrape: number;
  searchSteps: number;
  searchQueries: number;
  minWords: number;
  maxWords: number;
  sections: number;
  minFindings: number;
  reportInstructions: string;
  qualityStandards: string;
}

export function getEffortRequirements(effort: EffortLevel, config: EffortConfig): EffortRequirements {
  switch (effort) {
    case 'standard':
      return {
        summary: 'Solid, comprehensive research report with key insights',
        sourcesToScrape: Math.ceil(config.maxSources * 0.4),
        searchSteps: 5,
        searchQueries: 5,
        minWords: 2500,
        maxWords: 4000,
        sections: 5,
        minFindings: 10,
        reportInstructions: `**REQUIRED STRUCTURE:**
## Executive Summary (300-500 words)
## 1. Introduction & Background
## 2. Key Findings (with evidence and citations)
## 3. Analysis & Implications
## 4. Challenges & Considerations
## 5. Conclusions & Recommendations
## References`,
        qualityStandards: `- Clear, well-organized presentation
- Multiple sources cited per major claim
- Practical, actionable insights
- Professional tone and formatting`,
      };

    case 'deep':
      return {
        summary: 'Thorough, multi-perspective analysis with detailed evidence',
        sourcesToScrape: Math.ceil(config.maxSources * 0.5),
        searchSteps: 8,
        searchQueries: 10,
        minWords: 5000,
        maxWords: 8000,
        sections: 8,
        minFindings: 20,
        reportInstructions: `**REQUIRED STRUCTURE:**
## Executive Summary (500-700 words - comprehensive overview)
## 1. Introduction
### 1.1 Background & Context
### 1.2 Research Scope
## 2. Current State of Knowledge
### 2.1 Primary Findings
### 2.2 Supporting Evidence
## 3. In-Depth Analysis
### 3.1 Trend Analysis
### 3.2 Comparative Perspectives
## 4. Multiple Perspectives
### 4.1 Mainstream Views
### 4.2 Alternative Perspectives
### 4.3 Points of Agreement & Disagreement
## 5. Implications & Impact
## 6. Challenges & Limitations
## 7. Future Outlook
## 8. Conclusions & Recommendations
## References`,
        qualityStandards: `- Thorough exploration of multiple angles
- Detailed evidence with specific data points
- Analysis of contradictions between sources
- Nuanced conclusions considering different perspectives
- Substantial depth in each section (400-700 words per section)`,
      };

    case 'max':
      return {
        summary: 'Exhaustive, publication-quality analysis leaving no stone unturned',
        sourcesToScrape: Math.ceil(config.maxSources * 0.6),
        searchSteps: 12,
        searchQueries: 15,
        minWords: 10000,
        maxWords: 15000,
        sections: 12,
        minFindings: 30,
        reportInstructions: `**REQUIRED STRUCTURE (12+ sections):**
## Executive Summary (800-1200 words - comprehensive synthesis)
## 1. Introduction
### 1.1 Research Context & Significance
### 1.2 Historical Background
### 1.3 Scope & Methodology
## 2. Literature Review & Current Knowledge
### 2.1 Foundational Concepts
### 2.2 Evolution of Understanding
## 3. Primary Research Findings
### 3.1 Core Discoveries
### 3.2 Supporting Data & Evidence
## 4. Comprehensive Analysis
### 4.1 Trend Analysis
### 4.2 Pattern Recognition
### 4.3 Causal Relationships
## 5. Multi-Stakeholder Perspectives
### 5.1 Expert Opinions
### 5.2 Industry Perspectives
### 5.3 Contrarian & Minority Views
## 6. Contradictions & Debates
### 6.1 Areas of Disagreement
### 6.2 Unresolved Questions
## 7. Case Studies & Examples
## 8. Implications Analysis
### 8.1 Short-term Impact
### 8.2 Long-term Consequences
### 8.3 Potential Risks
## 9. Limitations & Research Gaps
## 10. Future Outlook & Predictions
## 11. Conclusions (comprehensive synthesis)
## 12. Strategic Recommendations
## Appendix: Detailed Source Analysis
## References`,
        qualityStandards: `- Publication-quality depth and rigor
- Exhaustive coverage of all perspectives
- Detailed analysis of contradictions and debates
- Specific case studies and examples
- Statistical analysis where applicable
- Expert-level synthesis and original insights
- Substantial depth (700-1200 words per major section)
- At least 30 unique findings recorded
- Minority/contrarian views explored`,
      };
  }
}
