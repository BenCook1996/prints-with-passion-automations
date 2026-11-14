# Handoff Report: Milestone 5 — Explorer 2
## Investigation & Implementation Plan: `strikezone_ctr_and_competitor_rewriter.mjs` Title Boundary Truncator & Collection Intent Guard

---

### 1. Observation

#### 1.1 Direct Code Inspection of `strikezone_ctr_and_competitor_rewriter.mjs`
Inspection of `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\strikezone_ctr_and_competitor_rewriter.mjs` lines 21–44 reveals hard slicing at 66 characters and blind singular keyword overwriting:

```javascript
// strikezone_ctr_and_competitor_rewriter.mjs:21-44
function buildCompetitorSpecTitleAndMeta(entry, currentTitle = '') {
  const kw = entry.keyword || entry.primaryKeyword || 'Studio Edition';
  const sub = entry.substrate || 'Desk Mats';
  const titleCasedKw = kw
    .split(/\s+/)
    .map(w => (/^(uk|xxl|xl|mm|cm|gsm|tkl|rgb)$/i.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');

  if (sub === 'Canvas Wall Art') {
    const newTitle = `${titleCasedKw} | 1.25" Pine Framed Canvas (CM & Inch)`.slice(0, 66);
    const newMeta = `${titleCasedKw} printed on 400gsm matte cotton-poly canvas over 1.25" (32mm) kiln-dried pine stretcher bars. Sized for 60%–75% sofa/bed width w/ free tracked delivery.`.slice(0, 158);
    return { newTitle, newMeta };
  }

  if (sub === 'Desk Mats') {
    const newTitle = `${titleCasedKw} | 900x400x4mm (35.4"x15.7") Stitched Pad`.slice(0, 66);
    const newMeta = `${titleCasedKw} engineered with a 4mm high-density natural rubber base, 360° anti-fray stitched edges & micro-woven cloth in 90×40cm, 80×30cm & 60×35cm sizes.`.slice(0, 158);
    return { newTitle, newMeta };
  }

  const newTitle = `${titleCasedKw} | Dual CM & Inch Studio Sizing Guide`.slice(0, 66);
  const newMeta = `Compare exact Metric (cm/mm) and Imperial (inch) dimensions for ${kw}. Includes furniture-width formulas, material thickness specs & curated studio editions.`.slice(0, 158);
  return { newTitle, newMeta };
}
```

#### 1.2 Calling Convention Flaw in `main()`
In `strikezone_ctr_and_competitor_rewriter.mjs` lines 79–96:
```javascript
// strikezone_ctr_and_competitor_rewriter.mjs:79-96
  for (const entry of selected) {
    const url = entry.targetUrl || entry.url;
    const { newTitle, newMeta } = buildCompetitorSpecTitleAndMeta(entry);

    if (url.startsWith('/collections/')) {
      const handle = url.replace('/collections/', '').split('?')[0];
      const d = await shopifyGql(`
        query GetCol($handle: String!) {
          collectionByHandle(handle: $handle) {
            id handle title seo { title description }
          }
        }
      `, { handle });
      const col = d?.collectionByHandle;
      if (!col) continue;

      const prevTitle = col.seo?.title || col.title;
      const prevMeta = col.seo?.description || '';
```
`buildCompetitorSpecTitleAndMeta(entry)` is invoked before fetching `col` from Shopify GraphQL, completely ignoring `col.title`, `col.handle`, and whether the URL is a collection.

#### 1.3 Concrete Manifestations in `seo_keyword_forecast_tracker.json`
Verbatim optimization events in `seo_keyword_forecast_tracker.json` demonstrate both failure modes:

1. **Collection Overwritten with Single Product Query (Event `EVT-KW-005-56092` lines 662–670):**
   - URL: `/collections/japanese-anime-desk-mats`
   - Collection Human Title: `Japanese, Samurai, Sakura & Ukiyo-e Extended Desk Mats` (14 active products)
   - Search Query: `japanese wave desk mat`
   - Produced `newTitle`: `"Japanese Wave Desk Mat | 900x400x4mm (35.4\"x15.7\") Stitched Pad"`
   - Produced `newMeta`: `"Japanese Wave Desk Mat engineered with a 4mm high-density natural rubber base..."`
   - Impact: Destroyed collection category rankings for samurai, sakura, and anime desk mats; narrowed search intent to a single product design.

2. **Mid-Word Character Slicing & Dangling Parentheses:**
   - In `/collections/abstract-minimalist-bauhaus-canvas-wall-art`:
     `Minimalist Bauhaus Canvas Print | 1.25" Pine Framed Canvas (CM & Inch)` sliced at 66 characters produced:
     `"Minimalist Bauhaus Canvas Print | 1.25" Pine Framed Canvas (CM & I"` (exact length 66).
     Dangling ampersand, cut word `Inch -> I`, unclosed parenthesis `(CM & I`.
   - In `/pages/desk-setup-hardware-compatibility-guide`:
     `"Desk Setup Hardware Compatibility Guide | Dual CM & Inch Studio Si"` (exact length 66, cut word `Sizing -> Si`).
   - In `/blogs/news/uk-desk-mat-size-guide-60x35-xl-vs-80x40-xxl-compared`:
     `"UK Desk Mat Size Guide (2026): 60×35 cm XL vs 80×40 cm XXL Extended Mo"` (exact length 66, cut word `Mousepad -> Mo`).

---

### 2. Logic Chain

1. **Character Length Limit:** Search engines (Google SERP desktop & mobile) truncate titles that exceed ~600px width, roughly 55 to 60 characters. Hard slicing at 66 characters (`.slice(0, 66)`) directly violates the requirement that titles must be strictly `<= 60` characters.
2. **Word-Boundary Safety:** Slicing at an arbitrary character index cuts through words (`Inch -> I`, `Extended -> Mo`, `Sizing -> Si`). To prevent mid-word truncations, the string must only be cut at whitespace delimiters.
3. **Punctuation & Conjunction Hygiene:** When a title is shortened, the cutoff point often lands right after or before a conjunction, preposition, or delimiter (`|`, `-`, `&`, `,`, `:`, `and`, `or`, `with`, `for`, `in`, `to`, `vs`). Leaving trailing delimiters produces broken snippets. A cleaning loop must strip trailing delimiters and stop-words until the title terminates on a meaningful noun or modifier.
4. **Parenthesis / Bracket Balancing:** A truncated title that contains an unmatched opening `(` or `[` (such as `(CM & I`) must remove the unclosed parenthetical block to ensure syntactic integrity.
5. **Spec-Candidate Fallback Architecture:** Rather than appending a single monolithic spec candidate and slicing it, the generator must accept an ordered list of `specCandidates` (from most detailed spec to compact spec to brand fallback `Prints With Passion`). The helper evaluates each candidate `${primaryPart} | ${candidate}` against `maxChars = 60`. If none fit, it falls back to `primaryPart` alone (cleanly word-boundary truncated if `primaryPart` itself exceeds 60 characters).
6. **Collection Intent vs. Single-Product Intent:**
   - Single-product queries (e.g. `japanese wave desk mat`, `minimalist bauhaus canvas print`) specify individual product SKUs or designs with singular substrate nouns (`desk mat`, `canvas print`, `hoodie`).
   - Collection pages aggregate multiple thematic designs (e.g. 14 products in `japanese-anime-desk-mats`).
   - Overwriting a collection's `<title>` and `<meta>` with a singular product query collapses the collection's breadth, alienates users searching for other designs in that collection, causes keyword cannibalization against the actual product PDP, and violates Google's query intent matching.
   - Therefore, when targeting `/collections/*`:
     - If the incoming keyword is a single-product query, the guard MUST suppress the single-product query and preserve the collection's thematic title and plural substrate (`XXL Desk Mats`, `Canvas Wall Art`, `Cushion Covers`, `Throw Blankets`, `Bath Mats`).
     - If the incoming keyword is a category-level or plural query (e.g. `xxl desk mats uk`, `anime desk mats`), it may be used, ensuring substrate nouns are pluralized.
     - The collection `<meta>` must describe a curated collection of studio designs rather than a singular manufactured product.

---

### 3. Caveats

1. **Existing Shopify Metadata State:** The live Shopify store currently contains the previously rewritten titles (e.g. for `japanese-anime-desk-mats` and `abstract-minimalist-bauhaus-canvas-wall-art`). Milestone 3 (`remediate_gsc_collections_redirects_and_meta.mjs`) is responsible for directly remediating live store metadata. The upgrade to `strikezone_ctr_and_competitor_rewriter.mjs` ensures that future weekly automation runs never re-introduce these corruptions.
2. **Title Cooldown Window:** The 14-day title cooldown window (`isWithinTitleCooldown`) in `weekly_gsc_forecast_and_strikezone_tracker.mjs` prevents re-optimizing URLs updated within the last 14 days. This cooldown logic is sound and MUST be preserved without modification.
3. **No Direct Code Editing During Investigation:** Per explorer constraints, no production files were modified. All algorithms were tested via prototype runner `test_fit_title.mjs` inside this agent's state folder.

---

### 4. Conclusion & Complete Implementation Specification

The proposed implementation replaces lines 21–44 and modifies the collection handling block in `strikezone_ctr_and_competitor_rewriter.mjs`.

#### 4.1 Implementation Code for `strikezone_ctr_and_competitor_rewriter.mjs`

```javascript
/**
 * Word-boundary-safe title truncator guaranteeing strictly <= maxChars,
 * zero mid-word cuts, zero dangling delimiters/conjunctions, and balanced parentheses.
 *
 * @param {string} primaryPart - Core keyword or page title
 * @param {string[]} specCandidates - Ordered list of competitor spec suffixes (richest to shortest)
 * @param {number} maxChars - Hard ceiling (default: 60)
 * @returns {string} Fully sanitized title strictly <= maxChars
 */
export function fitTitleUnder60Chars(primaryPart, specCandidates = [], maxChars = 60) {
  const cleanPart = (str) => (!str ? '' : str.trim().replace(/\s+/g, ' '));

  const stripTrailingDangling = (str) => {
    let s = str.trim();
    let prev = '';
    while (s !== prev) {
      prev = s;
      // Strip trailing delimiters/punctuation: -, |, &, :, ;, ,, /, \, ~, +, (, [
      s = s.replace(/[\s\-_|&:,;/\\~+([\]]+$/, '').trim();
      // Strip trailing conjunctions, prepositions, and stop-words
      s = s.replace(/\s+\b(and|or|nor|but|for|with|w|in|on|at|to|by|from|of|the|a|an|vs)\b$/i, '').trim();
    }
    return s;
  };

  const balanceBrackets = (str) => {
    let s = str;
    const openParen = (s.match(/\(/g) || []).length;
    const closeParen = (s.match(/\)/g) || []).length;
    if (openParen > closeParen) {
      const lastOpen = s.lastIndexOf('(');
      if (lastOpen !== -1) {
        s = s.slice(0, lastOpen);
      }
    } else if (closeParen > openParen) {
      s = s.replace(/\)+$/, '');
    }

    const openBracket = (s.match(/\[/g) || []).length;
    const closeBracket = (s.match(/\]/g) || []).length;
    if (openBracket > closeBracket) {
      const lastOpen = s.lastIndexOf('[');
      if (lastOpen !== -1) {
        s = s.slice(0, lastOpen);
      }
    } else if (closeBracket > openBracket) {
      s = s.replace(/\]+$/, '');
    }

    return stripTrailingDangling(s);
  };

  const truncateAtWordBoundary = (str, limit) => {
    let s = stripTrailingDangling(str);
    if (s.length <= limit) {
      return balanceBrackets(s);
    }
    const sliced = s.slice(0, limit);
    const lastSpace = sliced.lastIndexOf(' ');
    if (lastSpace > 0) {
      s = sliced.slice(0, lastSpace);
    } else {
      s = sliced;
    }
    s = stripTrailingDangling(s);
    s = balanceBrackets(s);
    if (s.length > limit) {
      s = s.slice(0, limit);
      s = stripTrailingDangling(s);
      s = balanceBrackets(s);
    }
    return s;
  };

  let primary = cleanPart(primaryPart);
  if (!primary) return 'Prints With Passion';

  const candidates = Array.isArray(specCandidates)
    ? specCandidates.map(cleanPart).filter(Boolean)
    : [cleanPart(specCandidates)].filter(Boolean);

  // 1. Evaluate candidate specs in order (longest/richest first)
  for (const cand of candidates) {
    const full = cand ? `${primary} | ${cand}` : primary;
    if (full.length <= maxChars) {
      const balanced = balanceBrackets(stripTrailingDangling(full));
      if (balanced.length <= maxChars) {
        return balanced;
      }
    }
  }

  // 2. Fall back to primaryPart alone if it fits
  if (primary.length <= maxChars) {
    const balanced = balanceBrackets(stripTrailingDangling(primary));
    if (balanced.length <= maxChars) {
      return balanced;
    }
  }

  // 3. Truncate primaryPart cleanly at word boundary
  return truncateAtWordBoundary(primary, maxChars);
}

/**
 * Classifies whether a search query represents a singular product search
 * rather than a category-level / collection search.
 */
const SINGULAR_PRODUCT_PATTERN = /\b(desk\s*mat|mouse\s*pad|mousepad|cushion\s*cover|pillow\s*case|throw\s*blanket|bath\s*mat|canvas\s*print|hoodie|t-shirt|tee)\b/i;
const PLURAL_CATEGORY_PATTERN = /\b(desk\s*mats|mouse\s*pads|mousepads|cushion\s*covers|pillow\s*cases|throw\s*blankets|bath\s*mats|canvas\s*prints|canvas\s*wall\s*art|wall\s*art|hoodies|t-shirts|tees|prints|collections?|pads|covers|blankets|rugs)\b/i;

export function isSingleProductQuery(keyword, substrate = '') {
  if (!keyword) return false;
  const kw = keyword.toLowerCase().trim();
  const hasSingular = SINGULAR_PRODUCT_PATTERN.test(kw);
  const hasPlural = PLURAL_CATEGORY_PATTERN.test(kw);
  return hasSingular && !hasPlural;
}

/**
 * Derives a clean thematic title for a collection preserving category intent.
 */
export function buildCollectionThematicTitle(colHandle, colTitle, substrate) {
  let theme = '';
  if (colTitle) {
    theme = colTitle
      .replace(/\b(Extended\s+)?(Desk\s+Mats|Canvas\s+Wall\s+Art|Cushion\s+Covers|Throw\s+Blankets|Bath\s+Mats|Cotton\s+T-Shirts|Graphic\s+Hoodies|Hoodies)\b/gi, '')
      .replace(/[\s\-_|,;&]+$/, '')
      .trim();
  }

  if (!theme || theme.length > 30) {
    if (colHandle) {
      theme = colHandle
        .replace(/-(desk-mats|canvas-wall-art|cushion-covers|throw-blankets|bath-mats|graphic-t-shirts|graphic-hoodies)$/, '')
        .split('-')
        .map(w => (/^(uk|xxl|xl|mm|cm|gsm|tkl|rgb)$/i.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
        .join(' ');
    }
  }

  const substrateCategoryMap = {
    'Canvas Wall Art': 'Canvas Wall Art',
    'Desk Mats': 'XXL Desk Mats',
    'Cushion Covers': 'Cushion Covers',
    'Throw Blankets': 'Throw Blankets',
    'Bath Mats': 'Bath Mats',
    'Hoodies': 'Graphic Hoodies',
    'Graphic T-Shirts': 'Graphic Tees'
  };

  const subName = substrateCategoryMap[substrate] || substrate || 'Desk Mats';
  return `${theme} ${subName}`.trim();
}

/**
 * Generates spec-first title and meta with intent protection and graduated candidates.
 */
export function buildCompetitorSpecTitleAndMeta(entry, currentTitle = '', colContext = null) {
  const kw = entry.keyword || entry.primaryKeyword || 'Studio Edition';
  const sub = entry.substrate || 'Desk Mats';
  const url = entry.targetUrl || entry.url || '';
  const isCollection = url.startsWith('/collections/') || entry.pageType === 'collection';

  const titleCasedKw = kw
    .split(/\s+/)
    .map(w => (/^(uk|xxl|xl|mm|cm|gsm|tkl|rgb)$/i.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');

  let primaryPart = titleCasedKw;

  if (isCollection) {
    // Collection Intent Guard: Single-product query must not overwrite collection theme
    if (isSingleProductQuery(kw, sub)) {
      const colHandle = colContext?.handle || (url.startsWith('/collections/') ? url.replace('/collections/', '').split('?')[0] : '');
      const colTitle = colContext?.title || currentTitle || '';
      primaryPart = buildCollectionThematicTitle(colHandle, colTitle, sub);
    } else {
      // Pluralize substrate in category query
      primaryPart = titleCasedKw
        .replace(/\bDesk\s+Mat\b/i, 'Desk Mats')
        .replace(/\bCanvas\s+Print\b/i, 'Canvas Prints')
        .replace(/\bCushion\s+Cover\b/i, 'Cushion Covers')
        .replace(/\bThrow\s+Blanket\b/i, 'Throw Blankets')
        .replace(/\bBath\s+Mat\b/i, 'Bath Mats');
    }
  }

  let specCandidates = [];
  let newMeta = '';

  if (sub === 'Canvas Wall Art') {
    specCandidates = [
      '1.25" Pine Framed Canvas (CM & Inch)',
      '1.25" Pine Framed Canvas',
      '1.25" Framed Prints',
      'Framed Canvas Prints',
      'Framed Canvas Wall Art',
      'Prints With Passion'
    ];
    if (isCollection) {
      newMeta = `Shop archival framed canvas wall art (1.25" pine bars) in ${primaryPart.replace(/\s+Canvas\s+Wall\s+Art/i, '')} designs. Sized for sofa/bed width with free tracked UK delivery.`.slice(0, 158);
    } else {
      newMeta = `${primaryPart} printed on 400gsm matte cotton-poly canvas over 1.25" (32mm) kiln-dried pine stretcher bars. Sized for 60%–75% sofa/bed width w/ free tracked delivery.`.slice(0, 158);
    }
  } else if (sub === 'Desk Mats') {
    specCandidates = [
      '900x400x4mm (35.4"x15.7") Stitched Pad',
      '900x400x4mm Stitched Pad',
      '4mm Stitched Gaming Pad',
      'XXL Desk Mats',
      'Prints With Passion'
    ];
    if (isCollection) {
      newMeta = `Explore curated ${primaryPart.replace(/\s+(XXL\s+)?Desk\s+Mats/i, '')} desk mats: 4mm high-density natural rubber base, 360° anti-fray stitched edges & micro-woven cloth. Free UK delivery.`.slice(0, 158);
    } else {
      newMeta = `${primaryPart} engineered with a 4mm high-density natural rubber base, 360° anti-fray stitched edges & micro-woven cloth in 90×40cm, 80×30cm & 60×35cm sizes.`.slice(0, 158);
    }
  } else if (sub === 'Cushion Covers') {
    specCandidates = [
      '45x45cm Double-Sided Velvet Pillows',
      '45x45cm Soft Velvet Covers',
      'Velvet Cushion Covers',
      'Prints With Passion'
    ];
    newMeta = `Shop curated ${primaryPart} in premium soft velvet (45x45cm / 18x18"). Double-sided archival studio print with concealed zipper and free tracked UK delivery.`.slice(0, 158);
  } else if (sub === 'Throw Blankets') {
    specCandidates = [
      '300 GSM Plush Coral Fleece Throws',
      'Plush Coral Fleece Throws',
      'Plush Throw Blankets',
      'Prints With Passion'
    ];
    newMeta = `Discover ultra-soft 300 GSM ${primaryPart} in plush microfiber flannel fleece. Ideal for sofa, bed or gaming lounge with free tracked UK & EU delivery.`.slice(0, 158);
  } else if (sub === 'Bath Mats') {
    specCandidates = [
      'Non-Slip Memory Foam Bathroom Rugs',
      'Non-Slip Memory Foam Bath Mats',
      'Memory Foam Bath Mats',
      'Prints With Passion'
    ];
    newMeta = `Refresh your bathroom with ${primaryPart}. High-density memory foam core, quick-dry microfiber surface & non-slip backing with free tracked UK delivery.`.slice(0, 158);
  } else {
    specCandidates = [
      'Dual CM & Inch Studio Sizing Guide',
      'Dual CM & Inch Sizing Guide',
      'Studio Sizing Guide',
      'Sizing Guide',
      'Prints With Passion'
    ];
    newMeta = `Compare exact Metric (cm/mm) and Imperial (inch) dimensions for ${kw}. Includes furniture-width formulas, material thickness specs & curated studio editions.`.slice(0, 158);
  }

  const newTitle = fitTitleUnder60Chars(primaryPart, specCandidates, 60);
  return { newTitle, newMeta, primaryPart };
}
```

#### 4.2 Integration into `main()` in `strikezone_ctr_and_competitor_rewriter.mjs`
Modify lines 79–96 so that collection queries fetch `col` before generating metadata:

```javascript
  for (const entry of selected) {
    const url = entry.targetUrl || entry.url;

    if (url.startsWith('/collections/')) {
      const handle = url.replace('/collections/', '').split('?')[0];
      const d = await shopifyGql(`
        query GetCol($handle: String!) {
          collectionByHandle(handle: $handle) {
            id handle title seo { title description }
          }
        }
      `, { handle });
      const col = d?.collectionByHandle;
      if (!col) continue;

      const prevTitle = col.seo?.title || col.title;
      const prevMeta = col.seo?.description || '';
      const { newTitle, newMeta } = buildCompetitorSpecTitleAndMeta(entry, prevTitle, col);
```

---

### 5. Verification Method

#### 5.1 Standalone Test Runner
Execute the verified diagnostic suite:
```powershell
node C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m5_2\test_fit_title.mjs
```

#### 5.2 Verification Checks
1. **Length Invariant:** For every output string, `output.length <= 60` strictly. If `output.length > 60`, test fails.
2. **Word-Boundary Invariant:** No word in the output may be cut in half (e.g. `Extended Mo`, `Studio Si`, `(CM & I`).
3. **Parenthesis Balancing Invariant:** Every opening `(` must have a corresponding closing `)` in the title.
4. **Trailing Delimiter Invariant:** Regex `/[ \-_|&:,;/\\~+([\]]+$/` must not match the output.
5. **Collection Guard Invariant:** When `targetUrl` starts with `/collections/`, single-product keywords (e.g. `japanese wave desk mat`) MUST NOT overwrite the thematic collection title (`Japanese Anime XXL Desk Mats`).
6. **E2E Integration Test:**
```powershell
cd C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine
node tests/e2e_recovery_test_runner.mjs
```
The test runner must confirm zero mid-word truncated titles, zero `&quot;` artifacts, and valid collection metadata.
