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
import uuid
import asyncio
import pypdf
from datetime import date as date_type

os.environ["GOOGLE_API_KEY"] = os.environ.get("GEMINI_API_KEY", "")

app = FastAPI()


# ---------------------------------------------------------------------------
# Rule-based decision layer
# ---------------------------------------------------------------------------

# Keywords that identify each contract type. More matches = higher confidence.
_CONTRACT_TYPE_KEYWORDS: dict[str, list[str]] = {
    "nda": [
        "non-disclosure", "nda", "confidential information", "trade secret",
        "proprietary information", "return of materials", "confidentiality agreement",
    ],
    "employment": [
        "employee", "employer", "salary", "wages", "at-will", "job title",
        "benefits", "paid time off", "performance review", "termination for cause",
        "offer letter", "compensation",
    ],
    "saas": [
        "software as a service", "saas", "subscription", "api", "uptime",
        "sla", "service level", "user account", "data processing", "cloud",
        "license", "software license",
    ],
    "service": [
        "services", "independent contractor", "deliverable", "statement of work",
        "milestone", "consulting", "professional services", "scope of work",
    ],
    "lease": [
        "lease", "tenant", "landlord", "rent", "premises", "eviction",
        "security deposit", "occupancy", "lessor", "lessee",
    ],
    "purchase": [
        "purchase order", "buyer", "seller", "goods", "delivery",
        "warranty of title", "invoice", "purchase price", "bill of sale",
    ],
}

# Clauses that are required / highly expected per contract type.
_REQUIRED_CLAUSES_BY_TYPE: dict[str, list[str]] = {
    "nda": [
        "Governing Law", "Dispute Resolution", "Termination",
        "Confidentiality and NDA", "Intellectual Property Ownership",
        "Amendment Process",
    ],
    "employment": [
        "Governing Law", "Dispute Resolution", "Termination and Notice Period",
        "Payment Terms", "Non-Compete", "Intellectual Property Ownership",
        "Confidentiality and NDA", "Amendment Process",
    ],
    "saas": [
        "Governing Law", "Dispute Resolution", "Termination",
        "Liability Cap", "Indemnification", "Warranties and Representations",
        "Assignment Rights", "Amendment Process", "Confidentiality and NDA",
    ],
    "service": [
        "Governing Law", "Dispute Resolution", "Termination and Notice Period",
        "Payment Terms", "Liability Cap", "Indemnification",
        "Warranties and Representations", "Amendment Process", "Assignment Rights",
    ],
    "lease": [
        "Governing Law", "Dispute Resolution", "Termination and Notice Period",
        "Payment Terms", "Force Majeure", "Assignment Rights", "Amendment Process",
    ],
    "purchase": [
        "Governing Law", "Dispute Resolution", "Termination",
        "Payment Terms", "Warranties and Representations", "Liability Cap",
        "Force Majeure", "Indemnification",
    ],
    "general": [
        "Governing Law", "Dispute Resolution", "Termination",
        "Payment Terms", "Liability Cap", "Indemnification",
        "Confidentiality and NDA", "Force Majeure", "Amendment Process",
    ],
}


def detect_contract_type(text: str) -> str:
    """
    Rule-based contract type classifier using keyword frequency scoring.

    Scores each known contract type by how many of its marker keywords appear
    in the lowercased text.  Returns the highest-scoring type, or "general"
    when no type scores above zero.
    """
    lower = text.lower()
    scores: dict[str, int] = {
        ctype: sum(1 for kw in keywords if kw in lower)
        for ctype, keywords in _CONTRACT_TYPE_KEYWORDS.items()
    }
    best_type = max(scores, key=lambda k: scores[k])
    return best_type if scores[best_type] > 0 else "general"


def get_required_clauses_for_type(contract_type: str) -> list[str]:
    """Return the mandatory clause checklist for the detected contract type."""
    return _REQUIRED_CLAUSES_BY_TYPE.get(contract_type, _REQUIRED_CLAUSES_BY_TYPE["general"])


