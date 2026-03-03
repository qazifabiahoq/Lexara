from google.adk.agents import LlmAgent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai.types import Content, Part
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import json
import re
import io
import pypdf
from datetime import date as date_type

os.environ["GOOGLE_API_KEY"] = os.environ.get("GEMINI_API_KEY", "")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

clause_extractor_agent = LlmAgent(
    name='clause_extractor_agent',
    model='gemini-2.5-flash',
    description='Identifies and labels every clause in a contract by type.',
    instruction='You are the Clause Extractor Agent for Lexara, a contract review tool built for law firms and paralegals. Your job is to read the full contract text and extract every individual clause. For each clause you find, identify and label it by type. Common clause types include: Payment Terms, Termination, Liability and Indemnification, Intellectual Property Ownership, Non-Compete, Confidentiality and NDA, Dispute Resolution, Governing Law, Force Majeure, Warranties, Assignment, Amendments. For each clause output: Clause number, Clause type label, The original clause text exactly as written, A one sentence plain English summary of what it says. Return all clauses in a clean numbered list. Do not skip any clause even if it seems minor. Do not analyze risk yet. If a section contains multiple clauses, split them individually.',
    tools=[],
)

risk_analyzer_agent = LlmAgent(
    name='risk_analyzer_agent',
    model='gemini-2.5-flash',
    description='Scores each extracted clause as high, medium or low risk.',
    instruction='You are the Risk Analyzer Agent for Lexara, a contract review tool built for law firms and paralegals. You receive a list of labeled clauses. Your job is to analyze each clause and assign a risk level. For each clause output: Clause number, Clause type, Risk level: High Medium or Low, Risk score as a number out of 10, One sentence explanation of why it is risky or safe in plain English, A suggested revision if the clause is high risk. Risk guidelines: High risk: clause heavily favors the other party, removes important protections, is vague or open ended, or creates unlimited liability. Medium risk: clause is standard but has terms that could be tightened. Low risk: clause is fair, standard and clearly written. Also return a risk summary at the end: Total high risk clauses, Total medium risk clauses, Total low risk clauses, Overall contract risk percentage, Overall risk label High Medium or Low.',
    tools=[],
)

contradiction_detector_agent = LlmAgent(
    name='contradiction_detector_agent',
    model='gemini-2.5-flash',
    description='Finds internal conflicts or contradictions within the contract.',
    instruction='You are the Contradiction Detector Agent for Lexara. You receive the full list of extracted clauses. Your job is to find any clauses that contradict or conflict with each other. For each contradiction found output: Contradiction number, Clause A number and type, Clause B number and type, Plain English explanation of how they conflict, Severity High Medium or Low, Recommended fix in one sentence. If no contradictions are found, clearly state: No contradictions detected. Contract is internally consistent. Return a summary at the end with total contradictions found and overall severity.',
    tools=[],
)

missing_clause_agent = LlmAgent(
    name='missing_clause_agent',
    model='gemini-2.5-flash',
    description='Flags standard legal protections that are absent from the contract.',
    instruction='You are the Missing Clause Agent for Lexara. You receive the full list of extracted clauses. Your job is to identify what important clauses are completely missing. For each missing clause output: Missing clause name, Why it matters in one sentence, Risk of not having it High Medium or Low, A suggested clause the paralegal can add or adapt. Standard clauses to check for: Payment Terms, Termination and Notice Period, Dispute Resolution, Governing Law, Confidentiality and NDA, Intellectual Property Ownership, Liability Cap, Indemnification, Force Majeure, Warranties and Representations, Amendment Process, Assignment Rights. If all standard clauses are present, clearly state: No critical clauses missing. Contract has standard protections in place.',
    tools=[],
)

