/**
 * Prototype for Upgraded catalog_uniqueness_and_seo_lint_gate.mjs
 * Testing new audit & sanitization functions:
 * 1. Double-escaped HTML entities
 * 2. Broken template grammar fragments
 * 3. Dangling truncated titles
 * 4. 0-product collections
 */
import fs from 'fs';
import path from 'path';
import { WORKSPACE, shopifyGql } from '../../../lib/cloud-env.mjs';

// Regexes
export const ROMAN_CLONE_REGEX = /\bEdition\s+(?:II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX)\b/i;
export const IP_TRADEMARK_REGEX = /\b(?:star-wars|jedi|sith|vader|skywalker|mandalorian|grogu|baby-yoda|lightsaber|endor|pokemon|pikachu|charizard|gengar|naruto|uchiha|one-piece|luffy|dragon-ball|goku|totoro|ghibli|spirited-away|demon-slayer|attack-on-titan|jujutsu-kaisen|zelda|super-mario|harry-potter|hogwarts|lord-of-the-rings|frodo|gandalf|witcher|warhammer|cyberpunk-2077|elden-ring|valorant|fortnite|minecraft|genshin-impact|spider-man|avengers|batman|disney|marvel|stranger-things|game-of-thrones|nike|adidas|gucci|rolex|ferrari|porsche|aston-martin|lamborghini|mclaren|bugatti|maserati|rolls-royce|bentley|transformers|optimus-prime|bumblebee|megatron|avatar|jurassic-park|terminator|predator|godzilla|king-kong|sonic|master-chief|fallout|skyrim|final-fantasy|street-fighter|mortal-kombat|tekken|bleach|chainsaw-man|berserk|evangelion|akira|sailor-moon|yu-gi-oh|digimon|spongebob|simpsons|rick-and-morty|south-park|peaky-blinders|breaking-bad|sopranos|pulp-fiction|scarface|godfather|jonathan-adler|keith-haring|banksy|basquiat|warhol|kaws|fujifilm|rammstein|supreme|spacex|ufc|abella-danger|shyla-stylez|riley-reid|jayden-jaymes|lexi-luna|lisa-ann|jada-stevens|matt-damon|brad-pitt|jack-nicholson|megan-fox|zendaya|george-clooney|robert-de-niro|harry-styles|serena-williams|mbappe|doctor-strange|tony-stark|brainiac|professor-x|krypton|doomsday|agent-smith)\b|(?:fujifilm|abella-danger|shyla-stylez|riley-reid|jayden-jaymes|lexi-luna|lisa-ann)/i;
export const AI_CLICHE_REGEX = /\b(?:delve into|testament to|tapestry of|a calm serene|symphony of|beacon of|in the realm of|elevate your everyday|more than just a|unparalleled sophistication|seamlessly blends)\b/gi;

// NEW REGEXES
export const UNESCAPED_ENTITY_REGEX = /&(?:amp;)+(?:quot|amp|#39|apos|lt|gt);|&(?:quot|#39|apos);/i;
export const TEMPLATE_GRAMMAR_REGEX = /\b(?:Transform|Elevate|Style|Wear|Refresh|Upgrade|Claim)\s+with\b/i;
export const DANGLING_TITLE_REGEX = /(?:[–—\-|,/&:]\s*$|\b(?:&|&amp;|Mo|Si|Desig|Pass|and|with|the|in|for|of|vs|at|on|by)\s*$|\.\.\.\s*$|\([^\)]*$)/i;

export function unescapeHtmlEntities(str, isHtml = false) {
  if (!str) return '';
  let res = str;
  // Double-escaped first
  res = res.replace(/&amp;quot;/gi, '"')
           .replace(/&amp;#39;/gi, "'")
           .replace(/&amp;apos;/gi, "'")
           .replace(/&amp;amp;/gi, '&')
           .replace(/&amp;lt;/gi, '<')
           .replace(/&amp;gt;/gi, '>')
           .replace(/&amp;nbsp;/gi, ' ');
  if (!isHtml) {
    res = res.replace(/&quot;/gi, '"')
             .replace(/&#39;/gi, "'")
             .replace(/&apos;/gi, "'")
             .replace(/&amp;/gi, '&')
             .replace(/&lt;/gi, '<')
             .replace(/&gt;/gi, '>')
             .replace(/&nbsp;/gi, ' ');
  }
  return res;
}

export function sanitizeDanglingTitle(rawTitle, brandSuffix = ' | Prints With Passion', maxChars = 60) {
  if (!rawTitle) return '';
  let title = rawTitle.trim();
  title = title.replace(/\s*[–—\-|,/&:]+\s*$/, '').trim();
  title = title.replace(/\s*\([^\)]*$/, '').trim();
  title = title.replace(/\b(?:&|&amp;|Mo|Si|Desig|Pass|and|with|the|in|for|of|vs|at|on|by)\s*$/i, '').trim();
  title = title.replace(/\s*[–—\-|,/&:]+\s*$/, '').trim();

  if (title.length > maxChars) {
    let truncated = title.slice(0, maxChars);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 25) {
      truncated = truncated.slice(0, lastSpace);
    }
    title = truncated.trim().replace(/[–—\-|,/&:]+$/, '').trim();
    title = title.replace(/\b(?:&|&amp;|Mo|Si|Desig|Pass|and|with|the|in|for|of|vs|at|on|by)\s*$/i, '').trim();
    title = title.replace(/\s*[–—\-|,/&:]+\s*$/, '').trim();
  }
  return title;
}

export function sanitizeTemplateGrammar(desc) {
  if (!desc) return '';
  let cleaned = desc;
  cleaned = cleaned
    .replace(/^Transform\s+with\s+(?:Canvas\s+Wall\s+Art|Wall\s+Art)\s*\([^\)]+\)\.\s*/i, 'Archival framed canvas wall art on 1.25" European pine frames. ')
    .replace(/^Wear\s+with\s+(?:Graphic\s+T-Shirts|T-Shirts)\s*\([^\)]+\)\.\s*/i, 'Heavyweight cotton graphic t-shirts (S–3XL) with gallery-grade prints. ')
    .replace(/^Elevate\s+with\s+(?:Cushion\s+Covers|Pillow\s+Cases)\s*\([^\)]+\)\.\s*/i, 'Soft velvet cushion covers (45x45cm / 18x18") with double-sided gallery art. ')
    .replace(/^Refresh\s+with\s+(?:Memory\s+Foam\s+Bath\s+Mats|Bath\s+Mats)\s*\([^\)]+\)\.\s*/i, 'Ultra-soft memory foam bath mats (60x40cm / 24x16") with non-slip backing. ')
    .replace(/^Style\s+with\s+(?:Plush\s+Throw\s+Blankets|Blankets)\s*\([^\)]+\)\.\s*/i, 'Cozy 300 GSM plush fleece throw blankets (50x60" / 60x80") for beds and sofas. ')
    .replace(/^Upgrade\s+with\s+([^\.]+)\.\s*/i, 'Curated $1 for modern home decor. ')
    .replace(/\b(?:Transform|Elevate|Style|Wear|Refresh|Upgrade|Claim)\s+with\s+/gi, 'Shop curated ');
  return cleaned.trim();
}

