import fs from 'fs';
import path from 'path';

const rawPagesPath = 'C:/Users/Benjamin/.gemini/antigravity/scratch/pwp-seo-blog-engine/.agents/teamwork/teamwork_explorer_m4_1/live_pages_raw.json';
const pages = JSON.parse(fs.readFileSync(rawPagesPath, 'utf8'));

const metadataMap = {
  'contact-us': {
    title: 'Contact Prints With Passion | UK Customer Care Support',
    desc: 'Contact Prints With Passion UK customer care team for order inquiries, bespoke sizing & delivery tracking. Free tracked UK delivery on all art and decor.'
  },
  'size-guide': {
    title: 'Official Size Guide (CM & Inches) | Prints With Passion',
    desc: 'Complete UK and USA size guide for framed canvas prints, XXL desk mats, cushion covers, throw blankets & bath mats in both metric (cm) and imperial (inches).'
  },
  'privacy-policy': {
    title: 'Privacy Policy & Data Security | Prints With Passion',
    desc: 'Read the Prints With Passion privacy policy and data security standards. Learn how we protect your personal information, cookies and transactional privacy.'
  },
  'data-sharing-opt-out': {
    title: 'Your Privacy Choices & Opt-Out | Prints With Passion',
    desc: 'Manage your privacy choices, cookie preferences and personal data sharing opt-out options in compliance with UK GDPR and international privacy legislation.'
  },
  'about-us': {
    title: 'About Prints With Passion | UK Archival Art & Decor Studio',
    desc: 'Discover Prints With Passion: our independent UK print studio dedicated to archival framed canvas wall art, 4mm XXL desk mats and bespoke home decor.'
  },
  'delivery-return': {
    title: 'Delivery & Returns Policy | 100% Free UK Tracked Shipping',
    desc: 'Learn about our delivery and returns policy: 100% free Royal Mail tracked shipping across the UK, 30-day guarantee and secure protective studio packaging.'
  },
  'desk-size-visualizer': {
    title: 'UK Desk Mat & Wall Art Size Visualizer | CM & Inches',
    desc: 'Interactive sizing visualizer: preview 60×35cm, 80×40cm & 90×40cm XXL desk mats, mechanical keyboards and framed canvas prints across popular UK desk setups.'
  },
  'free-4k-wallpapers': {
    title: 'Free 4K Desktop & Setup Wallpapers | Prints With Passion',
    desc: 'Download free 4K ultra-high-definition desktop and dual-monitor wallpapers matching our archival canvas prints and XXL desk mats. Licensed CC-BY 4.0.'
  },
  'uk-product-catalog': {
    title: 'UK Catalog Directory: Wall Art, Desk Mats & Home Decor',
    desc: 'Explore the complete Prints With Passion UK catalog directory: 48 studio collections of framed canvas wall art, XXL desk mats, cushions and fleece throws.'
  },
  'xxl-extended-gaming-desk-mats-uk-guide': {
    title: 'XXL Extended Gaming Desk Mats UK (80×40cm) Setup Guide',
    desc: 'UK buyer guide for XXL 80×40cm extended gaming desk mats: 4mm thick natural rubber base, micro-weave cloth and anti-fray stitching. Free UK delivery.'
  },
  'stretched-canvas-wall-art-uk-guide': {
    title: 'Gallery Stretched Canvas Wall Art UK (24×16 in) Guide',
    desc: 'Explore our UK styling guide for 24×16 inch gallery-wrapped canvas prints: 400gsm cotton-poly blend on 1.25 inch European pine frames with free UK shipping.'
  },
  'double-sided-square-cushion-covers-uk-guide': {
    title: 'Double-Sided Cushion Covers UK (40×40cm) Styling Guide',
    desc: 'Interior styling guide for 40×40cm double-sided faux-suede cushion covers in the UK: vibrant colourfast prints, concealed zips and free tracked delivery.'
  },
  'plush-coral-fleece-throw-blankets-uk-guide': {
    title: 'Plush Coral Fleece Throw Blankets UK (50×60 in) Guide',
    desc: 'UK home guide for 50×60 inch ultra-soft coral fleece throw blankets: lightweight warmth, hypoallergenic microfiber and machine washable with free delivery.'
  },
  'luxury-memory-foam-bath-mats-uk-guide': {
    title: 'Luxury Memory Foam Bath Mats UK (61×43cm) Bathroom Guide',
    desc: 'UK bathroom decor guide for 61×43cm memory foam bath mats: quick-dry microfiber surface, high-density foam cushioning and non-slip rubber safety backing.'
  },
  'cyberpunk-sci-fi-desk-mats-wall-art-uk': {
    title: 'Cyberpunk & Sci-Fi Desk Mats & Wall Art UK Setup Guide',
    desc: 'UK guide to sci-fi, synthwave and neon cyberpunk desk mats and matching canvas wall art: high-contrast aesthetic workspace decor with free UK shipping.'
  },
  'japanese-ukiyo-e-anime-desk-mats-wall-art-uk': {
    title: 'Japanese Ukiyo-e & Anime Desk Mats & Canvas Art UK Guide',
    desc: 'UK styling guide for Japanese anime, Great Wave ukiyo-e and samurai XXL desk mats and canvas prints: premium archival print craft with free UK delivery.'
  },
  'space-cosmic-nebula-desk-mats-wall-art-uk': {
    title: 'Space & Cosmic Nebula Desk Mats & Canvas Wall Art UK',
    desc: 'UK astronomy guide for deep space, cosmic nebula and celestial desk mats and canvas prints: high-resolution astrophotography art with free UK delivery.'
  },
  'fantasy-mythology-gothic-desk-mats-wall-art-uk': {
    title: 'Fantasy & Gothic Desk Mats & Canvas Wall Art UK Guide',
    desc: 'UK decor guide for dark fantasy, dragon, mythology and gothic aesthetic desk mats, fleece throws and framed canvas wall art with free tracked UK shipping.'
  },
  'botanical-floral-nature-wall-art-cushions-uk': {
    title: 'Botanical & Floral Canvas Wall Art & Cushions UK Guide',
    desc: 'UK interior guide for botanical, forest landscape and floral canvas prints, velvet cushion covers and bath mats: biophilic styling with free UK delivery.'
  },
  'wildlife-animal-art-cushions-blankets-wall-art-uk': {
    title: 'Wildlife & Animal Canvas Art, Cushions & Blankets UK',
    desc: 'Explore UK animal and wildlife art: lion, wolf, stag and bird archival canvas prints, fleece throws and luxury cushion covers with free tracked UK shipping.'
  },
  'abstract-geometric-minimalist-wall-art-decor-uk': {
    title: 'Abstract & Minimalist Canvas Wall Art & Desk Mats UK',
    desc: 'UK styling guide for abstract geometry, Bauhaus minimalist line art canvas prints and XXL desk mats: contemporary home office decor with free UK delivery.'
  },
  'retro-vintage-pop-art-wall-art-desk-mats-uk': {
    title: 'Retro 80s Vaporwave & Pop Art Desk Mats & Wall Art UK',
    desc: 'UK guide to vintage 80s vaporwave, arcade and pop art desk mats and stretched canvas prints: nostalgic retro gaming workspace decor with free UK delivery.'
  },
  'world-landmarks-cityscape-travel-wall-art-uk': {
    title: 'World Landmarks & Cityscape Canvas Wall Art UK Guide',
    desc: 'UK interior styling guide for London, Tokyo and Paris cityscape canvas wall art prints and velvet cushion covers: architectural decor with free shipping.'
  },
  'matching-home-office-desk-mat-and-canvas-sets-uk': {
    title: 'Matching Home Office Desk Mat & Canvas Art Sets UK Guide',
    desc: 'UK workspace guide for pairing 80×40cm XXL desk mats with matching 24×16 inch stretched canvas prints: create a cohesive home office with free UK delivery.'
  },
  'living-room-sofa-cushion-throw-blanket-canvas-pairing-uk': {
    title: 'Living Room Cushion, Blanket & Canvas Pairing Guide UK',
    desc: 'UK interior colour pairing guide for matching 40×40cm cushion covers, 50×60 in fleece throw blankets and canvas wall art: style a cohesive modern lounge.'
  },
  'bedroom-sanctuary-throw-blanket-cushion-wall-art-uk': {
    title: 'Bedroom Sanctuary Decor Guide: Throws, Cushions & Art UK',
    desc: 'UK bedroom sanctuary guide: create restful spaces with plush fleece throw blankets, accent cushion covers and calming canvas wall art. Free UK delivery.'
  },
  'modern-uk-bathroom-makeover-memory-foam-bath-mats': {
    title: 'Modern UK Bathroom Makeover: Memory Foam Bath Mats Guide',
    desc: 'UK modern bathroom guide: upgrade your space with luxury non-slip memory foam bath mats, coordinated colour palettes and spa styling with free delivery.'
  },
  'gaming-room-pc-setup-lighting-desk-mat-wall-art-uk': {
    title: 'UK Gaming Room PC Setup Guide: XXL Desk Mats & Wall Art',
    desc: 'UK battlestation guide for gaming PC setups: pairing RGB ambient lighting with XXL stitched desk mats, canvas wall art and warm fleece throw blankets.'
  },
  'home-decor-desk-mat-care-washing-maintenance-guide-uk': {
    title: 'UK Desk Mat & Home Decor Washing & Care Guide | PWP',
    desc: 'Complete UK care and washing guide: clean 4mm stitched desk mats, machine wash fleece throws, refresh velvet cushions and maintain memory foam bath mats.'
  },
  'vip-loyalty-program': {
    title: 'Prints With Passion VIP Loyalty Program | Studio Club',
    desc: 'Join the Prints With Passion VIP Club: unlock exclusive collector discounts, early access to new art drops and loyalty rewards with free tracked UK shipping.'
  },
  'us-shipping-and-sizing-guide': {
    title: 'US Shipping, Local Fulfillment & Imperial Sizing Guide',
    desc: 'USA buyer guide: local USA print fulfillment, rapid courier delivery and imperial size conversions (inches) for canvas wall art prints and XXL desk mats.'
  },
  'ai-catalog-directory': {
    title: 'Studio Catalog, Sizing & AI Discovery Index | PWP',
    desc: 'Browse the Prints With Passion AI discovery index: 48 thematic collections of framed canvas prints, XXL gaming desk mats, cushions and home accessories.'
  },
  'studio-lookbook-social-feed': {
    title: 'Studio Lookbook, Room Inspiration & Pinterest Feed Hub',
    desc: 'Explore the Prints With Passion studio lookbook: curated workspace inspiration, customer styling photos and trending Pinterest aesthetic gallery ideas.'
  },
  'desk-setup-hardware-compatibility-guide': {
    title: 'Desk Mat Hardware Compatibility Guide (IKEA & Secretlab)',
    desc: 'UK hardware sizing guide for IKEA Karlby, Secretlab Magnus and Keychron setups: calculate exact desk clearances for XXL desk mats and mechanical boards.'
  },
  'studio-quality-vs-generic-prints': {
    title: 'Studio Quality vs Generic 2mm Mats & Rolled Prints Guide',
    desc: 'Full specification guide comparing Prints With Passion 4mm stitched desk mats and 1.25 in pine canvas prints against generic 2mm pads and rolled posters.'
  },
  'trade-and-bulk-orders': {
    title: 'B2B Trade & Bulk Orders (15%–35% Off) | Prints With Passion',
    desc: 'B2B commercial trade program for interior stagers, corporate workspaces, hotels and esports lounges: volume discounts up to 35% with free UK delivery.'
  }
};

