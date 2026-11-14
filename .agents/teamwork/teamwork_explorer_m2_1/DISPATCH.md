## 2026-11-13T00:44:24Z
You are Explorer 1 for Milestone 2 (Phase 2 — Collection & Redirect Hygiene).

Working directory: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine
State folder: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m2_1

MANDATORY FIRST STEP:
Read the authoritative user request at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\ORIGINAL_REQUEST.md

Read the project architecture and global plan at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\PROJECT.md

Read the Milestone 2 scope at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\sub_orch_milestone_2\SCOPE.md

Read the prior survey findings and artifacts at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_survey_2\handoff.md
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_survey_2\discontinued_28_details.json

Your specific focus:
1. Validate the exact list of 28 discontinued collections to be deleted via `collectionDelete` using their exact GIDs and handles.
2. Confirm that `frontpage` (`gid://shopify/Collection/437768978743`) is strictly protected by hardcoded safety guardrails in any deletion logic so it can NEVER be deleted.
3. Formulate the exact GraphQL mutation `collectionDelete(input: { id: $id })` structure, error handling (userErrors, throttling/leaky bucket delays), and idempotency checks.
4. Define pre-execution and post-execution verification checks for collection deletion.

Produce a structured handoff report in `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m2_1\handoff.md`.
When done, message the orchestrator with the summary and path to your handoff report.
Do NOT modify or write source code. Exploration and strategy only.
