import fs from 'fs';
import path from 'path';

const auditedPages = JSON.parse(fs.readFileSync('./.agents/teamwork/teamwork_explorer_survey_2/audited_pages.json', 'utf8'));
const auditedArticles = JSON.parse(fs.readFileSync('./.agents/teamwork/teamwork_explorer_survey_2/audited_articles.json', 'utf8'));
const subcollections = JSON.parse(fs.readFileSync('./phase2_40_subcollections.json', 'utf8'));

// 1. Audit the 11 unindexed/orphaned static pages
const unindexedHandles = [
  'about-us',
  'data-sharing-opt-out',
  'studio-lookbook-social-feed',
  'vip-loyalty-program',
  'us-shipping-and-sizing-guide',
  'ai-catalog-directory',
  'desk-setup-hardware-compatibility-guide',
  'studio-quality-vs-generic-prints',
  'trade-and-bulk-orders',
  'delivery-return',
  'uk-product-catalog'
];

const unindexedPagesAudit = unindexedHandles.map(handle => {
  const p = auditedPages.find(x => x.handle === handle) || {};
  let rootCause = '';
  let remediationPathway = '';

  if (handle === 'about-us') {
    rootCause = 'Orphan page: Omitted from both footer navigation and uk-product-catalog directory. Zero internal links from index or main menu.';
    remediationPathway = 'Add to Footer Menu (gid://shopify/Menu/221177086263) and Section 5 of /pages/uk-product-catalog.';
  } else if (handle === 'uk-product-catalog') {
    rootCause = 'Hub page itself is missing from global footer menu, isolating the catalog hub to sitemap-only discovery.';
    remediationPathway = 'Add to Footer Menu (gid://shopify/Menu/221177086263) as key sitewide catalog directory link.';
  } else if (handle === 'studio-lookbook-social-feed') {
    rootCause = 'Orphan page: Omitted from footer menu and uk-product-catalog directory. Large gallery page (71KB) receiving zero crawler visibility.';
    remediationPathway = 'Add to Footer Menu (gid://shopify/Menu/221177086263) and Section 4 of /pages/uk-product-catalog.';
  } else if (handle === 'data-sharing-opt-out') {
    rootCause = 'Omitted from /pages/uk-product-catalog directory; previously unknown to Google until footer link crawled.';
    remediationPathway = 'Add to Section 5 of /pages/uk-product-catalog directory for comprehensive compliance index.';
  } else if (handle === 'delivery-return') {
    rootCause = 'Omitted from /pages/uk-product-catalog directory; shipping & returns guide requires hub discovery.';
    remediationPathway = 'Add to Section 5 of /pages/uk-product-catalog directory.';
  } else if (['us-shipping-and-sizing-guide', 'desk-setup-hardware-compatibility-guide', 'studio-quality-vs-generic-prints', 'trade-and-bulk-orders'].includes(handle)) {
    rootCause = 'Omitted from /pages/uk-product-catalog directory and footer menu. Deep specification guide with zero direct navigation paths.';
    remediationPathway = 'Add to Section 3 (Studio Specifications & B2B Trade Guides) of /pages/uk-product-catalog.';
  } else if (['vip-loyalty-program', 'ai-catalog-directory'].includes(handle)) {
    rootCause = 'Omitted from /pages/uk-product-catalog directory; member vault and AI directory lack catalog hub inclusion.';
    remediationPathway = 'Add to Section 4 (Studio Discovery & VIP Vault) of /pages/uk-product-catalog.';
  }

  return {
    handle,
    id: p.id,
    url: `https://printswithpassion.com/pages/${handle}`,
    title: p.title,
    bodyLength: p.bodyLength || 0,
    rootCause,
    remediationPathway
  };
});

// 2. 8 uncrawled articles
const uncrawled8Handles = [
  'cable-management-rgb-routing-desk-mat-uk',
  'gallery-wall-grid-vs-salon-hang-spacing-guide-uk',
  'home-office-standing-desk-mat-sizing-uk-guide',
  'uk-mouse-pad-vs-extended-desk-mat-gaming-work-guide',
  'spill-proof-water-resistant-desk-mat-care-uk',
  'biophilic-home-office-living-room-styling-guide',
  'japanese-ukiyo-e-asian-art-zen-styling-guide',
  'abstract-minimalist-bauhaus-styling-guide'
];