def validate_contract_text(text: str) -> dict:
    """
    Pre-flight rule checks before any AI agent is invoked.

    Checks:
    - Minimum word count (too short → likely a bad extraction or wrong file)
    - Maximum word count (warn when extremely long)
    - Average word length (very low ratio signals garbled OCR output)

    Returns a dict with word_count, char_count, warnings, and is_valid.
    """
    words = text.split()
    word_count = len(words)
    char_count = len(text)
    warnings: list[str] = []

    if word_count < 80:
        warnings.append(
            f"Contract text is very short ({word_count} words). "
            "Text extraction may have failed or the file may not be a contract."
        )
    if word_count > 60_000:
        warnings.append(
            f"Contract is very long ({word_count:,} words). "
            "Analysis accuracy may decrease for extremely large documents."
        )
    avg_word_len = (char_count / word_count) if word_count else 0
    if word_count >= 80 and avg_word_len < 3.0:
        warnings.append(
            "Text quality appears low (possibly garbled OCR). "
            "Review the extracted text before trusting the analysis."
        )

    return {
        "word_count": word_count,
        "char_count": char_count,
        "warnings": warnings,
        "is_valid": word_count >= 50,
    }


def compute_risk_override(report_data: dict) -> dict:
    """
    Post-AI deterministic risk classification applied over the AI-generated report.

    Rules:
    - Recomputes riskPercentage from chartData clause counts so it is always
      consistent with what the agents found (AI sometimes rounds loosely).
    - Overrides overallRisk label based on hard thresholds:
        high   → 3+ high-risk clauses, OR computed percentage ≥ 65
        medium → 1+ high-risk clause,  OR computed percentage ≥ 30
        low    → everything else
    - If the rule engine escalates beyond the AI's own label, a ruleFlags
      entry is added to the report so the reviewer can see why.
    """
    chart_data = report_data.get("chartData", [])

    high_count = next((d["value"] for d in chart_data if d["name"] == "High Risk"), 0)
    medium_count = next((d["value"] for d in chart_data if d["name"] == "Medium Risk"), 0)
    low_count = next((d["value"] for d in chart_data if d["name"] == "Low Risk"), 0)
    total = high_count + medium_count + low_count

    if total == 0:
        return report_data

    # Weighted percentage: high clauses count full, medium count half.
    computed_pct = round((high_count * 100 + medium_count * 50) / total)

    if high_count >= 3 or computed_pct >= 65:
        computed_risk = "high"
    elif high_count >= 1 or computed_pct >= 30:
        computed_risk = "medium"
    else:
        computed_risk = "low"

    ai_risk = report_data.get("overallRisk", "medium")
    rule_flags: list[str] = report_data.get("ruleFlags", [])

    _risk_order = {"low": 0, "medium": 1, "high": 2}
    if _risk_order.get(computed_risk, 1) > _risk_order.get(ai_risk, 1):
        rule_flags.append(
            f"Risk escalated from '{ai_risk}' to '{computed_risk}' by rule engine "
            f"({high_count} high-risk clause(s) found; weighted score {computed_pct}%)."
        )

    report_data["overallRisk"] = computed_risk
    report_data["riskPercentage"] = computed_pct
    if rule_flags:
        report_data["ruleFlags"] = rule_flags

    return report_data

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
)

risk_analyzer_agent = LlmAgent(
    name='risk_analyzer_agent',
    model='gemini-2.5-flash',
    description='Scores each extracted clause as high, medium or low risk.',
    instruction='You are the Risk Analyzer Agent for Lexara, a contract review tool built for law firms and paralegals. You receive a list of labeled clauses. Your job is to analyze each clause and assign a risk level. For each clause output: Clause number, Clause type, Risk level: High Medium or Low, Risk score as a number out of 10, One sentence explanation of why it is risky or safe in plain English, A suggested revision if the clause is high risk. Risk guidelines: High risk: clause heavily favors the other party, removes important protections, is vague or open ended, or creates unlimited liability. Medium risk: clause is standard but has terms that could be tightened. Low risk: clause is fair, standard and clearly written. Also return a risk summary at the end: Total high risk clauses, Total medium risk clauses, Total low risk clauses, Overall contract risk percentage, Overall risk label High Medium or Low.',
)

contradiction_detector_agent = LlmAgent(
    name='contradiction_detector_agent',
    model='gemini-2.5-flash',
    description='Finds internal conflicts or contradictions within the contract.',
    instruction='You are the Contradiction Detector Agent for Lexara. You receive the full list of extracted clauses. Your job is to find any clauses that contradict or conflict with each other. For each contradiction found output: Contradiction number, Clause A number and type, Clause B number and type, Plain English explanation of how they conflict, Severity High Medium or Low, Recommended fix in one sentence. If no contradictions are found, clearly state: No contradictions detected. Contract is internally consistent. Return a summary at the end with total contradictions found and overall severity.',
)

