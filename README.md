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

## Rule-Based Decision Layer

In addition to the five AI agents, Lexara runs a deterministic rule engine at multiple points in the pipeline. These rules do not use AI. They execute instantly, produce consistent outputs every time, and act as a check on the AI agents rather than a replacement for them.

**Pre-flight contract validation.** Before any agent runs, a rule-based validator checks word count and text quality. Contracts under 50 words are rejected with an error. Contracts under 80 words get a warning that text extraction may have failed. Contracts with very low average word length are flagged as potentially garbled OCR output. This prevents the AI pipeline from wasting time on bad input and surfaces file extraction problems directly to the user.

**Contract type detection.** A keyword-frequency classifier scores the extracted text against six contract types: NDA, employment, SaaS, service agreement, lease, and purchase. The highest-scoring type is identified and passed into the pipeline in two ways. The clause extractor receives the detected type as context so it applies appropriate labeling. The missing clause agent receives a type-specific checklist of required clauses rather than a generic list. An NDA pipeline checks for confidentiality and IP ownership. An employment pipeline checks for non-compete, termination notice, and salary terms. A SaaS pipeline checks for liability cap, SLA, and data processing protections.

**Pre-AI content scanning.** Before the AI agents run, six pattern-based detectors scan the raw contract text for specific high-risk clause patterns that should always be flagged regardless of how the AI interprets them. These detectors check for auto-renewal clauses, unilateral modification rights, mandatory arbitration clauses, class action waivers, perpetual or irrevocable IP grants, and liquidated damages or penalty provisions. Each detector runs against the full text using keyword and phrase matching. Any matches are collected as rule flags and shown in the report alongside the AI findings. The governing law jurisdiction is also extracted at this stage and shown in the report header.

**Post-AI risk override.** After the summary agent produces its JSON report, the rule engine recomputes the overall risk score deterministically from the raw clause counts. High-risk clauses are weighted at full value and medium-risk clauses at half. The formula produces a consistent percentage regardless of how the AI phrased its summary. If the computed risk level is higher than what the AI reported, the rule engine escalates it and adds a plain-English explanation to the report. This flag appears as a banner at the top of the report UI.

The rule engine ensures the system behaves predictably, produces auditable risk scores, flags specific dangerous patterns that are easy to miss, and adapts its missing-clause analysis to the type of contract being reviewed.

## Guardrails

Lexara uses a set of hard-coded guardrails that run independently of the AI agents. These are not suggestions or heuristics. They are deterministic checks that always run, always produce the same output for the same input, and cannot be influenced by how the AI interprets the contract.

This matters because AI models can miss things, phrase findings inconsistently, or underreport risk. The guardrails exist to catch what should never slip through regardless of AI behavior.

**Input validation guardrail.** The contract text must meet a minimum quality threshold before the pipeline runs at all. If the text is too short or looks like garbled OCR output, the user is warned or blocked. This prevents the AI from hallucinating analysis on broken input.

**Contract type classifier.** The system determines what kind of contract it is reading using keyword frequency scoring, not by asking the AI. This means the missing clause checklist the AI receives is always calibrated to the correct contract type. An NDA always gets checked for confidentiality and IP clauses. An employment contract always gets checked for non-compete and payment terms. This does not depend on the AI making the right call.

**Auto-renewal detector.** Scans the contract for language like "automatically renew", "successive terms", "unless cancelled", and similar phrases. Auto-renewal clauses are one of the most commonly missed contract risks because they are often buried in boilerplate. If found, a flag is added to the report with a plain-English explanation and a note to calendar the cancellation deadline.

**Unilateral modification detector.** Scans for language like "may amend at any time", "at its sole discretion", "reserves the right to modify", and similar phrases. These clauses allow one party to change the contract without the other's agreement. They are a serious risk in vendor and SaaS agreements and often go unnoticed. If found, the report flags the specific risk.

**Arbitration and class action waiver detector.** Scans for mandatory arbitration language and class action waiver language separately. Mandatory arbitration removes the right to sue in court. A class action waiver removes the right to join group lawsuits. Both are rights-limiting provisions that many reviewers overlook. Each triggers its own distinct flag in the report.

**Perpetual and irrevocable rights detector.** Scans for language like "perpetual license", "irrevocable right", "in perpetuity", "work made for hire", and similar phrases. These clauses can permanently transfer intellectual property or data rights to the counterparty without the signing party realising it. This detector runs separately for license grants and for data or work product ownership.

**Liquidated damages detector.** Scans for penalty clauses, liquidated damages provisions, fixed fee penalties for breach or late payment, and similar language. These provisions set predetermined financial consequences that may be disproportionate or unenforceable. If found, the report flags the clause and notes that the amount should be reviewed for proportionality.

**Governing law extractor.** Identifies the jurisdiction whose law governs the contract using pattern matching on standard governing law language. The detected jurisdiction is shown in the report header so the reviewer immediately knows which state or country's laws apply. If no governing law clause is found, the missing clause agent is already configured to flag it.

**Post-AI risk recomputation.** After the AI produces its report, the rule engine independently recalculates the risk percentage from the raw clause counts using a weighted formula. High-risk clauses count at full weight, medium-risk clauses at half. If this computed score is higher than what the AI reported, the risk level is escalated and the report explains why. This ensures the final risk rating is always consistent with the actual clause breakdown, not just with whatever the AI chose to write.

All guardrail flags are collected and displayed in the report alongside the AI findings. They appear first in the flags section so the reviewer sees the deterministic findings before the AI-generated ones.

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


