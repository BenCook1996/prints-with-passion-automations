import fs from 'fs';
import path from 'path';

const audit = JSON.parse(fs.readFileSync(
  path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_survey_2/active_collections_seo_audit.json'),
  'utf8'
));

function fitTitle(candidate, max = 60) {
  let t = candidate.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  // Try shortening pipe sections
  const parts = t.split('|').map(p => p.trim());
  if (parts.length > 2) {
    const twoPart = `${parts[0]} | ${parts[1]}`;
    if (twoPart.length <= max) return twoPart;
  }
  // Shorten first part at word boundary
  let primary = parts[0];
  const suffix = parts.length > 1 ? ` | ${parts[parts.length - 1]}` : '';
  const allowed = max - suffix.length;
  if (allowed > 10 && primary.length > allowed) {
    const cut = primary.slice(0, allowed);
    const lastSpace = cut.lastIndexOf(' ');
    primary = (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[,/& -]+$/, '');
    return `${primary}${suffix}`;
  }
  const cut = t.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[,/& -]+$/, '');
}

function fitDesc(mainClause, featureClause, min = 140, max = 158) {
  const ending = ' Free tracked UK delivery.';
  let target = `${mainClause.trim()} ${featureClause.trim()}${ending}`;
  target = target.replace(/\s+/g, ' ').replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim();
  
  if (target.length >= min && target.length <= max) return target;

  if (target.length > max) {
    const budgetForFeature = max - mainClause.length - ending.length - 2;
    if (budgetForFeature > 15) {
      let cut = featureClause.slice(0, budgetForFeature);
      const lastSpace = cut.lastIndexOf(' ');
      cut = (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[,/& -]+$/, '');
      target = `${mainClause.trim()} ${cut}.${ending}`.replace(/\s+/g, ' ').trim();
      if (target.length >= min && target.length <= max) return target;
    }
  }

  // Fallback template tuned for exact 145-155 length
  let base = `${mainClause.trim()}.`;
  if (base.length + ending.length > max) {
    base = base.slice(0, max - ending.length - 1).replace(/\s+\S*$/, '') + '.';
  }
  target = `${base}${ending}`.replace(/\s+/g, ' ').trim();
  if (target.length < min) {
    const filler = ' Archival quality prints for modern interiors.';
    if (target.length + filler.length <= max) {
      target = `${base}${filler}${ending}`.replace(/\s+/g, ' ').trim();
    }
  }
  return target;
}

