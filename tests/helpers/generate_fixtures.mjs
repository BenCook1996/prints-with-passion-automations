/**
 * Fixture Generator for Offline / Dry-Run Testing
 *
 * Populates realistic, spec-compliant fixture files in tests/fixtures/:
 * - collections_sample.json (70 active collections)
 * - redirects_sample.json (28 legacy 301 redirects)
 * - pages_sample.json (36 pages)
 * - articles_sample.json (25 blog articles)
 * - sitemaps_sample.xml (XML sitemap structure)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const FIXTURES_DIR = path.resolve(__dirname, '..', 'fixtures');

if (!fs.existsSync(FIXTURES_DIR)) {
  fs.mkdirSync(FIXTURES_DIR, { recursive: true });
}

function fitTitleUnder60(raw) {
  if (!raw || raw.length <= 60) return raw;
  const sub = raw.slice(0, 60);
  const lastSpace = sub.lastIndexOf(' ');
  return (lastSpace > 30 ? sub.slice(0, lastSpace) : sub).replace(/[\s\-|&(]+$/, '');
}

// 1. Load 48 smart sub-collections
const subcollectionsRaw = JSON.parse(
  fs.readFileSync(path.join(REPO_ROOT, 'phase2_40_subcollections.json'), 'utf8')
);

// 2. Define 6 parent collections
const parentCollections = [
  {
    handle: 'canvas-prints',
    title: 'Canvas Wall Art | Archival Framed Wall Art Studio',
    desc: 'Shop museum-grade framed canvas wall art stretched across 1.25-inch FSC pine bars. Vibrant archival pigment inks and free UK tracked delivery on all prints.'
  },
  {
    handle: 'desk-mats',
    title: 'XXL Gaming Desk Mats | 900x400 Stitched Mouse Pads',
    desc: 'Explore 4mm thick XXL extended gaming desk mats in 900x400mm dimensions. Precision micro-weave cloth, anti-slip rubber base and reinforced edge stitching.'
  },
  {
    handle: 'pillow-cases',
    title: 'Velvet Cushion Covers | Decorative Throw Pillow Cases',
    desc: 'Shop double-sided velvet cushion covers featuring vibrant archival studio artwork. Concealed zipper closure and machine washable fabric for modern homes.' // 153 chars
  },
  {
    handle: 'blankets',
    title: 'Plush Throw Blankets | Cozy Fleece Bed & Sofa Throws',
    desc: 'Wrap up with premium 300 GSM plush fleece throw blankets. Ultra-soft hypoallergenic microfiber with archival dye-sublimation print for cozy living rooms.'
  },
  {
    handle: 'bath-mats',
    title: 'Memory Foam Bath Mats | Quick-Dry Non-Slip Bath Rugs',
    desc: 'Step onto memory foam bath mats with quick-drying microfiber fleece and non-skid backing. Machine washable absorbent luxury for modern UK bathroom floors.'
  },
  {
    handle: 'apparel',
    title: 'Studio Graphic Apparel | Premium Heavyweight Streetwear',
    desc: 'Shop unisex heavyweight cotton graphic tees and fleece hoodies featuring curated archival artwork. Pre-shrunk ringspun fabric with free tracked UK delivery.' // 154 chars
  }
];

// 3. Define other active collections
const otherCollections = [
  {
    handle: 'frontpage',
    title: 'Prints With Passion Home Page Catalog',
    desc: 'Curated archival studio decor including framed canvas art, XXL stitched gaming desk mats, plush blankets, velvet cushion covers and quick-dry bath mats.',
    productsCount: 0
  },
  {
    handle: 'avada-upsell-best-sellers',
    title: 'Trending Studio Best Sellers | Prints With Passion',
    desc: 'Explore trending archival canvas wall art, extended desk mats, and cozy fleece throw blankets. Curated studio bestsellers with free tracked UK delivery.', // 152 chars
    productsCount: 15,
    isPublished: false
  },
  ...Array.from({ length: 14 }).map((_, i) => ({
    handle: `featured-curated-collection-${i + 1}`,
    title: `Featured Studio Art Prints & Decor Collection ${i + 1}`,
    desc: `Discover exclusive archival wall art prints, extended desk mats, and designer home accessories. Premium UK craftsmanship with free delivery on every order.`,
    productsCount: 8
  }))
];

// Assemble 70 collections
const collectionsList = [];

for (const p of parentCollections) {
  collectionsList.push({
    id: `gid://shopify/Collection/parent-${p.handle}`,
    handle: p.handle,
    title: p.title.split(' | ')[0],
    productsCount: { count: 35 },
    seo: { title: p.title, description: p.desc },
    resourcePublicationsV2: {
      edges: [{ node: { isPublished: true, publication: { name: 'Online Store' } } }]
    }
  });
}

for (const s of subcollectionsRaw) {
  let title = s.seoTitle || `${s.title.slice(0, 42)} | Studio Prints`;
  title = fitTitleUnder60(title);

  if (s.handle === 'japanese-anime-desk-mats') {
    title = 'Japanese Anime Desk Mats | 900x400 XXL Stitched Gaming Pads';
  } else if (s.handle === 'abstract-minimalist-bauhaus-canvas-wall-art') {
    title = 'Bauhaus & Minimalist Canvas Art | 1.25" Framed Wall Prints';
  }

  let desc = s.seoDescription ||
    `Discover curated ${s.productType.toLowerCase()} featuring ${s.themeTag.toLowerCase()} motifs. Archival UK studio printing with fast tracked delivery nationwide.`;

  desc = desc.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  if (desc.length < 140) {
    desc = desc.replace(/\.$/, '') + ' with free UK tracked delivery.';
  }
  if (desc.length > 158) {
    const sub = desc.slice(0, 155);
    const lastSpace = sub.lastIndexOf(' ');
    desc = (lastSpace > 120 ? sub.slice(0, lastSpace) : sub).replace(/[\s,]+$/, '') + '.';
  }
  while (desc.length < 140) {
    desc = desc.replace(/\.$/, '') + ' Shop today.';
  }

  collectionsList.push({
    id: s.id,
    handle: s.handle,
    title: s.title,
    productsCount: { count: 14 },
    seo: { title, description: desc },
    resourcePublicationsV2: {
      edges: [{ node: { isPublished: true, publication: { name: 'Online Store' } } }]
    }
  });
}

for (const o of otherCollections) {
  collectionsList.push({
    id: `gid://shopify/Collection/${o.handle}`,
    handle: o.handle,
    title: o.title.split(' | ')[0],
    productsCount: { count: o.productsCount ?? 10 },
    seo: { title: fitTitleUnder60(o.title), description: o.desc },
    resourcePublicationsV2: {
      edges: [{
        node: {
          isPublished: o.isPublished !== false,
          publication: { name: 'Online Store' }
        }
      }]
    }
  });
}

fs.writeFileSync(
  path.join(FIXTURES_DIR, 'collections_sample.json'),
  JSON.stringify(collectionsList, null, 2),
  'utf8'
);
console.log(`Generated collections_sample.json with ${collectionsList.length} collections.`);

// 4. Generate redirects_sample.json
const legacyRedirectMap = {
  '/collections/dog-collars': '/collections/apparel',
  '/collections/laundry-bags': '/collections/apparel',
  '/collections/duffle-bags': '/collections/apparel',
  '/collections/clutch-bags': '/collections/apparel',
  '/collections/phone-cases': '/collections/desk-mats',
  '/collections/beach-towels': '/collections/bath-mats',
  '/collections/mugs': '/collections/canvas-prints',
  '/collections/journals': '/collections/canvas-prints',
  '/collections/wall-tapestry': '/collections/canvas-prints',
  '/collections/puzzles': '/collections/canvas-prints',
  '/collections/shoes': '/collections/apparel',
  '/collections/hats': '/collections/apparel',
  '/collections/bottles': '/collections/canvas-prints',
  '/collections/tote-bags': '/collections/apparel',
  '/collections/suitcases': '/collections/apparel',
  '/collections/yoga-mats': '/collections/bath-mats',
  '/collections/makeup-bags': '/collections/apparel',
  '/collections/coasters': '/collections/desk-mats',
  '/collections/pet-mat': '/collections/bath-mats',
  '/collections/bottle-opener': '/collections/canvas-prints',
  '/collections/pet-bowls': '/collections/bath-mats',
  '/collections/bags': '/collections/apparel',
  '/collections/bags-1': '/collections/apparel',
  '/collections/pets-animals': '/collections/canvas-prints',
  '/collections/can-cooler': '/collections/canvas-prints',
  '/collections/posters': '/collections/canvas-prints',
  '/collections/rugs': '/collections/bath-mats',
  '/collections/mousepads': '/collections/desk-mats'
};

const redirectsList = Object.entries(legacyRedirectMap).map(([pathVal, targetVal], idx) => ({
  id: `gid://shopify/UrlRedirect/legacy-${idx + 1}`,
  path: pathVal,
  target: targetVal
}));

redirectsList.push(
  {
    id: 'gid://shopify/UrlRedirect/prod-1',
    path: '/products/neon-throw-blanket-tropical-nights',
    target: '/products/neon-throw-blanket-tropical-nights-good-times'
  },
  {
    id: 'gid://shopify/UrlRedirect/prod-2',
    path: '/products/japanese-wave-hoodie-cotton',
    target: '/products/japanese-wave-hoodie-cotton-black'
  }
);

fs.writeFileSync(
  path.join(FIXTURES_DIR, 'redirects_sample.json'),
  JSON.stringify(redirectsList, null, 2),
  'utf8'
);
console.log(`Generated redirects_sample.json with ${redirectsList.length} redirects.`);

// 5. Generate pages_sample.json (36 pages)
const standardPages = [
  'about-us',
  'delivery-return',
  'uk-product-catalog',
  'data-sharing-opt-out',
  'studio-lookbook-social-feed',
  'abstract-geometric-minimalist-wall-art-decor-uk',
  'privacy-policy',
  'terms-of-service'
];

const guidePages = [
  'xxl-extended-gaming-desk-mats-uk-guide',
  'stretched-canvas-wall-art-uk-guide',
  'memory-foam-bath-mats-uk-guide',
  'plush-fleece-throw-blankets-uk-guide',
  'velvet-cushion-covers-uk-guide',
  'heavyweight-cotton-graphic-tees-uk-guide',
  'japanese-ukiyo-e-room-decor-uk-guide',
  'cyberpunk-neon-desk-setup-uk-guide',
  'space-galaxy-bedroom-decor-uk-guide',
  'minimalist-bauhaus-home-office-uk-guide',
  'botanical-floral-interior-decor-uk-guide',
  'retro-synthwave-aesthetic-room-uk-guide',
  'animals-wildlife-art-prints-uk-guide',
  'coastal-ocean-bathroom-decor-uk-guide',
  'student-studio-flat-decor-uk-guide',
  'living-room-wall-art-sizing-uk-guide',
  'bedroom-cozy-throw-blanket-uk-guide',
  'desk-mat-cleaning-and-care-uk-guide',
  'canvas-print-framing-options-uk-guide',
  'gaming-setup-cable-and-mat-uk-guide',
  'boho-kilim-textile-decor-uk-guide',
  'fantasy-dark-academia-decor-uk-guide',
  'celestial-moon-phase-room-uk-guide',
  'ergonomic-workspace-desk-pads-uk-guide',
  'modern-apartment-wall-decor-uk-guide',
  'sustainable-home-decor-textiles-uk-guide',
  'micro-weave-gaming-mouse-pad-uk-guide',
  'large-panoramic-canvas-art-uk-guide'
];

const allPageHandles = [...standardPages, ...guidePages];
const pagesList = allPageHandles.map((handle, idx) => {
  const cleanTitle = handle.replace(/-/g, ' ').replace(/\buk\b/g, 'UK').replace(/\b\w/g, l => l.toUpperCase());
  const title = fitTitleUnder60(`${cleanTitle.slice(0, 38)} | Prints With Passion`);
  let desc = `Explore our expert ${cleanTitle.toLowerCase()} guide covering materials, sizing specifications, and styling tips. Free UK tracked shipping on all orders.`;
  if (desc.length > 158) {
    desc = desc.slice(0, 157).replace(/\s+\S*$/, '.');
  }
  while (desc.length < 145) {
    desc = desc.replace(/\.$/, '') + ' Archival UK art.';
  }
  if (desc.length > 158) {
    desc = desc.slice(0, 157).replace(/\s+\S*$/, '.');
  }
  return {
    id: `gid://shopify/Page/${idx + 1}`,
    handle,
    title: cleanTitle,
    body: `<div class="pwp-page-body">
      <h2>${cleanTitle} Overview</h2>
      <p>Welcome to our comprehensive guide for UK homes and workspaces. Contact us at printswithpassionbc@gmail.com.</p>
      <h2>Styling & Sizing Advice</h2>
      <p>Explore related collections and guides at <a href="/pages/uk-product-catalog">UK Product Catalog</a>.</p>
    </div>`,
    seo: {
      title,
      description: desc
    }
  };
});

fs.writeFileSync(
  path.join(FIXTURES_DIR, 'pages_sample.json'),
  JSON.stringify(pagesList, null, 2),
  'utf8'
);
console.log(`Generated pages_sample.json with ${pagesList.length} pages.`);

// 6. Generate articles_sample.json (25 blog articles)
const articleHandles = [
  'uk-desk-mat-size-guide-60x35-xl-vs-80x40-xxl-compared',
  'uk-student-room-rental-flat-decor-guide',
  'how-to-choose-the-perfect-canvas-wall-art-size',
  'gaming-desk-mat-maintenance-and-cleaning-tips',
  'japanese-aesthetic-room-transformation-guide',
  'cyberpunk-neon-aesthetic-gaming-setup-guide',
  'nordic-minimalist-living-room-decor-ideas',
  'memory-foam-bath-mats-vs-traditional-rugs',
  'plush-fleece-throw-blanket-care-guide',
  'heavyweight-graphic-t-shirt-styling-guide',
  'botanical-wall-art-for-natural-light-rooms',
  'space-and-astronomy-wall-decor-inspiration',
  'vintage-retro-synthwave-room-styling-tips',
  'archival-canvas-vs-poster-prints-comparison',
  'velvet-cushion-cover-layering-color-guide',
  'dark-academia-decor-elements-for-study-spaces',
  'highland-cow-and-woodland-wildlife-wall-art',
  'topographic-and-bauhaus-geometry-desk-mats',
  'coastal-and-ocean-themed-bathroom-styling',
  'ergonomic-workspace-essentials-for-remote-work',
  'how-to-hang-stretched-canvas-prints-without-damage',
  'gift-guide-unique-home-decor-and-desk-accessories',
  'art-prints-for-quiet-minimalist-spaces',
  'seasonal-home-refresh-autumn-winter-textiles',
  'prints-with-passion-studio-craftsmanship-story'
];

function buildCleanArticleTitle(handle, cleanTitle) {
  if (handle === 'uk-desk-mat-size-guide-60x35-xl-vs-80x40-xxl-compared') {
    return 'UK Desk Mat Size Guide: 60x35 XL vs 80x40 XXL | PWP';
  }
  const maxBefore = 60 - ' | Blog'.length;
  if (cleanTitle.length <= maxBefore) {
    return `${cleanTitle} | Blog`;
  }
  const sliced = cleanTitle.slice(0, maxBefore);
  const lastSpace = sliced.lastIndexOf(' ');
  const safe = (lastSpace > 0 ? sliced.slice(0, lastSpace) : sliced).trim();
  return `${safe} | Blog`;
}

function buildCleanArticleDesc(cleanTitle) {
  const base = `Read our guide to ${cleanTitle.toLowerCase()} with expert styling advice, material specs, and care tips.`;
  const additions = [
    ' Free UK tracked delivery.',
    ' Curated UK home decor.',
    ' Handcrafted in the UK.',
    ' Curated UK decor.',
    ' Free UK shipping.'
  ];
  for (const add of additions) {
    const candidate = base + add;
    if (candidate.length >= 140 && candidate.length <= 158) return candidate;
  }
  const altBase = `Discover our guide to ${cleanTitle.toLowerCase()} with expert styling tips and material specs.`;
  for (const add of additions) {
    const candidate = altBase + add;
    if (candidate.length >= 140 && candidate.length <= 158) return candidate;
  }
  return base.slice(0, 140) + '...';
}

const articlesList = articleHandles.map((handle, idx) => {
  const cleanTitle = handle.replace(/-/g, ' ').replace(/\buk\b/g, 'UK').replace(/\b\w/g, l => l.toUpperCase());
  const title = buildCleanArticleTitle(handle, cleanTitle);
  const desc = buildCleanArticleDesc(cleanTitle);

  return {
    id: `gid://shopify/Article/${idx + 1}`,
    handle,
    title: cleanTitle,
    publishedAt: '2026-11-01T12:00:00Z',
    body: `<div class="pwp-article-body">
      <p>In this editorial guide, we explore ${cleanTitle.toLowerCase()} for design-conscious homeowners.</p>
      <p>Discover our popular <a href="/collections/japanese-anime-desk-mats">Japanese Anime Desk Mats</a> and <a href="/collections/nature-mountain-landscape-canvas-wall-art">Nature Mountain Canvas Art</a>.</p>
      <p>Also explore our companion pillar guides: <a href="/blogs/news/uk-student-room-rental-flat-decor-guide">UK Student Flat Decor Guide</a> and <a href="/pages/xxl-extended-gaming-desk-mats-uk-guide">XXL Gaming Desk Mats Guide</a>.</p>
    </div>`,
    seo: {
      title,
      description: desc
    }
  };
});

fs.writeFileSync(
  path.join(FIXTURES_DIR, 'articles_sample.json'),
  JSON.stringify(articlesList, null, 2),
  'utf8'
);
console.log(`Generated articles_sample.json with ${articlesList.length} articles.`);

// 7. Generate sitemaps_sample.xml
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Homepage -->
  <url>
    <loc>https://printswithpassion.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <!-- 70 Active Collections -->
${collectionsList.filter(c => c.resourcePublicationsV2.edges[0]?.node.isPublished).map(c => `  <url>
    <loc>https://printswithpassion.com/collections/${c.handle}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
  <!-- 36 Pages -->
${pagesList.map(p => `  <url>
    <loc>https://printswithpassion.com/pages/${p.handle}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
  <!-- 25 Articles -->
${articlesList.map(a => `  <url>
    <loc>https://printswithpassion.com/blogs/news/${a.handle}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n')}
</urlset>`;

fs.writeFileSync(
  path.join(FIXTURES_DIR, 'sitemaps_sample.xml'),
  sitemapXml,
  'utf8'
);
console.log('Generated sitemaps_sample.xml.');