const specList = [];

for (const p of pages) {
  const m = metadataMap[p.handle];
  if (!m) {
    throw new Error(`Missing metadata for handle: ${p.handle}`);
  }

  const h1Regex = /<h1(\b[^>]*)>([\s\S]*?)<\/h1>/gi;
  const h1Matches = [];
  const h1Replacements = [];
  let match;
  while ((match = h1Regex.exec(p.body || '')) !== null) {
    h1Matches.push(match[0]);
    // Demote to h2 and replace &amp; with & in content
    const sanitizedInner = match[2].replace(/&amp;/g, '&');
    h1Replacements.push(`<h2${match[1]}>${sanitizedInner}</h2>`);
  }

  const ampMatches = p.body ? (p.body.match(/&amp;/g) || []) : [];

  const needsH1Demotion = h1Matches.length > 0;
  const needsAmpSanitization = ampMatches.length > 0;
  const isContactPage = p.handle === 'contact-us';

  specList.push({
    page_id: p.id,
    handle: p.handle,
    current_title: p.title,
    proposed_seo_title: m.title,
    proposed_seo_title_length: m.title.length,
    proposed_seo_description: m.desc,
    proposed_seo_description_length: m.desc.length,
    has_inner_h1: needsH1Demotion,
    inner_h1_count: h1Matches.length,
    inner_h1_matches: h1Matches,
    inner_h1_replacements: h1Replacements,
    has_amp_entity_in_body: needsAmpSanitization,
    amp_entity_count_in_body: ampMatches.length,
    body_transform_required: needsH1Demotion || needsAmpSanitization,
    email_typo_fix_required: isContactPage,
    current_metafield_title_tag: p.titleTag?.value || null,
    current_metafield_description_tag: p.descTag?.value || null,
    metafields_to_set: [
      {
        namespace: 'global',
        key: 'title_tag',
        value: m.title,
        type: 'string'
      },
      {
        namespace: 'global',
        key: 'description_tag',
        value: m.desc,
        type: 'string'
      }
    ]
  });
}

