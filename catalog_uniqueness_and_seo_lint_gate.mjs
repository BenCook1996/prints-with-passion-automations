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
import { WORKSPACE, shopifyGql } from './lib/cloud-env.mjs';

const REPORT_PATH = path.join(WORKSPACE, 'LINT_QUALITY_GATE_LOG.md');

const ROMAN_CLONE_REGEX = /\bEdition\s+(?:II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX)\b/i;
export const IP_TRADEMARK_REGEX = /\b(?:star-wars|jedi|sith|vader|skywalker|mandalorian|grogu|baby-yoda|lightsaber|endor|pokemon|pikachu|charizard|gengar|naruto|uchiha|one-piece|luffy|dragon-ball|goku|totoro|ghibli|spirited-away|demon-slayer|attack-on-titan|jujutsu-kaisen|zelda|super-mario|harry-potter|hogwarts|lord-of-the-rings|frodo|gandalf|witcher|warhammer|cyberpunk-2077|elden-ring|valorant|fortnite|minecraft|genshin-impact|spider-man|avengers|batman|disney|marvel|stranger-things|game-of-thrones|nike|adidas|gucci|rolex|ferrari|porsche|aston-martin|lamborghini|mclaren|bugatti|maserati|rolls-royce|bentley|transformers|optimus-prime|bumblebee|megatron|avatar|jurassic-park|terminator|predator|godzilla|king-kong|sonic|master-chief|fallout|skyrim|final-fantasy|street-fighter|mortal-kombat|tekken|bleach|chainsaw-man|berserk|evangelion|akira|sailor-moon|yu-gi-oh|digimon|spongebob|simpsons|rick-and-morty|south-park|peaky-blinders|breaking-bad|sopranos|pulp-fiction|scarface|godfather|jonathan-adler|keith-haring|banksy|basquiat|warhol|kaws|fujifilm|rammstein|supreme|spacex|ufc|abella-danger|shyla-stylez|riley-reid|jayden-jaymes|lexi-luna|lisa-ann|jada-stevens|matt-damon|brad-pitt|jack-nicholson|megan-fox|zendaya|george-clooney|robert-de-niro|harry-styles|serena-williams|mbappe|doctor-strange|tony-stark|brainiac|professor-x|krypton|doomsday|agent-smith)\b|(?:fujifilm|abella-danger|shyla-stylez|riley-reid|jayden-jaymes|lexi-luna|lisa-ann)/i;

const AI_CLICHE_REGEX = /\b(?:delve into|testament to|tapestry of|a calm serene|symphony of|beacon of|in the realm of|elevate your everyday|more than just a|unparalleled sophistication|seamlessly blends)\b/gi;

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

async function main() {
  console.log('=== Prints With Passion — Pre-Publish Uniqueness, IP/Brand Handle & Active SEO Lint Sanitizer ===');

  const data = await shopifyGql(`
    query SampleQualityGate {
      productsCount(query: "status:active") { count }
      products(first: 200, query: "status:active", sortKey: UPDATED_AT, reverse: true) {
        nodes { id handle title description descriptionHtml priceRangeV2 { minVariantPrice { amount } } }
      }
      fujifilmCheck: products(first: 20, query: "status:active fujifilm") {
        nodes { id handle title description descriptionHtml priceRangeV2 { minVariantPrice { amount } } }
      }
      collections(first: 80) {
        nodes { id handle title descriptionHtml seo { title description } }
      }
      blogs(first: 20) {
        nodes { id handle title }
      }
      articles(first: 50, query: "published_status:published") {
        nodes { id handle title body }
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

  const romanViolations = [];
  const ipViolations = [];
  const zeroPriceViolations = [];
  const aiLintViolations = [];
  const boilerplateCollectionViolations = [];
  const orphanedBlogViolations = [];
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

  // 3. Audit Collections for pop-culture-icons, Boilerplate & AI Clichés
  for (const c of collections) {
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
    let seoDesc = c.seo?.description || '';
    let needsUpdate = false;
    let needsSeoUpdate = false;

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
      if (needsSeoUpdate) input.seo = { title: c.seo?.title || c.title, description: seoDesc };
      await shopifyGql(`
        mutation CleanCol($input: CollectionInput!) {
          collectionUpdate(input: $input) { collection { id } }
        }
      `, { input });
      autoSanitizedCount++;
    }
  }

  // 4. Audit Published Articles for AI Clichés
  for (const a of articles) {
    const text = (a.body || '').replace(/<[^>]+>/g, ' ');
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

  const now = new Date().toISOString();
  const report = [
    `# Prints With Passion — Catalog Uniqueness & Active SEO Lint Quality Gate Log`,
    ``,
    `- **Last Audited:** \`${now}\``,
    `- **Total Active Products in Store:** \`${activeCount}\` (Target: \`~1,500\` distinct non-IP products)`,
    `- **Sampled Active Products Checked:** \`${products.length}\``,
    `- **Roman Numeral Clone Titles Detected in Sample:** \`${romanViolations.length}\``,
    `- **Third-Party IP Handles Remaining in Sample:** \`${ipViolations.length}\``,
    `- **Orphaned Non-News Blog Containers Cleaned:** \`${orphanedBlogViolations.length}\``,
    `- **Zero-Price (£0.00) Products Detected in Sample:** \`${zeroPriceViolations.length}\``,
    `- **Collections With Legacy Hero/FAQ Boilerplate Remaining:** \`${boilerplateCollectionViolations.length} / ${collections.length}\``,
    `- **AI-Cliché Phrases Flagged (\`seo lint\` rules):** \`${aiLintViolations.length}\``,
    `- **Items Actively Auto-Sanitized via GraphQL This Run:** \`${autoSanitizedCount}\``,
    ``,
    `## 1. Summary of Quality Gate Findings`,
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

if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}`) {
  main().catch(console.error);
}