const uncrawledArticles = uncrawled8Handles.map(handle => {
  const a = auditedArticles.find(x => x.handle === handle) || {};
  return {
    handle,
    id: a.id,
    url: `https://printswithpassion.com/blogs/news/${handle}`,
    title: a.title,
    gscStatus: 'Discovered - currently not indexed / URL is unknown (LastCrawl: NEVER)'
  };
});

// 3. 14 uncrawled smart sub-collections
const uncrawled14Subcollections = [
  { handle: 'botanical-floral-garden-cushion-covers', theme: 'Botanical & Floral', type: 'Cushion Covers' },
  { handle: 'abstract-geometric-bauhaus-cushion-covers', theme: 'Abstract & Geometric', type: 'Cushion Covers' },
  { handle: 'animals-wildlife-woodland-cushion-covers', theme: 'Animals & Wildlife', type: 'Cushion Covers' },
  { handle: 'space-celestial-galaxy-cushion-covers', theme: 'Space & Cosmic', type: 'Cushion Covers' },
  { handle: 'fantasy-mythology-gothic-cushion-covers', theme: 'Fantasy & Mythology', type: 'Cushion Covers' },
  { handle: 'japanese-asian-art-cushion-covers', theme: 'Japanese & Asian Art', type: 'Cushion Covers' },
  { handle: 'nature-mountain-cabin-throw-blankets', theme: 'Nature & Landscapes', type: 'Throw Blankets' },
  { handle: 'abstract-boho-kilim-throw-blankets', theme: 'Abstract & Geometric', type: 'Throw Blankets' },
  { handle: 'space-starry-night-galaxy-throw-blankets', theme: 'Space & Cosmic', type: 'Throw Blankets' },
  { handle: 'coastal-ocean-botanical-bath-mats', theme: 'Botanical & Coastal', type: 'Bath Mats' },
  { handle: 'minimalist-abstract-stone-bath-mats', theme: 'Abstract & Geometric', type: 'Bath Mats' },
  { handle: 'celestial-space-moon-bath-mats', theme: 'Space & Cosmic', type: 'Bath Mats' },
  { handle: 'japanese-zen-onsen-bath-mats', theme: 'Japanese & Asian Art', type: 'Bath Mats' },
  { handle: 'japanese-anime-graphic-t-shirts', theme: 'Japanese & Asian Art', type: 'Apparel' }
].map(item => {
  const sc = subcollections.find(x => x.handle === item.handle) || {};
  return {
    handle: item.handle,
    id: sc.id || null,
    title: sc.title || item.handle,
    url: `https://printswithpassion.com/collections/${item.handle}`,
    productType: item.type,
    theme: item.theme,
    gscStatus: 'Discovered - currently not indexed / URL is unknown (LastCrawl: NEVER)'
  };
});