summary_agent = LlmAgent(
    name='summary_agent',
    model='gemini-2.5-flash',
    description='Produces the final structured risk report as JSON.',
    instruction='''You are the Summary Agent for Lexara. You receive findings from all other agents. Compile everything into one final report.

Return ONLY a valid JSON object — no markdown, no code fences, no extra text before or after. The JSON must match this exact structure:

{
  "executiveSummary": "3-4 sentences covering the biggest concerns",
  "overallRisk": "high",
  "riskPercentage": 75,
  "chartData": [
    {"name": "High Risk", "value": 5, "color": "#EF4444"},
    {"name": "Medium Risk", "value": 3, "color": "#F59E0B"},
    {"name": "Low Risk", "value": 8, "color": "#10B981"}
  ],
  "topDangerousClauses": [
    {"title": "Clause Name", "risk": "high", "explanation": "One sentence why it matters"},
    {"title": "Clause Name", "risk": "high", "explanation": "One sentence why it matters"},
    {"title": "Clause Name", "risk": "high", "explanation": "One sentence why it matters"}
  ],
  "clauses": [
    {"id": "1", "title": "Clause Type", "text": "Original clause text", "risk": "high", "explanation": "Risk explanation"}
  ],
  "contradictions": [
    {"severity": "high", "description": "Plain English explanation of the conflict"}
  ],
  "missingProtections": [
    {"risk": "high", "title": "Clause Name", "explanation": "Why it matters"}
  ],
  "redlineMemo": "Full professionally written redline memo with all flagged issues and suggested changes in formal legal language"
}

Rules:
- Use only "high", "medium", or "low" (lowercase) for all risk fields.
- If there are no contradictions, set "contradictions" to an empty array [].
- If there are no missing protections, set "missingProtections" to an empty array [].
- Return ONLY the JSON object, nothing else.''',
    tools=[],
)

root_agent = LlmAgent(
    name='Lexara_Contract_Orchestrator_Agent',
    model='gemini-2.5-flash',
    description='Coordinates all Lexara sub-agents to perform a full contract review.',
    sub_agents=[clause_extractor_agent, risk_analyzer_agent, contradiction_detector_agent, missing_clause_agent, summary_agent],
    instruction='''You are the Lexara Orchestrator Agent, an AI-powered contract review assistant built for law firms and paralegals. When a contract is received, coordinate the following sequence:
1. Send the full contract to the Clause Extractor Agent to extract and label all clauses.
2. Send the extracted clauses to the Risk Analyzer Agent for risk scoring.
3. Send the clauses to the Contradiction Detector Agent to find conflicts.
4. Send the clauses to the Missing Clause Agent to identify missing protections.
5. Collect all findings and send them to the Summary Agent.
6. Return the Summary Agent JSON output exactly as-is, with no additional text, commentary, or formatting.

Your final response must be ONLY the JSON object from the Summary Agent — nothing else.''',
    tools=[],
)


def extract_json(text: str):
    """Try multiple strategies to extract valid JSON from LLM output."""
    # Strategy 1: direct parse
    try:
        return json.loads(text)
    except (json.JSONDecodeError, TypeError):
        pass

    # Strategy 2: extract from ```json ... ``` code block
    match = re.search(r'```(?:json)?\s*(\{[\s\S]*?\})\s*```', text)
    if match:
        try:
            return json.loads(match.group(1))
        except (json.JSONDecodeError, TypeError):
            pass

    # Strategy 3: find the first {...} block spanning the whole output
    match = re.search(r'\{[\s\S]*\}', text)
    if match:
        try:
            return json.loads(match.group(0))
        except (json.JSONDecodeError, TypeError):
            pass

    return None


@app.post("/api/analyze")
async def analyze_contract(file: UploadFile = File(...)):
    try:
        content = await file.read()

        # Extract text from PDF using pypdf
        try:
            pdf_reader = pypdf.PdfReader(io.BytesIO(content))
            text = ""
            for page in pdf_reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
        except Exception:
            # Fallback for non-PDF or corrupted files
            text = content.decode("utf-8", errors="ignore")

        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from file")

        session_service = InMemorySessionService()
        session = await session_service.create_session(
            app_name="lexara",
            user_id="user",
            session_id="session"
        )

        runner = Runner(
            agent=root_agent,
            app_name="lexara",
            session_service=session_service
        )

        message = Content(parts=[Part(text=text)])

        result = ""
        async for event in runner.run_async(
            user_id="user",
            session_id="session",
            new_message=message
        ):
            if event.is_final_response():
                result = event.content.parts[0].text
                break

        report_data = extract_json(result)
        if report_data is None:
            raise HTTPException(status_code=500, detail="Failed to parse analysis results from AI")

        report_data["filename"] = file.filename or "contract.pdf"
        report_data["date"] = date_type.today().isoformat()

        return report_data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