const proposals = [];
for (const c of audit) {
  if (c.handle === 'avada-upsell-best-sellers') {
    proposals.push({
      handle: c.handle,
      id: c.id,
      action: 'UNPUBLISH_FROM_ONLINE_STORE',
      notes: 'Unpublish from Online Store publication gid://shopify/Publication/124388507959 so it exits sitemap_collections_1.xml'
    });
    continue;
  }

  let title = '';
  let mainClause = '';
  let featureClause = '';

  if (c.handle === 'frontpage') {
    title = 'Canvas Wall Art, XXL Desk Mats & Home Decor | Prints With Passion';
    if (title.length > 60) title = 'Canvas Wall Art, XXL Desk Mats & Decor | Prints With Passion';
    mainClause = 'Shop archival framed canvas wall art (1.25" pine), 4mm XXL stitched desk mats, velvet cushions & plush throws';
    featureClause = 'for modern UK homes.';
  } else if (c.handle === 'canvas-prints' || c.handle === 'wall-art') {
    title = 'Framed Canvas Wall Art | Archival Prints | PWP Studio';
    mainClause = 'Shop archival canvas wall art printed on 400gsm cotton-poly canvas with 1.25" pine stretcher bars';
    featureClause = 'and vivid fade-resistant inks.';
  } else if (c.handle === 'desk-mats' || c.handle === 'stationary-office') {
    title = 'XXL Gaming Desk Mats & Large Mouse Pads | 4mm Stitched';
    mainClause = 'Precision XXL gaming desk mats engineered with 4mm non-slip rubber, 360° anti-fray stitched borders';
    featureClause = '& smooth glide cloth.';
  } else if (c.handle === 'pillow-cases') {
    title = 'Velvet Cushion Covers 45×45cm | Double-Sided Pillows';
    mainClause = 'Double-sided 45×45cm (18×18") velvet cushion covers with concealed zippers and vibrant gallery prints';
    featureClause = 'for sofas and beds.';
  } else if (c.handle === 'blankets' || c.handle === 'plush-blankets') {
    title = 'Plush Throw Blankets | 300 GSM Fleece Throws | PWP';
    mainClause = 'Ultra-soft 300 GSM plush coral fleece throw blankets available in 50×60" and 60×80" bed sizes';
    featureClause = 'for living room comfort.';
  } else if (c.handle === 'bath-mats') {
    title = 'Non-Slip Memory Foam Bath Mats | Fast-Drying Rugs';
    mainClause = 'High-density non-slip memory foam bath mats topped with ultra-absorbent microfibre fleece';
    featureClause = 'in modern UK sizes.';
  } else if (c.handle === 'apparel' || c.handle === 't-shirts' || c.handle === 'clothing') {
    title = 'Graphic T-Shirts & Studio Apparel | Prints With Passion';
    mainClause = 'Heavyweight 100% combed cotton graphic t-shirts and streetwear apparel featuring high-res DTG prints';
    featureClause = 'and durable hems.';
  } else if (c.handle === 'hoodies') {
    title = 'Graphic Hoodies | Heavyweight 310 GSM Fleece | PWP';
    mainClause = 'Heavyweight 310 GSM fleece graphic hoodies featuring double-lined hoods, pouch pockets and gallery artwork';
    featureClause = 'for cozy warmth.';
  } else if (c.handle === 'home-living' || c.handle === 'all-products') {
    title = 'Home Decor, Cushions, Blankets & Mats | Prints With Passion';
    mainClause = 'Discover premium home decor including 4mm XXL gaming desk mats, framed canvas art, velvet cushions & fleece throws';
    featureClause = 'for modern spaces.';
  } else if (c.handle === 'japanese-anime-desk-mats') {
    title = 'Japanese Anime & Ukiyo-e Desk Mats | 4mm XXL Gaming Pads';
    mainClause = 'Japanese anime, samurai, sakura and Great Wave XXL gaming desk mats with 4mm non-slip rubber and stitched borders';
    featureClause = 'for clean desk setups.';
  } else if (c.handle === 'abstract-minimalist-bauhaus-canvas-wall-art') {
    title = 'Bauhaus & Minimalist Canvas Wall Art | 1.25" Framed Prints';
    mainClause = 'Abstract, minimalist and Bauhaus geometric canvas wall art on 400gsm cotton-poly canvas over 1.25" pine frames';
    featureClause = 'for calm interiors.';
  } else {
    const rawTheme = c.title
      .replace(/ Collection$/i, '')
      .replace(/ Canvas Wall Art$/i, '')
      .replace(/ Extended Desk Mats$/i, '')
      .replace(/ XXL Gaming Desk Mats$/i, '')
      .replace(/ Desk Mats$/i, '')
      .replace(/ Square Cushion Covers$/i, '')
      .replace(/ Cushion Covers$/i, '')
      .replace(/ Plush Throw Blankets$/i, '')
      .replace(/ Throw Blankets$/i, '')
      .replace(/ Memory Foam Bath Mats$/i, '')
      .replace(/ Bath Mats$/i, '')
      .replace(/ Graphic Cotton T-Shirts$/i, '')
      .replace(/ Heavyweight Hoodies$/i, '')
      .trim();

    // Shorten long theme names
    const theme = rawTheme
      .replace(/, Landscapes & Botanical/g, ' & Landscape')
      .replace(/, Cyberpunk & Neon Futuristic/g, ' & Cyberpunk')
      .replace(/, Galaxy, Nebula & Celestial/g, ' & Galaxy')
      .replace(/, Wildlife & Pet Portrait/g, ' & Wildlife')
      .replace(/, Minimalist & Bauhaus Geometric/g, ' & Minimalist')
      .replace(/, Mythology, Dragons & Dark Academia/g, ' & Mythology')
      .replace(/, City Skylines & Architectural/g, ' & City')
      .replace(/, 80s Synthwave & Vintage Poster/g, ' & Vintage')
      .replace(/ Ukiyo-e, Samurai, Sakura & Zen/g, ' & Samurai')
      .replace(/, Alpine Mountain & Forest Landscape/g, ' Mountain')
      .replace(/, Abstract, Bauhaus & Topographic/g, ' & Abstract')
      .replace(/, Wildlife, Cats & Dogs/g, ' & Pets')
      .replace(/, 80s Vaporwave & Vintage Arcade Gaming/g, ' Synthwave')
      .replace(/, Alpine Mountain & Scenic Landscape/g, ' Landscape')
      .replace(/, Floral Garden & Coastal/g, ' & Floral')
      .replace(/, Samurai & Sakura Blossom/g, ' Samurai')
      .replace(/, Wildlife, Highland Cow & Pet Portrait/g, ' & Highland Cow')
      .replace(/, Deep-Field Nebula & Celestial/g, ' Nebula')
      .replace(/, Cyberpunk & Neon Futuristic/g, ' Cyberpunk')
      .replace(/, Vintage Floral & Nature/g, ' & Botanical')
      .replace(/, Geometric, Bauhaus & Mid-Century/g, ' Geometric')
      .replace(/, Woodland Wildlife & Pet Portrait/g, ' Wildlife')
      .replace(/, Moon Phase & Cosmic Galaxy/g, ' Galaxy')
      .replace(/, Dark Academia, Mythology & Gothic/g, ' & Gothic')
      .replace(/, Koi, Sakura & Zen Accent/g, ' Wave & Koi')
      .replace(/, Coastal Villa & European City/g, ' Coastal')
      .replace(/, Vintage Poster & Mid-Century Pop/g, ' Pop Art')
      .replace(/, Alpine Cabin, Forest & Scenic/g, ' Mountain')
      .replace(/, Boho Kilim, Tartan & Geometric/g, ' Geometric')
      .replace(/, Starry Night, Constellation & Galaxy/g, ' Galaxy')
      .replace(/, Cats, Dogs & Woodland/g, ' & Pets')
      .replace(/, Celestial Tarot & Mythic/g, ' & Mythic')
      .replace(/, Cyberpunk & Neon Gaming Room/g, ' Gamer')
      .replace(/, Paris Sunset & Cityscape/g, ' Cityscape')
      .replace(/, Great Wave & Oriental/g, ' Great Wave')
      .replace(/, Tropical Leaf & Nature/g, ' Coastal')
      .replace(/, Abstract Terrazzo & Geometric/g, ' Abstract')
      .replace(/, Whimsical Cat, Frog & Wildlife/g, ' Wildlife')
      .replace(/, Starry Night & Cosmic/g, ' Moon')
      .replace(/, Celestial Moth, Gothic & Enchanted/g, ' Gothic')
      .replace(/, Neon Cyberpunk & Futuristic/g, ' Cyberpunk')
      .replace(/, Great Wave & Zen Sanctuary/g, ' Zen')
      .replace(/, Checkerboard & Vintage/g, ' 70s Retro');

    if (c.handle.includes('desk-mats')) {
      title = fitTitle(`${theme} XXL Desk Mats | 4mm Gaming Pads`);
      mainClause = `Shop ${theme} XXL gaming desk mats featuring 4mm high-density non-slip rubber, stitched borders`;
      featureClause = `and smooth glide micro-woven cloth`;
    } else if (c.handle.includes('canvas-wall-art') || c.handle.includes('canvas-prints')) {
      title = fitTitle(`${theme} Canvas Wall Art | 1.25" Framed Prints`);
      mainClause = `Archival ${theme} framed canvas wall art printed on 400gsm cotton-poly canvas with 1.25" pine bars`;
      featureClause = `for contemporary interior spaces`;
    } else if (c.handle.includes('cushion-covers')) {
      title = fitTitle(`${theme} Cushion Covers | 45×45cm Velvet`);
      mainClause = `Double-sided ${theme} velvet cushion covers (45×45cm / 18×18") with concealed zipper and gallery prints`;
      featureClause = `to elevate sofas and beds`;
    } else if (c.handle.includes('throw-blankets') || c.handle.includes('blankets')) {
      title = fitTitle(`${theme} Throw Blankets | 300 GSM Fleece`);
      mainClause = `Cozy ${theme} plush coral fleece throw blankets (300 GSM) in 50×60" and 60×80" bed sizes`;
      featureClause = `for warm living room lounging`;
    } else if (c.handle.includes('bath-mats')) {
      title = fitTitle(`${theme} Bath Mats | Non-Slip Memory Foam`);
      mainClause = `Non-slip ${theme} memory foam bath mats with absorbent microfibre fleece top and durable anti-skid rubber`;
      featureClause = `for modern UK bathrooms`;
    } else if (c.handle.includes('hoodies')) {
      title = fitTitle(`${theme} Graphic Hoodies | 310 GSM Fleece`);
      mainClause = `Heavyweight 310 GSM ${theme} graphic fleece hoodies with double-lined hood, ribbed cuffs and DTG studio artwork`;
      featureClause = `for relaxed warmth`;
    } else if (c.handle.includes('t-shirts')) {
      title = fitTitle(`${theme} Graphic T-Shirts | Cotton Tees`);
      mainClause = `Premium 100% combed cotton ${theme} graphic t-shirts with durable double-needle stitching and crisp DTG prints`;
      featureClause = `for everyday comfort`;
    } else {
      title = fitTitle(`${theme} Wall Art & Home Decor | Prints With Passion`);
      mainClause = `Explore the ${theme} studio collection: framed pine canvas prints, 4mm XXL desk mats, velvet cushions and throws`;
      featureClause = `for stylish interiors`;
    }
  }

  const desc = fitDesc(mainClause, featureClause, 140, 158);

  proposals.push({
    handle: c.handle,
    id: c.id,
    proposedTitle: title,
    proposedTitleLen: title.length,
    proposedDesc: desc,
    proposedDescLen: desc.length
  });
}

fs.writeFileSync(
  path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_survey_2/fitted_collection_proposals.json'),
  JSON.stringify(proposals, null, 2)
);

const over60 = proposals.filter(p => p.proposedTitleLen > 60);
const outOfRange = proposals.filter(p => p.proposedDescLen && (p.proposedDescLen < 140 || p.proposedDescLen > 158));
console.log(`Fitted proposals count: ${proposals.length}`);
console.log(`Over 60 chars titles: ${over60.length}`);
if (over60.length > 0) console.log(over60.map(p => `${p.handle}: ${p.proposedTitle} (${p.proposedTitleLen})`));
console.log(`Out of 140-158 range desc: ${outOfRange.length}`);
if (outOfRange.length > 0) console.log(outOfRange.map(p => `${p.handle}: ${p.proposedDesc} (${p.proposedDescLen})`));