// 4. Exact Cross-Link Mappings for All 25 Articles
// Each article will receive:
// - At least 1 link to an uncrawled article (or reciprocal cross-link)
// - At least 1 link to an uncrawled/under-linked smart sub-collection
// - Exact anchor text and semantic HTML callout snippet
const crossLinkSpecs = auditedArticles.map((art, idx) => {
  let targetArticles = [];
  let targetCollections = [];

  // Define thematic mappings
  if (art.handle === 'uk-desk-mat-size-guide-60x35-xl-vs-80x40-xxl-compared') {
    targetArticles = [
      { handle: 'uk-mouse-pad-vs-extended-desk-mat-gaming-work-guide', anchorText: 'Mouse Pad vs Extended XXL Desk Mat Comparison Guide' },
      { handle: 'home-office-standing-desk-mat-sizing-uk-guide', anchorText: 'Standing Desk Mat Sizing & Ergonomic Setup Guide' }
    ];
    targetCollections = [
      { handle: 'minimalist-abstract-stone-bath-mats', anchorText: 'Minimalist Abstract Stone Bath Mats' },
      { handle: 'cyberpunk-neon-gaming-desk-mats', anchorText: 'Cyberpunk & Synthwave XXL Gaming Desk Mats' }
    ];
  } else if (art.handle === 'how-to-choose-canvas-wall-art-size-above-uk-sofa-or-bed') {
    targetArticles = [
      { handle: 'gallery-wall-grid-vs-salon-hang-spacing-guide-uk', anchorText: 'Gallery Wall Grid Layout vs Asymmetric Salon Hang Spacing Guide' },
      { handle: 'abstract-minimalist-bauhaus-styling-guide', anchorText: 'Abstract Bauhaus & Modernist Canvas Wall Art Guide' }
    ];
    targetCollections = [
      { handle: 'botanical-floral-garden-cushion-covers', anchorText: 'Botanical Floral Garden Velvet Cushion Covers' },
      { handle: 'nature-mountain-cabin-throw-blankets', anchorText: 'Nature Alpine Cabin Plush Throw Blankets' }
    ];
  } else if (art.handle === 'best-desk-setup-accessories-ikea-karlby-lagkapten-uk-guide') {
    targetArticles = [
      { handle: 'cable-management-rgb-routing-desk-mat-uk', anchorText: 'Cable Management & RGB Routing Guide for Extended Desk Mats' },
      { handle: 'spill-proof-water-resistant-desk-mat-care-uk', anchorText: 'Spill-Proof & Water-Resistant Desk Mat Care Guide' }
    ];
    targetCollections = [
      { handle: 'abstract-geometric-bauhaus-cushion-covers', anchorText: 'Abstract Bauhaus Geometric Cushion Covers' },
      { handle: 'coastal-ocean-botanical-bath-mats', anchorText: 'Coastal Ocean Velvet Memory Foam Bath Mats' }
    ];
  } else if (art.handle === 'mechanical-keyboard-desk-mat-pairing-guide-uk') {
    targetArticles = [
      { handle: 'cable-management-rgb-routing-desk-mat-uk', anchorText: 'Cable Management & RGB Under-Mat Routing Tips' },
      { handle: 'uk-mouse-pad-vs-extended-desk-mat-gaming-work-guide', anchorText: 'Mouse Pad vs XXL Extended Desk Mat Guide' }
    ];
    targetCollections = [
      { handle: 'space-celestial-galaxy-cushion-covers', anchorText: 'Celestial Galaxy Microfibre Cushion Covers' },
      { handle: 'space-starry-night-galaxy-throw-blankets', anchorText: 'Starry Night Galaxy Plush Throw Blankets' }
    ];
  } else if (art.handle === 'canvas-wall-art-hanging-height-guide-uk-57-inch-rule') {
    targetArticles = [
      { handle: 'gallery-wall-grid-vs-salon-hang-spacing-guide-uk', anchorText: 'Gallery Wall Grid vs Salon Hang Alignment Guide' },
      { handle: 'biophilic-home-office-living-room-styling-guide', anchorText: 'Biophilic Interior Styling & Botanical Art Guide' }
    ];
    targetCollections = [
      { handle: 'abstract-boho-kilim-throw-blankets', anchorText: 'Abstract Boho Kilim Coral Fleece Throws' },
      { handle: 'botanical-floral-garden-cushion-covers', anchorText: 'Botanical Floral Double-Sided Cushion Covers' }
    ];
  } else if (art.handle === 'best-gifts-for-gamers-remote-workers-homeowners-uk') {
    targetArticles = [
      { handle: 'home-office-standing-desk-mat-sizing-uk-guide', anchorText: 'Home Office Standing Desk Mat Ergonomic Guide' },
      { handle: 'japanese-ukiyo-e-asian-art-zen-styling-guide', anchorText: 'Japanese Ukiyo-e & Asian Art Zen Styling Guide' }
    ];
    targetCollections = [
      { handle: 'japanese-anime-graphic-t-shirts', anchorText: 'Japanese Anime Vivid Graphic T-Shirts' },
      { handle: 'fantasy-mythology-gothic-cushion-covers', anchorText: 'Fantasy & Gothic Mythic Accent Cushion Covers' }
    ];
  } else if (art.handle === 'dual-monitor-ultrawide-desk-setup-mat-sizing-uk') {
    targetArticles = [
      { handle: 'cable-management-rgb-routing-desk-mat-uk', anchorText: 'Clean Battlestation Cable & RGB Routing Guide' },
      { handle: 'home-office-standing-desk-mat-sizing-uk-guide', anchorText: 'Standing Desk Mat Setup & Workspace Sizing Guide' }
    ];
    targetCollections = [
      { handle: 'celestial-space-moon-bath-mats', anchorText: 'Celestial Space Moon Memory Foam Bath Mats' },
      { handle: 'space-galaxy-nebula-desk-mats', anchorText: 'Space Galaxy Nebula Extended Desk Mats' }
    ];
  } else if (art.handle === 'how-to-clean-wash-extended-gaming-desk-mat-uk') {
    targetArticles = [
      { handle: 'spill-proof-water-resistant-desk-mat-care-uk', anchorText: 'Spill-Proof & Water-Resistant Desk Mat Stain Cleaning Guide' },
      { handle: 'uk-mouse-pad-vs-extended-desk-mat-gaming-work-guide', anchorText: 'Mouse Pad vs Extended Mat Durability Guide' }
    ];
    targetCollections = [
      { handle: 'coastal-ocean-botanical-bath-mats', anchorText: 'Quick-Drying Coastal Ocean Bath Mats' },
      { handle: 'animals-wildlife-woodland-cushion-covers', anchorText: 'Woodland Wildlife Double-Sided Cushion Covers' }
    ];
  } else if (art.handle === 'ikea-karlby-alex-drawer-gaming-desk-setup-mat-guide-uk') {
    targetArticles = [
      { handle: 'cable-management-rgb-routing-desk-mat-uk', anchorText: 'IKEA Desk Cable Management & Routing Tips' },
      { handle: 'home-office-standing-desk-mat-sizing-uk-guide', anchorText: 'Standing Desk Mat Alternatives for Karlby Desks' }
    ];
    targetCollections = [
      { handle: 'abstract-geometric-bauhaus-cushion-covers', anchorText: 'Bauhaus Geometric Sofa & Chair Cushion Covers' },
      { handle: 'minimalist-abstract-stone-bath-mats', anchorText: 'Minimalist Abstract Non-Slip Bath Mats' }
    ];
  } else if (art.handle === 'stretched-canvas-vs-framed-prints-uk-comparison') {
    targetArticles = [
      { handle: 'gallery-wall-grid-vs-salon-hang-spacing-guide-uk', anchorText: 'Gallery Wall Spacing & Layout Alignment Rules' },
      { handle: 'abstract-minimalist-bauhaus-styling-guide', anchorText: 'Abstract Bauhaus Modernist Styling Guide' }
    ];
    targetCollections = [
      { handle: 'botanical-floral-garden-cushion-covers', anchorText: 'Botanical Garden Velvet Cushion Covers' },
      { handle: 'nature-mountain-cabin-throw-blankets', anchorText: 'Alpine Mountain Cabin Throw Blankets' }
    ];
  } else if (art.handle === 'mechanical-keyboard-desk-mat-acoustics-sizing-uk-guide') {
    targetArticles = [
      { handle: 'uk-mouse-pad-vs-extended-desk-mat-gaming-work-guide', anchorText: 'Mouse Pad vs Extended Mat Keystroke Dampening Comparison' },
      { handle: 'cable-management-rgb-routing-desk-mat-uk', anchorText: 'RGB Desk Mat Cable Routing Architecture' }
    ];
    targetCollections = [
      { handle: 'japanese-asian-art-cushion-covers', anchorText: 'Japanese Ukiyo-e Woodblock Cushion Covers' },
      { handle: 'space-starry-night-galaxy-throw-blankets', anchorText: 'Starry Night Cosmic Throw Blankets' }
    ];
  } else if (art.handle === 'cable-management-rgb-routing-desk-mat-uk') {
    // Uncrawled Article 1
    targetArticles = [
      { handle: 'uk-desk-mat-size-guide-60x35-xl-vs-80x40-xxl-compared', anchorText: 'UK Desk Mat Size Guide: 60x35cm XL vs 80x40cm XXL' },
      { handle: 'home-office-standing-desk-mat-sizing-uk-guide', anchorText: 'Height-Adjustable Standing Desk Mat Cable Setup' }
    ];
    targetCollections = [
      { handle: 'cyberpunk-neon-gaming-desk-mats', anchorText: 'Cyberpunk Synthwave XXL Desk Mats' },
      { handle: 'minimalist-abstract-stone-bath-mats', anchorText: 'Minimalist Abstract Foam Bath Mats' }
    ];
  } else if (art.handle === 'desk-mat-thickness-guide-2mm-vs-3mm-vs-4mm-uk') {
    targetArticles = [
      { handle: 'spill-proof-water-resistant-desk-mat-care-uk', anchorText: 'Water-Resistant Coating & Liquid Resistance Guide' },
      { handle: 'uk-mouse-pad-vs-extended-desk-mat-gaming-work-guide', anchorText: 'Mouse Pad vs 4mm Extended Desk Mat Breakdown' }
    ];
    targetCollections = [
      { handle: 'animals-wildlife-woodland-cushion-covers', anchorText: 'Woodland Wildlife Accent Cushion Covers' },
      { handle: 'coastal-ocean-botanical-bath-mats', anchorText: 'Coastal Ocean Quick-Dry Bath Mats' }
    ];
  } else if (art.handle === 'gallery-wall-grid-vs-salon-hang-spacing-guide-uk') {
    // Uncrawled Article 2
    targetArticles = [
      { handle: 'canvas-wall-art-hanging-height-guide-uk-57-inch-rule', anchorText: 'UK Canvas Wall Art 57-Inch Hanging Height Rule' },
      { handle: 'abstract-minimalist-bauhaus-styling-guide', anchorText: 'Modern Bauhaus Proportions & Grid Layout Guide' }
    ];
    targetCollections = [
      { handle: 'botanical-floral-garden-cushion-covers', anchorText: 'Botanical Floral Accent Cushion Covers' },
      { handle: 'abstract-boho-kilim-throw-blankets', anchorText: 'Abstract Boho Microfibre Throw Blankets' }
    ];
  } else if (art.handle === 'ergonomic-wrist-rest-vs-flat-desk-mat-uk') {
    targetArticles = [
      { handle: 'home-office-standing-desk-mat-sizing-uk-guide', anchorText: 'Ergonomic Standing Desk Mat Dimensions & Fatigue Relief' },
      { handle: 'uk-mouse-pad-vs-extended-desk-mat-gaming-work-guide', anchorText: 'Standard Mouse Pad vs Full-Desk Ergonomic Mats' }
    ];
    targetCollections = [
      { handle: 'minimalist-abstract-stone-bath-mats', anchorText: 'Ergonomic Memory Foam Bath Rugs' },
      { handle: 'abstract-geometric-bauhaus-cushion-covers', anchorText: 'Geometric Bauhaus Velvet Pillows' }
    ];
  } else if (art.handle === 'home-office-standing-desk-mat-sizing-uk-guide') {
    // Uncrawled Article 3
    targetArticles = [
      { handle: 'dual-monitor-ultrawide-desk-setup-mat-sizing-uk', anchorText: 'Ultrawide & Dual Monitor Desk Sizing Guide' },
      { handle: 'cable-management-rgb-routing-desk-mat-uk', anchorText: 'Standing Desk Cable Management & Routing Tips' }
    ];
    targetCollections = [
      { handle: 'nature-mountain-cabin-throw-blankets', anchorText: 'Cozy Mountain Cabin Throw Blankets' },
      { handle: 'minimalist-abstract-stone-bath-mats', anchorText: 'Stone Textured Memory Foam Mats' }
    ];
  } else if (art.handle === 'gallery-wall-layout-canvas-art-sizing-uk-guide') {
    targetArticles = [
      { handle: 'gallery-wall-grid-vs-salon-hang-spacing-guide-uk', anchorText: 'Grid vs Salon Hang Wall Layout Techniques' },
      { handle: 'biophilic-home-office-living-room-styling-guide', anchorText: 'Biophilic Botanical Wall Art Arrangements' }
    ];
    targetCollections = [
      { handle: 'botanical-floral-garden-cushion-covers', anchorText: 'Coordinating Garden Floral Cushion Covers' },
      { handle: 'abstract-boho-kilim-throw-blankets', anchorText: 'Boho Kilim Geometric Throws' }
    ];
  } else if (art.handle === 'uk-mouse-pad-vs-extended-desk-mat-gaming-work-guide') {
    // Uncrawled Article 4
    targetArticles = [
      { handle: 'uk-desk-mat-size-guide-60x35-xl-vs-80x40-xxl-compared', anchorText: 'UK Desk Mat Dimensions Chart (60x35 vs 80x40)' },
      { handle: 'spill-proof-water-resistant-desk-mat-care-uk', anchorText: 'Spill-Proof Coating vs Uncoated Fabric Mouse Pads' }
    ];
    targetCollections = [
      { handle: 'cyberpunk-neon-gaming-desk-mats', anchorText: 'High-Precision Cyberpunk Gaming Desk Mats' },
      { handle: 'japanese-anime-graphic-t-shirts', anchorText: 'Japanese Anime Studio Graphic T-Shirts' }
    ];
  } else if (art.handle === 'cloth-vs-glass-desk-mat-mouse-sensor-tracking-uk') {
    targetArticles = [
      { handle: 'uk-mouse-pad-vs-extended-desk-mat-gaming-work-guide', anchorText: 'Sensor DPI Tracking on Extended Micro-Weave Cloth Pads' },
      { handle: 'spill-proof-water-resistant-desk-mat-care-uk', anchorText: 'Water-Resistant Fabric Maintenance & Longevity' }
    ];
    targetCollections = [
      { handle: 'space-celestial-galaxy-cushion-covers', anchorText: 'Galaxy Celestial Cushion Covers' },
      { handle: 'celestial-space-moon-bath-mats', anchorText: 'Space Moon Non-Slip Bath Mats' }
    ];
  } else if (art.handle === 'how-to-flatten-rolled-desk-mat-curling-edges-uk') {
    targetArticles = [
      { handle: 'home-office-standing-desk-mat-sizing-uk-guide', anchorText: 'Standing Desk Setup & Edge-Stitched Mat Care' },
      { handle: 'spill-proof-water-resistant-desk-mat-care-uk', anchorText: 'Restoring Water-Resistant Desk Mat Finishes' }
    ];
    targetCollections = [
      { handle: 'animals-wildlife-woodland-cushion-covers', anchorText: 'Woodland Wildlife Accent Pillows' },
      { handle: 'coastal-ocean-botanical-bath-mats', anchorText: 'Anti-Slip Coastal Bathroom Mats' }
    ];
  } else if (art.handle === 'spill-proof-water-resistant-desk-mat-care-uk') {
    // Uncrawled Article 5
    targetArticles = [
      { handle: 'how-to-clean-wash-extended-gaming-desk-mat-uk', anchorText: 'Deep Cleaning & Machine Washing Guide for Desk Mats' },
      { handle: 'cable-management-rgb-routing-desk-mat-uk', anchorText: 'Protecting Under-Desk Cable Routing from Liquid Spills' }
    ];
    targetCollections = [
      { handle: 'coastal-ocean-botanical-bath-mats', anchorText: 'Water-Absorbent Coastal Bath Mats' },
      { handle: 'nature-mountain-cabin-throw-blankets', anchorText: 'Plush Alpine Cabin Throw Blankets' }
    ];
  } else if (art.handle === 'mid-century-modern-home-office-living-room-styling-uk-guide') {
    targetArticles = [
      { handle: 'abstract-minimalist-bauhaus-styling-guide', anchorText: 'Abstract Bauhaus Geometric Interior Styling Guide' },
      { handle: 'biophilic-home-office-living-room-styling-guide', anchorText: 'Biophilic Botanical Living Room Decor Guide' }
    ];
    targetCollections = [
      { handle: 'abstract-geometric-bauhaus-cushion-covers', anchorText: 'Mid-Century Bauhaus Geometric Cushion Covers' },
      { handle: 'minimalist-abstract-stone-bath-mats', anchorText: 'Modernist Minimalist Bath Rugs' }
    ];
  } else if (art.handle === 'biophilic-home-office-living-room-styling-guide') {
    // Uncrawled Article 6
    targetArticles = [
      { handle: 'mid-century-modern-home-office-living-room-styling-uk-guide', anchorText: 'Mid-Century Modern Living Room Styling Guide' },
      { handle: 'how-to-choose-canvas-wall-art-size-above-uk-sofa-or-bed', anchorText: 'Sizing Botanical Canvas Art Above Living Room Sofas' }
    ];
    targetCollections = [
      { handle: 'botanical-floral-garden-cushion-covers', anchorText: 'Botanical Floral Garden Velvet Cushion Covers' },
      { handle: 'coastal-ocean-botanical-bath-mats', anchorText: 'Nature-Inspired Coastal Botanical Bath Mats' }
    ];
  } else if (art.handle === 'japanese-ukiyo-e-asian-art-zen-styling-guide') {
    // Uncrawled Article 7
    targetArticles = [
      { handle: 'abstract-minimalist-bauhaus-styling-guide', anchorText: 'Minimalist Zen & Bauhaus Proportions Guide' },
      { handle: 'how-to-choose-canvas-wall-art-size-above-uk-sofa-or-bed', anchorText: 'Choosing Wall Art Dimensions for Minimalist Bedrooms' }
    ];
    targetCollections = [
      { handle: 'japanese-asian-art-cushion-covers', anchorText: 'Japanese Ukiyo-e Wave & Sakura Cushion Covers' },
      { handle: 'japanese-zen-onsen-bath-mats', anchorText: 'Japanese Zen Onsen Non-Slip Bath Mats' },
      { handle: 'japanese-anime-graphic-t-shirts', anchorText: 'Japanese Anime & Ukiyo-e Studio T-Shirts' }
    ];
  } else if (art.handle === 'abstract-minimalist-bauhaus-styling-guide') {
    // Uncrawled Article 8
    targetArticles = [
      { handle: 'gallery-wall-grid-vs-salon-hang-spacing-guide-uk', anchorText: 'Geometric Bauhaus Grid Hanging Layout Rules' },
      { handle: 'mid-century-modern-home-office-living-room-styling-uk-guide', anchorText: 'Mid-Century Modern & Bauhaus Workspace Pairing Guide' }
    ];
    targetCollections = [
      { handle: 'abstract-geometric-bauhaus-cushion-covers', anchorText: 'Bauhaus Geometric Square Cushion Covers' },
      { handle: 'minimalist-abstract-stone-bath-mats', anchorText: 'Abstract Minimalist Stone Memory Foam Bath Mats' }
    ];
  }

  // Generate clean semantic HTML snippet
  const articleListHtml = targetArticles.map(t =>
    `    <li>Guide: <a href="/blogs/news/${t.handle}" style="color:#111827;font-weight:600;text-decoration:underline;">${t.anchorText}</a></li>`
  ).join('\n');

  const collectionListHtml = targetCollections.map(t =>
    `    <li>Collection: <a href="/collections/${t.handle}" style="color:#111827;font-weight:600;text-decoration:underline;">${t.anchorText}</a></li>`
  ).join('\n');

  const calloutBlock = `\n<div class="pwp-related-guides-and-collections" style="margin:32px 0 20px;padding:20px 24px;background:#f9fafb;border-left:4px solid #4f46e5;border-radius:6px;">
  <p style="margin:0 0 10px;font-size:16px;font-weight:700;color:#111827;">Related UK Guides &amp; Curated Studio Collections</p>
  <ul style="margin:0;padding-left:18px;line-height:1.75;font-size:14px;color:#374151;">
${articleListHtml}
${collectionListHtml}
  </ul>
</div>`;

  return {
    handle: art.handle,
    id: art.id,
    url: art.url,
    title: art.title,
    targetArticles,
    targetCollections,
    calloutBlock
  };
});

