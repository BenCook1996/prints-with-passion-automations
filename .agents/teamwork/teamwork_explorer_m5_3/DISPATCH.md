# DISPATCH â€” Explorer 3 (Milestone 5: SEO Lint Gate & Storewide Validator)

## Task Description
Investigate `catalog_uniqueness_and_seo_lint_gate.mjs` and `verify_40_subcollections_counts.mjs` in `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine`.
Your goal is to provide a complete, verified investigation and detailed implementation recommendation for:
1. `catalog_uniqueness_and_seo_lint_gate.mjs`: Adding audit and auto-sanitization rules for:
   - Double-escaped HTML entities (`&quot;`, `&amp;quot;`, `&amp;amp;`, `&#39;`).
   - Broken template grammar fragments (`Transform with...`, `Elevate with...`, `Style with...`).
   - Dangling truncated titles (`-`, `|`, `&`, `Mo`, `Si`).
   - 0-product collections (flagging and cleaning).
2. `verify_40_subcollections_counts.mjs`: Upgrading it from a 48-item subcollection checker into a comprehensive storewide collection gate that queries all Shopify collections, verifying 0 empty collections (excluding `frontpage`), valid title lengths (<=60 chars, no cut mid-word), plain-text descriptions (140-158 chars, no unescaped entities or template fragments), and presence in sitemaps.

## Mandatory Files to Read First
- `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\ORIGINAL_REQUEST.md` (Read in full!)
- `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\PROJECT.md`
- `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\sub_orch_milestone_5\SCOPE.md`
- `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\catalog_uniqueness_and_seo_lint_gate.mjs`
- `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\verify_40_subcollections_counts.mjs`

## Output Requirements
Write your detailed findings and implementation plan to `handoff.md` in your state folder:
`C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m5_3\handoff.md`
Report back via `send_message` when complete. Do NOT write code or modify files outside your state folder.

## 2026-11-13T01:02:18Z
**Context**: Milestone 5 — Explorer 3 (SEO Lint Gate & Storewide Validator)
**Content**: Checking in on your investigation of catalog_uniqueness_and_seo_lint_gate.mjs and verify_40_subcollections_counts.mjs.