async function auditOnly() {
  console.log('=== Pre-Publish Uniqueness, SEO Lint & Hygiene Quality Gate (Audit Test) ===');

  const data = await shopifyGql(`
    query SampleQualityGateStorewide {
      productsCount(query: "status:active") { count }
      products(first: 200, query: "status:active", sortKey: UPDATED_AT, reverse: true) {
        nodes {
          id
          handle
          title
          descriptionHtml
          seo { title description }
        }
      }
      collections(first: 250) {
        nodes {
          id
          handle
          title
          descriptionHtml
          productsCount { count }
          seo { title description }
        }
      }
      blogs(first: 20) {
        nodes { id handle title }
      }
      articles(first: 50, query: "published_status:published") {
        nodes {
          id
          handle
          title
          body
          titleTag: metafield(namespace: "global", key: "title_tag") { value }
          descTag: metafield(namespace: "global", key: "description_tag") { value }
        }
      }
      pages(first: 50) {
        nodes {
          id
          handle
          title
          body
          titleTag: metafield(namespace: "global", key: "title_tag") { value }
          descTag: metafield(namespace: "global", key: "description_tag") { value }
        }
      }
    }
  `);

  const products = data?.products?.nodes || [];
  const collections = data?.collections?.nodes || [];
  const blogs = data?.blogs?.nodes || [];
  const articles = data?.articles?.nodes || [];
  const pages = data?.pages?.nodes || [];

  // 1. Entities
  const entityViolations = [];
  for (const c of collections) {
    const text = `${c.title} ${c.seo?.title || ''} ${c.seo?.description || ''} ${c.descriptionHtml || ''}`;
    if (UNESCAPED_ENTITY_REGEX.test(text)) {
      entityViolations.push({ type: 'Collection', handle: c.handle });
    }
  }
  for (const p of products) {
    const text = `${p.title} ${p.seo?.title || ''} ${p.seo?.description || ''} ${p.descriptionHtml || ''}`;
    if (UNESCAPED_ENTITY_REGEX.test(text)) {
      entityViolations.push({ type: 'Product', handle: p.handle });
    }
  }
  for (const a of articles) {
    const text = `${a.title} ${a.titleTag?.value || ''} ${a.descTag?.value || ''} ${a.body || ''}`;
    if (UNESCAPED_ENTITY_REGEX.test(text)) {
      entityViolations.push({ type: 'Article', handle: a.handle });
    }
  }

  // 2. Broken Template Grammar
  const templateGrammarViolations = [];
  for (const c of collections) {
    const text = `${c.seo?.description || ''} ${c.descriptionHtml || ''}`;
    if (TEMPLATE_GRAMMAR_REGEX.test(text)) {
      templateGrammarViolations.push({ type: 'Collection', handle: c.handle, desc: c.seo?.description });
    }
  }

  // 3. Dangling Titles
  const danglingTitleViolations = [];
  for (const c of collections) {
    const title = c.seo?.title || c.title || '';
    if (DANGLING_TITLE_REGEX.test(title) || title.length > 60) {
      danglingTitleViolations.push({ type: 'Collection', handle: c.handle, title, len: title.length });
    }
  }
  for (const a of articles) {
    const title = a.titleTag?.value || a.title || '';
    if (DANGLING_TITLE_REGEX.test(title) || title.length > 60) {
      danglingTitleViolations.push({ type: 'Article', handle: a.handle, title, len: title.length });
    }
  }

  // 4. 0-Product Collections
  const zeroProductCollections = [];
  for (const c of collections) {
    if (c.handle !== 'frontpage' && (c.productsCount?.count ?? 0) === 0) {
      zeroProductCollections.push({ handle: c.handle, id: c.id, title: c.title });
    }
  }

  console.log('--- AUDIT REPORT SUMMARY ---');
  console.log(`Double-escaped / unescaped entity violations: ${entityViolations.length}`, entityViolations);
  console.log(`Broken template grammar violations:         ${templateGrammarViolations.length}`);
  console.log(`Dangling / truncated title violations:        ${danglingTitleViolations.length}`);
  console.log(`0-product collections (excl. frontpage):     ${zeroProductCollections.length}`);
  console.log('-----------------------------');
}

auditOnly().catch(console.error);
