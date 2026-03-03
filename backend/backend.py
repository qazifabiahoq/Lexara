import google.generativeai as genai
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import json
import re
import io
import pypdf
from datetime import date as date_type

genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ANALYSIS_PROMPT = '''You are Lexara, an AI contract review tool for law firms and paralegals.
Analyze the contract below and return a single JSON report.

Return ONLY a valid JSON object — no markdown, no code fences, no extra text.

JSON structure:
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
  "redlineMemo": "Full professionally written redline memo covering all flagged issues and suggested changes in formal legal language"
}

Rules:
- Extract every clause and label it by type (Payment Terms, Termination, Liability, IP Ownership, Non-Compete, Confidentiality, Dispute Resolution, Governing Law, Force Majeure, Warranties, Assignment, Amendments, etc.)
- Assign risk: "high" = favors other party / vague / unlimited liability; "medium" = standard but can be tightened; "low" = fair and clear
- Check for contradictions between clauses
- Flag any missing standard protections (Liability Cap, Indemnification, Force Majeure, Governing Law, etc.)
- Use only "high", "medium", or "low" (lowercase) for all risk/severity fields
- If no contradictions exist, set "contradictions" to []
- If no missing protections, set "missingProtections" to []
- Write redlineMemo in plain text only — no markdown, no **bold**, no * bullets, no # headers. Use numbered lists and line breaks.
- riskPercentage should reflect the proportion of high+medium risk clauses

CONTRACT TEXT:
'''


def extract_json(text: str):
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

        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(ANALYSIS_PROMPT + text)
        report_text = response.text

        report_data = extract_json(report_text)
        if report_data is None:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to parse analysis results. Raw output: {report_text[:500]}"
            )

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
