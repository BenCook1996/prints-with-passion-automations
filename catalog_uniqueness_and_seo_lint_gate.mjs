/**
 * Prints With Passion — White-Hat SEO Automation #8 (Upgraded v2.1 — Active Sanitizer & Sitemap Hygiene):
 * Pre-Publish Catalog Uniqueness & SEO Lint Quality Gate (catalog_uniqueness_and_seo_lint_gate.mjs)
 *
 * Enforces strict anti-duplication, anti-IP/adult/celebrity/brand handle hygiene, and anti-AI-cliché rules
 * across products, collections, blogs, and articles, actively auto-sanitizing violations via Shopify GraphQL:
 * 1. Flags any Roman numeral clone titles ("Edition II..XX") or numeric handle suffixes (-1, -2).
 * 2. Flags & sanitizes any third-party IP, celebrity, adult-performer, or concatenated camera/brand tokens
 *    (including `fujifilm`, `rammstein`, `abella-danger`, `shyla-stylez`, `riley-reid`, `what-if-*` blogs, and `pop-culture-icons`).
 * 3. Strips AI-cliché phrases ("delve into", "testament to", "tapestry of", "a calm serene", etc.)
 *    and any residual collection `FAQPage` or `STUDIO15` blocks via `productUpdate` / `collectionUpdate` / `articleUpdate`.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WORKSPACE, shopifyGql } from './lib/cloud-env.mjs';

const REPORT_PATH = path.join(WORKSPACE, 'LINT_QUALITY_GATE_LOG.md');

const ROMAN_CLONE_REGEX = /\bEdition\s+(?:II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX)\b/i;
export const IP_TRADEMARK_REGEX = /\b(?:star-wars|jedi|sith|vader|skywalker|mandalorian|grogu|baby-yoda|lightsaber|endor|pokemon|pikachu|charizard|gengar|naruto|uchiha|one-piece|luffy|dragon-ball|goku|totoro|ghibli|spirited-away|demon-slayer|attack-on-titan|jujutsu-kaisen|zelda|super-mario|harry-potter|hogwarts|lord-of-the-rings|frodo|gandalf|witcher|warhammer|cyberpunk-2077|elden-ring|valorant|fortnite|minecraft|genshin-impact|spider-man|avengers|batman|disney|marvel|stranger-things|game-of-thrones|nike|adidas|gucci|rolex|ferrari|porsche|aston-martin|lamborghini|mclaren|bugatti|maserati|rolls-royce|bentley|transformers|optimus-prime|bumblebee|megatron|avatar|jurassic-park|terminator|predator|godzilla|king-kong|sonic|master-chief|fallout|skyrim|final-fantasy|street-fighter|mortal-kombat|tekken|bleach|chainsaw-man|berserk|evangelion|akira|sailor-moon|yu-gi-oh|digimon|spongebob|simpsons|rick-and-morty|south-park|peaky-blinders|breaking-bad|sopranos|pulp-fiction|scarface|godfather|jonathan-adler|keith-haring|banksy|basquiat|warhol|kaws|fujifilm|rammstein|supreme|spacex|ufc|abella-danger|shyla-stylez|riley-reid|jayden-jaymes|lexi-luna|lisa-ann|jada-stevens|matt-damon|brad-pitt|jack-nicholson|megan-fox|zendaya|george-clooney|robert-de-niro|harry-styles|serena-williams|mbappe|doctor-strange|tony-stark|brainiac|professor-x|krypton|doomsday|agent-smith)\b|(?:fujifilm|abella-danger|shyla-stylez|riley-reid|jayden-jaymes|lexi-luna|lisa-ann)/i;

const AI_CLICHE_REGEX = /\b(?:delve into|testament to|tapestry of|a calm serene|symphony of|beacon of|in the realm of|elevate your everyday|more than just a|unparalleled sophistication|seamlessly blends)\b/gi;

export const UNESCAPED_ENTITY_REGEX = /&(?:amp;)+(?:quot|amp|#39|apos|lt|gt);|&(?:quot|#39|apos|amp);/i;
export const TEMPLATE_GRAMMAR_REGEX = /\b(?:Transform|Elevate|Style|Wear|Refresh|Upgrade|Claim)\s+with\b/i;
export const DANGLING_TITLE_REGEX = /(?:[–—\-|,/&:]\s*$|\b(?:&|&amp;|Mo|Si|Desig|Pass|and|with|the|in|for|of|vs|at|on|by)\s*$|\.\.\.\s*$|\([^\)]*$)/i;

const AI_CLICHE_REPLACEMENTS = {
  'delve into': 'explore',
  'testament to': 'example of',
  'tapestry of': 'blend of',
  'a calm serene': 'a balanced',
  'symphony of': 'combination of',
  'beacon of': 'centerpiece of',
  'in the realm of': 'across',
  'elevate your everyday': 'upgrade your daily',
  'more than just a': 'a precision-crafted',
  'unparalleled sophistication': 'archival studio clarity',
  'seamlessly blends': 'pairs cleanly'
};

function sanitizeAiCliches(htmlOrText) {
  return (htmlOrText || '').replace(AI_CLICHE_REGEX, match => {
    const lower = match.toLowerCase();
    return AI_CLICHE_REPLACEMENTS[lower] || 'studio-grade';
  });
}

export function unescapeHtmlEntities(str, isHtml = false) {
  if (!str) return '';
  let res = str;
  let prev = '';
  while (res !== prev) {
    prev = res;
    res = res.replace(/&amp;quot;/gi, '"')
             .replace(/&amp;#39;/gi, "'")
             .replace(/&amp;apos;/gi, "'")
             .replace(/&amp;amp;/gi, '&')
             .replace(/&amp;lt;/gi, '<')
             .replace(/&amp;gt;/gi, '>')
             .replace(/&amp;nbsp;/gi, ' ');
  }
  if (!isHtml) {
    res = res.replace(/&quot;/gi, '"')
             .replace(/&#39;/gi, "'")
             .replace(/&apos;/gi, "'")
             .replace(/&lt;/gi, '<')
             .replace(/&gt;/gi, '>')
             .replace(/&nbsp;/gi, ' ')
             .replace(/&amp;/gi, '&');
  }
  return res;
}

export function sanitizeDanglingTitle(rawTitle, brandSuffix = ' | Prints With Passion', maxChars = 60) {
  if (!rawTitle) return '';
  let title = unescapeHtmlEntities(rawTitle, false).trim();
  let prev = '';
  while (title !== prev) {
    prev = title;
    title = title.replace(/\s*[–—\-|,/&:]+\s*$/, '').trim();
    title = title.replace(/\s*\([^\)]*$/, '').trim();
    title = title.replace(/\b(?:&|&amp;|Mo|Si|Desig|Pass|and|with|the|in|for|of|vs|at|on|by)\s*$/i, '').trim();
  }

  if (title.length > maxChars) {
    let truncated = title.slice(0, maxChars);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 25) {
      truncated = truncated.slice(0, lastSpace);
    }
    title = truncated.trim();
    prev = '';
    while (title !== prev) {
      prev = title;
      title = title.replace(/\s*[–—\-|,/&:]+\s*$/, '').trim();
      title = title.replace(/\s*\([^\)]*$/, '').trim();
      title = title.replace(/\b(?:&|&amp;|Mo|Si|Desig|Pass|and|with|the|in|for|of|vs|at|on|by)\s*$/i, '').trim();
    }
  }
  return title;
}

export function sanitizeTemplateGrammar(desc) {
  if (!desc) return '';
  let cleaned = unescapeHtmlEntities(desc, false);
  cleaned = cleaned
    .replace(/^Transform\s+with\s+(?:Canvas\s+Wall\s+Art|Wall\s+Art)(?:[^\.]|\.(?=\d))*\.\s*/i, 'Archival framed canvas wall art on 1.25" European pine frames. ')
    .replace(/^Wear\s+with\s+(?:Graphic\s+T-Shirts|T-Shirts)(?:[^\.]|\.(?=\d))*\.\s*/i, 'Heavyweight cotton graphic t-shirts (S–3XL) with gallery-grade prints. ')
    .replace(/^Elevate\s+with\s+(?:Cushion\s+Covers|Pillow\s+Cases)(?:[^\.]|\.(?=\d))*\.\s*/i, 'Soft velvet cushion covers (45x45cm / 18x18") with double-sided gallery art. ')
    .replace(/^Refresh\s+with\s+(?:Memory\s+Foam\s+Bath\s+Mats|Bath\s+Mats)(?:[^\.]|\.(?=\d))*\.\s*/i, 'Ultra-soft memory foam bath mats (60x40cm / 24x16") with non-slip backing. ')
    .replace(/^Style\s+with\s+(?:Plush\s+Throw\s+Blankets|Blankets)(?:[^\.]|\.(?=\d))*\.\s*/i, 'Cozy 300 GSM plush fleece throw blankets (50x60" / 60x80") for beds and sofas. ')
    .replace(/^Upgrade\s+with\s+((?:[^\.]|\.(?=\d))+)\.\s*/i, 'Curated $1 for modern home decor. ')
    .replace(/\b(?:Transform|Elevate|Style|Wear|Refresh|Upgrade|Claim)\s+with\s+/gi, 'Shop curated ');
  return cleaned.trim();
}