const specOutput = {
  metadata: {
    generated_at: new Date().toISOString(),
    total_pages: specList.length,
    pages_requiring_h1_demotion: specList.filter(s => s.has_inner_h1).length,
    total_inner_h1s_to_demote: specList.reduce((acc, s) => acc + s.inner_h1_count, 0),
    pages_requiring_amp_sanitization: specList.filter(s => s.has_amp_entity_in_body).length,
    total_amp_entities_to_sanitize: specList.reduce((acc, s) => acc + s.amp_entity_count_in_body, 0),
    pages_requiring_body_transform: specList.filter(s => s.body_transform_required).length,
    pages_requiring_email_typo_fix: specList.filter(s => s.email_typo_fix_required).length,
    rules: {
      seo_title_max_chars: 60,
      seo_description_min_chars: 145,
      seo_description_max_chars: 158,
      single_h1_storefront_render_rule: 'Shopify template renders <h1>{{ page.title }}</h1>; inner <h1> tags in page.body demoted to <h2>.',
      amp_sanitization_rule: 'Replace literal &amp; with & in page.body and meta tags; leave valid HTML tags intact.',
      contact_us_email_fix: 'DescTag printswithpasssionbc@gmail.com corrected to printswithpassionbc@gmail.com.'
    }
  },
  pages: specList
};

const outputPath = 'C:/Users/Benjamin/.gemini/antigravity/scratch/pwp-seo-blog-engine/.agents/teamwork/teamwork_explorer_m4_1/page_remediation_spec.json';
fs.writeFileSync(outputPath, JSON.stringify(specOutput, null, 2), 'utf8');

console.log(`Successfully generated ${outputPath}`);
console.log(`Summary:`);
console.log(`  Total pages: ${specOutput.metadata.total_pages}`);
console.log(`  Pages with inner H1 to demote: ${specOutput.metadata.pages_requiring_h1_demotion}`);
console.log(`  Total inner H1s: ${specOutput.metadata.total_inner_h1s_to_demote}`);
console.log(`  Pages with &amp; to sanitize: ${specOutput.metadata.pages_requiring_amp_sanitization}`);
console.log(`  Total &amp; entities: ${specOutput.metadata.total_amp_entities_to_sanitize}`);
console.log(`  Pages requiring body update: ${specOutput.metadata.pages_requiring_body_transform}`);