missing_clause_agent = LlmAgent(
    name='missing_clause_agent',
    model='gemini-2.5-flash',
    description='Flags standard legal protections that are absent from the contract.',
    instruction='You are the Missing Clause Agent for Lexara. You receive the full list of extracted clauses. Your job is to identify what important clauses are completely missing. For each missing clause output: Missing clause name, Why it matters in one sentence, Risk of not having it High Medium or Low, A suggested clause the paralegal can add or adapt. Standard clauses to check for: Payment Terms, Termination and Notice Period, Dispute Resolution, Governing Law, Confidentiality and NDA, Intellectual Property Ownership, Liability Cap, Indemnification, Force Majeure, Warranties and Representations, Amendment Process, Assignment Rights. If all standard clauses are present, clearly state: No critical clauses missing. Contract has standard protections in place.',
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
- Return ONLY the JSON object, nothing else.
- Write the redlineMemo in plain text only. Do not use markdown formatting (no **bold**, no * bullets, no # headers). Use plain numbered lists and line breaks instead.''',
)


async def run_agent(agent: LlmAgent, input_text: str) -> str:
    """Run a single agent and return its text output."""
    session_service = InMemorySessionService()
    session_id = str(uuid.uuid4())
    await session_service.create_session(
        app_name="lexara",
        user_id="user",
        session_id=session_id,
    )
    runner = Runner(agent=agent, app_name="lexara", session_service=session_service)
    message = Content(parts=[Part(text=input_text)])
    result = ""
    async for event in runner.run_async(
        user_id="user",
        session_id=session_id,
        new_message=message,
    ):
        if event.is_final_response():
            if event.content and event.content.parts:
                result = "".join(
                    p.text for p in event.content.parts
                    if hasattr(p, "text") and p.text
                )
            break
    return result


def extract_json(text: str):
    """Try multiple strategies to extract valid JSON from LLM output."""
    if not text:
        return None
    try:
        return json.loads(text)
    except (json.JSONDecodeError, TypeError):
        pass
    match = re.search(r'```(?:json)?\s*(\{[\s\S]*?\})\s*```', text)
    if match:
        try:
            return json.loads(match.group(1))
        except (json.JSONDecodeError, TypeError):
            pass
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

        try:
            pdf_reader = pypdf.PdfReader(io.BytesIO(content))
            text = ""
            for page in pdf_reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
        except Exception:
            text = content.decode("utf-8", errors="ignore")

        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from file")

        # --- Rule-based pre-flight checks ---
        text_stats = validate_contract_text(text)
        if not text_stats["is_valid"]:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Contract text too short ({text_stats['word_count']} words). "
                    "Please upload a valid contract document."
                ),
            )

        # --- Rule-based contract type detection ---
        contract_type = detect_contract_type(text)
        required_clauses = get_required_clauses_for_type(contract_type)
        required_clauses_str = ", ".join(required_clauses)

        # Step 1: extract clauses (inject contract type as context)
        extraction_input = (
            f"CONTRACT TYPE (detected): {contract_type.upper()}\n\n"
            f"CONTRACT TEXT:\n{text}"
        )
        clauses = await run_agent(clause_extractor_agent, extraction_input)

        # Steps 2-4: run in parallel — all take clauses as input.
        # Missing clause agent receives the type-specific required-clause checklist.
        missing_input = (
            f"CONTRACT TYPE: {contract_type.upper()}\n"
            f"REQUIRED CLAUSES FOR THIS CONTRACT TYPE: {required_clauses_str}\n\n"
            f"EXTRACTED CLAUSES:\n{clauses}"
        )
        risks, contradictions, missing = await asyncio.gather(
            run_agent(risk_analyzer_agent, clauses),
            run_agent(contradiction_detector_agent, clauses),
            run_agent(missing_clause_agent, missing_input),
        )

        # Step 5: compile final report
        summary_input = (
            f"CONTRACT CLAUSES:\n{clauses}\n\n"
            f"RISK ANALYSIS:\n{risks}\n\n"
            f"CONTRADICTIONS:\n{contradictions}\n\n"
            f"MISSING PROTECTIONS:\n{missing}"
        )
        report_text = await run_agent(summary_agent, summary_input)

        report_data = extract_json(report_text)
        if report_data is None:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to parse analysis results. Raw output: {report_text[:500]}"
            )

        # --- Rule-based post-AI risk override ---
        report_data = compute_risk_override(report_data)

        report_data["filename"] = file.filename or "contract.pdf"
        report_data["date"] = date_type.today().isoformat()
        report_data["contractType"] = contract_type
        report_data["textStats"] = {
            "wordCount": text_stats["word_count"],
            "warnings": text_stats["warnings"],
        }

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