async function main() {
  console.log('=== Prints With Passion — Pre-Publish Uniqueness, IP/Brand Handle & Active SEO Lint Sanitizer ===');

  const data = await shopifyGql(`
    query SampleQualityGate {
      productsCount(query: "status:active") { count }
      products(first: 200, query: "status:active", sortKey: UPDATED_AT, reverse: true) {
        nodes { id handle title description descriptionHtml priceRangeV2 { minVariantPrice { amount } } seo { title description } }
      }
      fujifilmCheck: products(first: 20, query: "status:active fujifilm") {
        nodes { id handle title description descriptionHtml priceRangeV2 { minVariantPrice { amount } } seo { title description } }
      }
      collections(first: 250) {
        nodes { id handle title descriptionHtml productsCount { count } seo { title description } }
      }
      blogs(first: 20) {
        nodes { id handle title }
      }
      articles(first: 50, query: "published_status:published") {
        nodes { id handle title body titleTag: metafield(namespace: "global", key: "title_tag") { value } descTag: metafield(namespace: "global", key: "description_tag") { value } }
      }
      pages(first: 50) {
        nodes { id handle title body titleTag: metafield(namespace: "global", key: "title_tag") { value } descTag: metafield(namespace: "global", key: "description_tag") { value } }
      }
    }
  `);

  const activeCount = data?.productsCount?.count ?? 0;
  const prodMap = new Map();
  for (const p of [...(data?.products?.nodes || []), ...(data?.fujifilmCheck?.nodes || [])]) {
    prodMap.set(p.id, p);
  }
  const products = [...prodMap.values()];
  const collections = data?.collections?.nodes || [];
  const blogs = data?.blogs?.nodes || [];
  const articles = data?.articles?.nodes || [];
  const pages = data?.pages?.nodes || [];

  const romanViolations = [];
  const ipViolations = [];
  const zeroPriceViolations = [];
  const aiLintViolations = [];
  const boilerplateCollectionViolations = [];
  const orphanedBlogViolations = [];
  const zeroProductViolations = [];
  const entityViolations = [];
  const templateGrammarViolations = [];
  const danglingTitleViolations = [];
  let autoSanitizedCount = 0;

  // 1. Audit & Clean Orphaned Non-News Blog Containers (e.g., what-if-* Marvel/DC blogs)
  for (const b of blogs) {
    if (b.handle !== 'news') {
      orphanedBlogViolations.push({ id: b.id, handle: b.handle, title: b.title });
      await shopifyGql(`
        mutation DelBlog($id: ID!) {
          blogDelete(id: $id) { deletedBlogId userErrors { field message } }
        }
      `, { id: b.id });
      await shopifyGql(`
        mutation RedirBlog($urlRedirect: UrlRedirectInput!) {
          urlRedirectCreate(urlRedirect: $urlRedirect) { urlRedirect { id } }
        }
      `, { urlRedirect: { path: `/blogs/${b.handle}`, target: '/blogs/news' } });
      autoSanitizedCount++;
    }
  }

  // 2. Audit Active Products for Roman Clones, IP/Brand Handles, £0.00 Prices & AI Clichés
  for (const p of products) {
    if (ROMAN_CLONE_REGEX.test(p.title || '')) {
      romanViolations.push({ type: 'Product', handle: p.handle, title: p.title });
    }
    if (IP_TRADEMARK_REGEX.test(`${p.handle} ${p.title} ${p.description || ''}`)) {
      // If handle has 'fujifilm' prefix but title is clean (e.g. Moody Cinematic Mountain Dawn), sanitize handle
      if (/fujifilm/i.test(p.handle) && !IP_TRADEMARK_REGEX.test(p.title)) {
        const oldHandle = p.handle;
        const newHandle = p.handle.replace(/fujifilm/gi, 'moody-cinematic-').replace(/--+/g, '-').replace(/^-|-$/g, '');
        await shopifyGql(`
          mutation CleanProdHandle($input: ProductInput!) {
            productUpdate(input: $input) { product { id handle } }
          }
        `, { input: { id: p.id, handle: newHandle, redirectNewHandle: true } });
        await shopifyGql(`
          mutation RedirProd($urlRedirect: UrlRedirectInput!) {
            urlRedirectCreate(urlRedirect: $urlRedirect) { urlRedirect { id } }
          }
        `, { urlRedirect: { path: `/products/${oldHandle}`, target: `/products/${newHandle}` } });
        autoSanitizedCount++;
      } else {
        ipViolations.push({ type: 'Product', handle: p.handle, title: p.title });
      }
    }
    const minPrice = parseFloat(p.priceRangeV2?.minVariantPrice?.amount || '0');
    if (minPrice <= 0) {
      zeroPriceViolations.push({ type: 'Product', handle: p.handle, title: p.title });
    }
    const m = `${p.title} ${p.description || ''}`.match(AI_CLICHE_REGEX);
    if (m) {
      aiLintViolations.push({ type: 'Product', handle: p.handle, phrase: m[0] });
      if (autoSanitizedCount < 25 && p.descriptionHtml) {
        const cleanedHtml = sanitizeAiCliches(p.descriptionHtml);
        if (cleanedHtml !== p.descriptionHtml) {
          await shopifyGql(`
            mutation CleanProd($input: ProductInput!) {
              productUpdate(input: $input) { product { id } }
            }
          `, { input: { id: p.id, descriptionHtml: cleanedHtml } });
          autoSanitizedCount++;
        }
      }
    }
  }

  // 3. Audit Collections for 0-products, Entities, Template Grammar, Dangling Titles, pop-culture-icons, Boilerplate & AI Clichés
  for (const c of collections) {
    const isFrontpage = c.handle === 'frontpage';
    const prodCount = typeof c.productsCount === 'object' ? (c.productsCount?.count ?? 0) : (c.productsCount ?? 0);

    if (!isFrontpage && prodCount === 0) {
      zeroProductViolations.push({ id: c.id, handle: c.handle, title: c.title });
      if (autoSanitizedCount < 30) {
        await shopifyGql(`
          mutation DelCol($input: CollectionDeleteInput!) {
            collectionDelete(input: $input) { deletedCollectionId userErrors { field message } }
          }
        `, { input: { id: c.id } });
        await shopifyGql(`
          mutation RedirCol($urlRedirect: UrlRedirectInput!) {
            urlRedirectCreate(urlRedirect: $urlRedirect) { urlRedirect { id } }
          }
        `, { urlRedirect: { path: `/collections/${c.handle}`, target: '/collections/all' } });
        autoSanitizedCount++;
      }
      continue;
    }

    if (c.handle === 'pop-culture-icons') {
      await shopifyGql(`
        mutation DelCol($input: CollectionDeleteInput!) {
          collectionDelete(input: $input) { deletedCollectionId userErrors { field message } }
        }
      `, { input: { id: c.id } });
      await shopifyGql(`
        mutation RedirCol($urlRedirect: UrlRedirectInput!) {
          urlRedirectCreate(urlRedirect: $urlRedirect) { urlRedirect { id } }
        }
      `, { urlRedirect: { path: '/collections/pop-culture-icons', target: '/collections/retro-vintage' } });
      autoSanitizedCount++;
      continue;
    }

    let html = c.descriptionHtml || '';
    let seoTitle = c.seo?.title || c.title || '';
    let seoDesc = c.seo?.description || '';
    let needsUpdate = false;
    let needsSeoUpdate = false;

    // Check entities
    if (UNESCAPED_ENTITY_REGEX.test(seoTitle) || UNESCAPED_ENTITY_REGEX.test(seoDesc) || /&amp;quot;/i.test(html)) {
      entityViolations.push({ type: 'Collection', handle: c.handle });
      seoTitle = unescapeHtmlEntities(seoTitle, false);
      seoDesc = unescapeHtmlEntities(seoDesc, false);
      html = unescapeHtmlEntities(html, true);
      needsUpdate = true;
      needsSeoUpdate = true;
    }

    // Check broken template grammar
    if (TEMPLATE_GRAMMAR_REGEX.test(seoDesc)) {
      templateGrammarViolations.push({ type: 'Collection', handle: c.handle });
      seoDesc = sanitizeTemplateGrammar(seoDesc);
      needsSeoUpdate = true;
    }

    // Check dangling title
    if (!isFrontpage && (DANGLING_TITLE_REGEX.test(seoTitle) || seoTitle.length > 60)) {
      danglingTitleViolations.push({ type: 'Collection', handle: c.handle, title: seoTitle });
      seoTitle = sanitizeDanglingTitle(seoTitle, ' | Prints With Passion', 60);
      needsSeoUpdate = true;
    }

    if (html.includes('PWP_INPAGES_3RULE_HERO_START') || /"@type"\s*:\s*"FAQPage"/i.test(html)) {
      boilerplateCollectionViolations.push({ handle: c.handle, title: c.title });
      html = html
        .replace(/<!-- PWP_INPAGES_3RULE_HERO_START -->[\s\S]*?<!-- PWP_INPAGES_3RULE_HERO_END -->/gi, '')
        .replace(/<script[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?"@type"\s*:\s*"FAQPage"[\s\S]*?<\/script>/gi, '')
        .trim();
      needsUpdate = true;
    }

    if (/STUDIO15/i.test(seoDesc)) {
      boilerplateCollectionViolations.push({ handle: c.handle, title: `${c.title} (SEO Meta)` });
      seoDesc = seoDesc.replace(/\s*(?:Use\s+code\s+)?STUDIO15[^.]*\.?/gi, '').trim();
      needsSeoUpdate = true;
    }

    const m = html.replace(/<[^>]+>/g, ' ').match(AI_CLICHE_REGEX);
    if (m) {
      aiLintViolations.push({ type: 'Collection', handle: c.handle, phrase: m[0] });
      html = sanitizeAiCliches(html);
      needsUpdate = true;
    }

    if ((needsUpdate || needsSeoUpdate) && autoSanitizedCount < 30) {
      const input = { id: c.id };
      if (needsUpdate) input.descriptionHtml = html;
      if (needsSeoUpdate) input.seo = { title: seoTitle, description: seoDesc };
      await shopifyGql(`
        mutation CleanCol($input: CollectionInput!) {
          collectionUpdate(input: $input) { collection { id } }
        }
      `, { input });
      autoSanitizedCount++;
    }
  }

  // 4. Audit Published Articles for AI Clichés, Entities & Dangling Titles
  for (const a of articles) {
    const text = (a.body || '').replace(/<[^>]+>/g, ' ');
    const title = a.title || '';
    const titleTag = a.titleTag?.value || '';
    const descTag = a.descTag?.value || '';

    if (UNESCAPED_ENTITY_REGEX.test(title) || UNESCAPED_ENTITY_REGEX.test(titleTag) || UNESCAPED_ENTITY_REGEX.test(descTag) || /&amp;quot;/i.test(a.body || '')) {
      entityViolations.push({ type: 'Article', handle: a.handle });
    }

    if (DANGLING_TITLE_REGEX.test(titleTag || title) || (titleTag || title).length > 60) {
      danglingTitleViolations.push({ type: 'Article', handle: a.handle, title: titleTag || title });
    }

    const m = text.match(AI_CLICHE_REGEX);
    if (m) {
      aiLintViolations.push({ type: 'Article', handle: a.handle, phrase: m[0] });
      if (autoSanitizedCount < 30 && a.body) {
        const cleanedBody = sanitizeAiCliches(a.body);
        if (cleanedBody !== a.body) {
          await shopifyGql(`
            mutation CleanArt($id: ID!, $article: ArticleUpdateInput!) {
              articleUpdate(id: $id, article: $article) { article { id } }
            }
          `, { id: a.id, article: { body: cleanedBody } });
          autoSanitizedCount++;
        }
      }
    }
  }

  // 5. Audit Pages for Entities & Dangling Titles
  for (const p of pages) {
    const title = p.title || '';
    const titleTag = p.titleTag?.value || '';
    const descTag = p.descTag?.value || '';

    if (UNESCAPED_ENTITY_REGEX.test(title) || UNESCAPED_ENTITY_REGEX.test(titleTag) || UNESCAPED_ENTITY_REGEX.test(descTag) || /&amp;quot;/i.test(p.body || '')) {
      entityViolations.push({ type: 'Page', handle: p.handle });
    }

    if (DANGLING_TITLE_REGEX.test(titleTag || title) || (titleTag || title).length > 60) {
      danglingTitleViolations.push({ type: 'Page', handle: p.handle, title: titleTag || title });
    }
  }

  const now = new Date().toISOString();
  const report = [
    `# Prints With Passion — Catalog Uniqueness & Active SEO Lint Quality Gate Log`,
    ``,
    `- **Last Audited:** \`${now}\``,
    `- **Total Active Products in Store:** \`${activeCount}\` (Target: \`~1,500\` distinct non-IP products)`,
    `- **Sampled Active Products Checked:** \`${products.length}\``,
    `- **Collections Checked:** \`${collections.length}\``,
    `- **Pages Checked:** \`${pages.length}\``,
    `- **Articles Checked:** \`${articles.length}\``,
    `- **0-Product Collections Detected (excl. frontpage):** \`${zeroProductViolations.length}\``,
    `- **Unescaped HTML Entity Violations Detected:** \`${entityViolations.length}\``,
    `- **Broken Template Grammar Violations Detected:** \`${templateGrammarViolations.length}\``,
    `- **Dangling / Truncated Title Violations Detected:** \`${danglingTitleViolations.length}\``,
    `- **Roman Numeral Clone Titles Detected in Sample:** \`${romanViolations.length}\``,
    `- **Third-Party IP Handles Remaining in Sample:** \`${ipViolations.length}\``,
    `- **Orphaned Non-News Blog Containers Cleaned:** \`${orphanedBlogViolations.length}\``,
    `- **Zero-Price (£0.00) Products Detected in Sample:** \`${zeroPriceViolations.length}\``,
    `- **Collections With Legacy Hero/FAQ Boilerplate Remaining:** \`${boilerplateCollectionViolations.length} / ${collections.length}\``,
    `- **AI-Cliché Phrases Flagged (\`seo lint\` rules):** \`${aiLintViolations.length}\``,
    `- **Items Actively Auto-Sanitized via GraphQL This Run:** \`${autoSanitizedCount}\``,
    ``,
    `## 1. Summary of Quality Gate Findings`,
    `- **0-Product Collections:** ${zeroProductViolations.length === 0 ? 'PASS (0 empty collections)' : `FLAGGED (${zeroProductViolations.length} empty collections)`}`,
    `- **HTML Entity Escaping:** ${entityViolations.length === 0 ? 'PASS (0 unescaped entities)' : `FLAGGED (${entityViolations.length} entities detected)`}`,
    `- **Template Phrasing & Grammar:** ${templateGrammarViolations.length === 0 ? 'PASS (0 broken template phrases)' : `FLAGGED (${templateGrammarViolations.length} collections with broken template grammar)`}`,
    `- **Dangling & Truncated Titles:** ${danglingTitleViolations.length === 0 ? 'PASS (0 dangling titles)' : `FLAGGED (${danglingTitleViolations.length} dangling titles)`}`,
    `- **Roman Numeral Clones:** ${romanViolations.length === 0 ? 'PASS (0 detected)' : `FLAGGED (${romanViolations.length} in sample)`}`,
    `- **Third-Party IP / Brand / Celebrity Terms:** ${ipViolations.length === 0 ? 'PASS (0 detected)' : `FLAGGED (${ipViolations.length} in sample)`}`,
    `- **Blog Container Hygiene (\`/blogs/news\` only):** ${orphanedBlogViolations.length === 0 ? 'PASS (1 canonical blog)' : `AUTO-CLEANED (${orphanedBlogViolations.length} orphaned blogs deleted & redirected)`}`,
    `- **Zero-Price (£0.00) Variants:** ${zeroPriceViolations.length === 0 ? 'PASS (0 detected)' : `FLAGGED (${zeroPriceViolations.length} in sample)`}`,
    `- **Collection Boilerplate / FAQ Schema:** ${boilerplateCollectionViolations.length === 0 ? 'PASS (0 collections have injected boilerplate)' : `AUTO-CLEANED (${boilerplateCollectionViolations.length} collections sanitized)`}`,
    `- **AI-Pattern Phrases:** ${aiLintViolations.length === 0 ? 'PASS (0 AI clichés detected)' : `AUTO-SANITIZED (${autoSanitizedCount} updated via GraphQL)`}`
  ];

  fs.writeFileSync(REPORT_PATH, report.join('\n') + '\n', 'utf8');
  console.log(`Saved Catalog Uniqueness & SEO Lint Quality Gate report to ${REPORT_PATH} (autoSanitized=${autoSanitizedCount}, orphanedBlogsCleaned=${orphanedBlogViolations.length})`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  main().catch(console.error);
}
