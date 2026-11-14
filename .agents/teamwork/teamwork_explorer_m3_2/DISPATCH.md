# Dispatch — Explorer M3-2: SEO Metadata Copywriter & Length Validator
Working directory: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine
State folder: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m3_2


## 2026-11-14T02:34:01Z
You are Explorer 2 (SEO Metadata Copy Validator) for Milestone 3 (Phase 3 — Bulk Optimization of Active Collection SEO Metadata).

MANDATORY FIRST STEP:
Read the authoritative user request at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\ORIGINAL_REQUEST.md

Read the project plan and milestone scope at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\PROJECT.md
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\sub_orch_milestone_3\SCOPE.md

Read the preliminary proposals and audits:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_survey_2\fitted_collection_proposals.json
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_survey_2\active_collections_seo_audit.json

Your working directory:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine

Your state folder:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m3_2

Objective:
1. Conduct a rigorous audit of the proposed SEO titles and descriptions for all active collections.
2. Verify strict compliance with Requirement R3:
   - 100% of seo.title values MUST be bespoke, high-intent commercial titles, word-boundary safe, and strictly <= 60 characters.
   - 100% of seo.description values MUST be plain text, grammatically complete sentences, strictly between 140 and 158 characters (CRITICAL: preliminary survey 2 had flaws like bath-mats at 116 chars - identify and fix ALL character count violations).
   - Zero double-escaped HTML entities (&quot;, &amp;quot;, &amp;, etc.).
   - Zero broken template phrases ("Transform with...", "Elevate with...", "Style with...", "Refresh with...", "Upgrade with...").
   - Specifically repair:
     * /collections/japanese-anime-desk-mats: must be bespoke category-level title (<= 60 chars), not a single-product title.
     * /collections/abstract-minimalist-bauhaus-canvas-wall-art: fix hard truncation at "(CM & I" to clean, complete title (<= 60 chars).
3. Generate a 100% compliant, fully verified proposals file at:
   C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m3_2\verified_collection_proposals.json
4. Write your detailed handoff report to `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m3_2\handoff.md`.
5. Send completion message back to parent orchestrator via send_message. Do NOT write or modify application code directly.