// 5. Complete JSON Specification Object
const completeSpec = {
  specificationMetadata: {
    title: 'Prints With Passion — Milestone 4 Internal Linking, Catalog Directory & Navigation Specification',
    timestamp: new Date().toISOString(),
    author: 'teamwork_explorer_m4_3',
    version: '1.0.0',
    targetShopifyStore: 'bencook96store.myshopify.com',
    primaryDomain: 'https://printswithpassion.com'
  },
  unindexedPagesRemediation: {
    totalUnindexedPages: unindexedPagesAudit.length,
    pages: unindexedPagesAudit
  },
  catalogHubSpecification: {
    pageId: 'gid://shopify/Page/703791300981',
    noteOnDispatchTypo: 'Dispatch referenced gid://shopify/Page/140089884983, which returns null in GraphQL. Verified live GID in Shopify Admin is gid://shopify/Page/703791300981.',
    handle: 'uk-product-catalog',
    url: 'https://printswithpassion.com/pages/uk-product-catalog',
    proposedSeo: {
      title: 'UK Product Catalog & Guide Directory | Prints With Passion',
      titleLength: 57,
      description: 'Browse the complete Prints With Passion UK directory: 27,400+ custom framed canvas prints, XXL gaming desk mats, plush throw blankets & velvet cushion covers.',
      descriptionLength: 152
    },
    innerH1Demotion: 'Convert line 29 <h1>...</h1> to <h2>...</h2> to ensure strictly single <h1> on live storefront.',
    entitySanitization: 'Replace all &amp; with & in rendered heading text.',
    directorySections: [
      {
        sectionNumber: 1,
        title: 'Core Storefront Collections & Live Atom/RSS Product Feeds',
        description: 'Direct shopping links and real-time Atom XML product feeds for 6 core categories',
        linksCount: 6
      },
      {
        sectionNumber: 2,
        title: '20 Curated UK Category, Theme & Room Styling Guides (20,000-Product Showcase)',
        description: 'Editorial pillar guides covering dimensions, decor styling, and material care',
        linksCount: 20
      },
      {
        sectionNumber: 3,
        title: 'Studio Specifications, Hardware Compatibility & B2B Trade Guides',
        description: 'In-depth engineering dimensions, imperial/metric charts, furniture fit, and commercial wholesale',
        linksCount: 5,
        pagesLinked: [
          '/pages/size-guide',
          '/pages/us-shipping-and-sizing-guide',
          '/pages/desk-setup-hardware-compatibility-guide',
          '/pages/studio-quality-vs-generic-prints',
          '/pages/trade-and-bulk-orders'
        ]
      },
      {
        sectionNumber: 4,
        title: 'Studio Discovery, Lookbooks & VIP Member Vault',
        description: 'Interactive discovery tools, room inspiration lookbooks, wallpaper vault, and loyalty perks',
        linksCount: 5,
        pagesLinked: [
          '/pages/ai-catalog-directory',
          '/pages/studio-lookbook-social-feed',
          '/pages/vip-loyalty-program',
          '/pages/desk-size-visualizer',
          '/pages/free-4k-wallpapers'
        ]
      },
      {
        sectionNumber: 5,
        title: 'Studio Brand, Customer Support & Compliance Directory',
        description: 'Official brand background, customer delivery/returns, contact channels, and privacy choices',
        linksCount: 5,
        pagesLinked: [
          '/pages/about-us',
          '/pages/contact-us',
          '/pages/delivery-return',
          '/pages/privacy-policy',
          '/pages/data-sharing-opt-out'
        ]
      }
    ],
    totalStaticPagesLinked: 35
  },
  footerMenuSpecification: {
    menuId: 'gid://shopify/Menu/221177086263',
    handle: 'footer',
    title: 'Footer menu',
    itemsToAdd: [
      {
        title: 'About Us',
        type: 'PAGE',
        resourceId: 'gid://shopify/Page/688935666037',
        url: '/pages/about-us'
      },
      {
        title: 'UK Product Catalog & Directory',
        type: 'PAGE',
        resourceId: 'gid://shopify/Page/703791300981',
        url: '/pages/uk-product-catalog'
      },
      {
        title: 'Studio Lookbook & Room Inspiration',
        type: 'PAGE',
        resourceId: 'gid://shopify/Page/703875121525',
        url: '/pages/studio-lookbook-social-feed'
      }
    ],
    mutationDetails: {
      mutationName: 'menuUpdate',
      exactArguments: {
        id: 'gid://shopify/Menu/221177086263',
        title: 'Footer menu',
        handle: 'footer'
      }
    }
  },
  blogCrossLinkingSpecification: {
    totalArticles: crossLinkSpecs.length,
    uncrawledArticles: uncrawledArticles,
    uncrawledSubcollections: uncrawled14Subcollections,
    articleRemediationSpecs: crossLinkSpecs
  }
};

fs.writeFileSync(
  './.agents/teamwork/teamwork_explorer_m4_3/internal_linking_spec.json',
  JSON.stringify(completeSpec, null, 2)
);
console.log('Saved internal_linking_spec.json successfully!');
