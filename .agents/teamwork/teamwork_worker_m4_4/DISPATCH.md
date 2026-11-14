# DISPATCH — Worker 4 (Milestone 4, Iteration 2: Final Storefront & Metadata Remediation)

## Objective
Implement and execute the production fixes for Milestone 4 (Requirement R4) to resolve the 16 storefront meta description length overflows and entity cleanings, and achieve 100% pass across all live storefront and boundary test suites.

## Mandatory Integrity Warning
> DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Authoritative Inputs
- `ORIGINAL_REQUEST.md`: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\ORIGINAL_REQUEST.md
- `PROJECT.md`: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\PROJECT.md
- `SCOPE.md`: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\sub_orch_milestone_4\SCOPE.md
- Explorer 2 Remediation JSON: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m4_it2_2\remediated_16_descriptions.json
- Explorer 2 Handoff: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m4_it2_2\handoff.md
- Explorer 3 Verification Blueprint: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m4_it2_3\handoff.md
- Challenger 1 Storefront Crawler: `tests/adversarial_challenger_m4_crawler.mjs`
- Challenger 2 Boundary Test Harness: `tests/adversarial_challenger_m4_boundary_test.mjs`
- Local Token: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.shopify_token.json
- Auth Helper: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\lib\cloud-env.mjs

## File Ownership
You exclusively own and may create / edit:
- `snippets/head.liquid` (local theme file and live theme asset via Shopify Admin Asset API)
- `remediate_pages_and_articles_seo.mjs` (production remediation script)
- Files in your state folder: `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_worker_m4_4\`

## Execution Requirements
1. **Fix `snippets/head.liquid` Theme Asset**:
   - In `snippets/head.liquid` line 56, remove the runtime replacement `replace: 'free UK delivery', 'free tracked UK, US & EU delivery'` or scope it so it never mutates curated page/article descriptions.
   - Ensure clean unescaped description output so that curated plain-text descriptions are rendered without expansion or `&amp;` artifacts.
   - Deploy the updated `snippets/head.liquid` to the active theme `gid://shopify/OnlineStoreTheme/177936466293` (theme ID `177936466293`) using the Shopify Admin REST Asset API (`PUT /admin/api/2025-01/themes/177936466293/assets.json`).
2. **Apply Remediated Descriptions to Shopify Admin**:
   - For the 16 URLs in `remediated_16_descriptions.json` (7 static pages + 9 blog articles), update their `global.description_tag` in Shopify Admin via GraphQL `pageUpdate` / `articleUpdate`.
   - For `contact-us`, `size-guide`, and `desk-size-visualizer`: replace any raw `&` with `and` in `global.description_tag` to guarantee clean text when rendered through Liquid.
3. **Footer Menu Alignment**:
   - Verify that the footer menu `gid://shopify/Menu/221177086263` includes `/pages/abstract-geometric-minimalist-wall-art-decor-uk` or ensures that guide link tests in `tests/e2e_recovery_test_runner.mjs --feature=15` pass 100%.
4. **Run Verification Commands**:
   - `node --dns-result-order=ipv4first tests/adversarial_challenger_m4_crawler.mjs`: Must pass 100% of checks (0 failures).
   - `node --dns-result-order=ipv4first tests/adversarial_challenger_m4_boundary_test.mjs`: Must pass 100% of checks (913/913 passed).
   - `node tests/e2e_recovery_test_runner.mjs --feature=14 --dry-run`
   - `node tests/e2e_recovery_test_runner.mjs --feature=15 --dry-run`
   - `node tests/e2e_recovery_test_runner.mjs --feature=16 --dry-run`
   - `node catalog_uniqueness_and_seo_lint_gate.mjs`: 0 violations.

## Completion Criteria
Write your complete report to `handoff.md` in your state folder:
`C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_worker_m4_4\handoff.md`
Report command lines, execution logs, and verification proof.
Send completion message to parent sub-orchestrator.
