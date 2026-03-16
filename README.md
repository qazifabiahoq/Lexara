# Lexara

AI-powered multi-agent contract review platform for legal teams and law firms.

Live Demo: https://lexara-sigma.vercel.app/

## The Problem

Contract review is one of the most time-consuming and expensive tasks in legal work. A single contract can take a trained paralegal or attorney 30 minutes to several hours to review properly. They have to read every clause, assess risk, check for contradictions, flag missing protections, and write a memo summarizing their findings. For firms handling high contract volumes, this creates a serious bottleneck.

The cost falls on both sides. The firm absorbs it in analyst hours. The client absorbs it in legal fees and delayed turnaround.

Lexara was built to eliminate that bottleneck.

## What Lexara Does

Lexara is a contract review platform that takes a PDF contract and returns a complete attorney-ready analysis in approximately two minutes.

The user uploads a contract and watches five specialized AI agents work through it in sequence and in parallel. By the time the pipeline finishes, the output is a full structured report with every clause identified and categorized, a risk score for each one, internal contradictions flagged, missing standard protections listed, an executive summary, and a complete redline memo written in legal language ready to be edited and sent.

What previously required a trained paralegal now happens automatically. The human focuses on judgment. The machine handles the first pass.

## The Five AI Agents

Rather than sending the entire contract to a single AI model, Lexara uses a multi-agent pipeline where each agent is specifically designed, prompted, and configured for one task. The output of each agent becomes the input context for the next.

**Agent 1 is the Clause Extractor.**
It reads the raw contract text and identifies every clause, labels it by type, and writes a plain English summary of what each clause actually says. The output is a numbered, structured list of every provision in the contract with clear labels a non-specialist can read.

**Agent 2 is the Risk Analyzer.**
This agent receives the clause list and assigns each clause a risk score from 0 to 10 along with a classification of High, Medium, or Low. It explains exactly why each clause is risky, what the specific legal exposure is, and suggests revised language for every high-risk clause. The output is a risk summary with counts, percentages, and actionable revision suggestions.

**Agent 3 is the Contradiction Detector.**
This agent reads the full clause list and finds internal conflicts where two clauses say different things or create incompatible obligations. It assesses the severity of each contradiction and recommends how to resolve it. Contradictions in contracts are a common source of disputes and litigation. This agent surfaces them automatically.

**Agent 4 is the Missing Clause Agent.**
This agent checks the contract against a list of twelve standard clause types that should appear in a well-drafted agreement. For every missing clause, it assesses the risk of its absence and suggests specific language to add. A contract that looks clean on the surface may be missing critical protections. This agent finds what is not there.

**Agent 5 is the Summary Agent.**
This is the final synthesis step. The summary agent receives everything the first four agents found and compiles it into a structured JSON report. It writes a three to four sentence executive summary covering the biggest concerns, identifies the top three most dangerous clauses, and generates a complete redline memo written in professional legal language. This is the document the attorney reviews, edits, and acts on.

## Why Multi-Agent Architecture

A single AI model given all five tasks at once produces inconsistent results that are hard to audit and harder to trust. Separating the work into five specialized agents means each one can be optimized independently for exactly what it needs to do. The clause extractor never has to think about contradiction logic. The missing clause agent never has to think about risk scoring. The summary agent has the benefit of four structured expert inputs before it writes a single sentence.

Agents 2, 3, and 4 run in parallel, which means the risk analysis, contradiction detection, and missing clause check happen simultaneously rather than sequentially. This is what makes the two-minute turnaround possible.

The architecture also makes the system transparent and auditable. Every step of the analysis is visible separately. When an attorney reviews a Lexara report, they can see exactly what each agent found and why the final memo was written the way it was. In legal work, the reasoning matters as much as the conclusion.

## Who This Is Built For

Lexara is designed for law firms and legal departments that handle high volumes of contracts and need to reduce first-pass review time without compromising accuracy or missing critical issues.

For paralegals and junior attorneys, the benefit is immediate. Every contract comes with a complete structured breakdown before they open it. They can focus their time on the clauses that actually matter instead of reading through boilerplate to find them.

For the firm, the benefit is systemic. Lexara handles the first pass on every contract, flags everything worth flagging, and produces a redline memo that requires editing rather than drafting from scratch. That is a different category of work.

## Technical Stack

Lexara is a full-stack web platform with a React 18 frontend built with TypeScript and Vite, deployed on Vercel, and a Python FastAPI backend deployed on Render. All AI processing runs through Google ADK with Gemini 2.5 Flash.

The five agents are orchestrated using Google ADK's LlmAgent and Runner pattern. Each agent runs on Gemini 2.5 Flash with a custom instruction set that defines its role, required output structure, and strict behavioral constraints. Agents are designed to produce clean structured JSON output every time.

The backend orchestrates the pipeline sequentially for the extraction and summary steps, and in parallel for the risk, contradiction, and missing clause steps. All API credentials are stored server-side only and never exposed to the client. The frontend uses Supabase for authentication and session management.

Report output includes a risk visualization chart, expandable clause breakdowns, contradiction listings, missing protection flags, and an editable redline memo that can be copied or exported as a PDF.

## The Bigger Picture

Law firms collectively spend billions of hours per year on contract review. Most of that time is not spent on the hard judgment calls. It is spent reading through standard boilerplate, finding the unusual clauses, and writing up what was found. That part is exactly what Lexara automates.

Lexara demonstrates that the core contract review workflow, clause extraction, risk scoring, contradiction detection, missing clause identification, and memo generation, can be fully automated for the first pass on any standard business contract. This frees attorneys and paralegals to focus their expertise on negotiation strategy, client judgment, and the complex edge cases that genuinely require human reasoning.

A review that used to take hours now takes two minutes. That is the whole point.


