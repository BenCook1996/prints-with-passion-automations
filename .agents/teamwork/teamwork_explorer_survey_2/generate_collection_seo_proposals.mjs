import fs from 'fs';
import path from 'path';

const audit = JSON.parse(fs.readFileSync(
  path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_survey_2/active_collections_seo_audit.json'),
  'utf8'
));

function cleanTitle(str) {
  return str.replace(/\s+/g, ' ').trim();
}

function cleanDesc(str) {
  return str
    .replace(/&amp;quot;/g, '"')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

// Generate proposed title and meta description for every active collection
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
  let desc = '';

  // Tailored title generation per handle / substrate
  if (c.handle === 'frontpage') {
    title = 'Canvas Wall Art, XXL Desk Mats & Home Decor | Prints With Passion';
    desc = 'Shop archival framed canvas wall art (1.25" pine bars), 4mm XXL stitched gaming desk mats, velvet cushion covers, plush throw blankets & memory foam bath mats.';
  } else if (c.handle === 'canvas-prints' || c.handle === 'wall-art') {
    title = 'Framed Canvas Wall Art | Archival Prints | Prints With Passion';
    desc = 'Shop archival framed canvas wall art printed on 400gsm cotton-poly canvas over 1.25" kiln-dried European pine stretcher bars. Free tracked UK delivery on all orders.';
  } else if (c.handle === 'desk-mats' || c.handle === 'stationary-office') {
    title = 'XXL Gaming Desk Mats & Extended Mouse Pads | 4mm Stitched Mats';
    desc = 'Precision XXL extended gaming desk mats engineered with 4mm natural rubber, 360° anti-fray stitched edges & micro-woven speed cloth. Free tracked UK delivery.';
  } else if (c.handle === 'pillow-cases') {
    title = 'Velvet Cushion Covers (45×45cm) | Double-Sided Throw Pillows';
    desc = 'Double-sided 45×45cm (18×18") velvet cushion covers with concealed zipper & vibrant gallery prints. Refresh sofas, armchairs & beds. Free tracked UK delivery.';
  } else if (c.handle === 'blankets' || c.handle === 'plush-blankets') {
    title = 'Plush Throw Blankets | 300 GSM Fleece Throws | Prints With Passion';
    desc = 'Ultra-soft 300 GSM plush coral fleece throw blankets available in 50×60" & 60×80". Machine washable warmth for beds & living rooms. Free tracked UK delivery.';
  } else if (c.handle === 'bath-mats') {
    title = 'Non-Slip Memory Foam Bath Mats | Ultra-Absorbent Bathroom Rugs';
    desc = 'High-density memory foam bath mats with non-slip backing and fast-drying microfibre fleece in 60×40cm & 80×50cm sizes. Free tracked UK delivery on every order.';
  } else if (c.handle === 'apparel' || c.handle === 't-shirts' || c.handle === 'clothing') {
    title = 'Graphic T-Shirts & Heavyweight Studio Apparel | Prints With Passion';
    desc = 'Heavyweight 100% combed cotton graphic t-shirts and streetwear apparel with sharp DTG gallery prints and reinforced hems. Free tracked UK delivery on all orders.';
  } else if (c.handle === 'hoodies') {
    title = 'Heavyweight Graphic Hoodies (310 GSM) | Prints With Passion';
    desc = 'Heavyweight 310 GSM fleece graphic hoodies with double-lined hoods, pouch pockets & gallery DTG artwork. Built for comfort. Free tracked UK delivery on all orders.';
  } else if (c.handle === 'home-living' || c.handle === 'all-products') {
    title = 'Home Decor, Cushions, Blankets & Desk Mats | Prints With Passion';
    desc = 'Discover premium home living decor: 4mm XXL gaming desk mats, framed pine canvas wall art, velvet cushion covers & fleece throws. Free tracked UK delivery.';
  } else if (c.handle === 'japanese-anime-desk-mats') {
    title = 'Japanese Anime & Ukiyo-e Desk Mats | 4mm XXL Gaming Pads';
    desc = 'Japanese anime, samurai, sakura blossom & Great Wave XXL gaming desk mats with 4mm non-slip rubber and stitched borders. Free tracked UK delivery on all orders.';
  } else if (c.handle === 'abstract-minimalist-bauhaus-canvas-wall-art') {
    title = 'Bauhaus & Minimalist Canvas Wall Art | 1.25" Framed Prints';
    desc = 'Abstract, minimalist & Bauhaus geometric canvas wall art on 400gsm cotton-poly canvas over 1.25" European pine frames. Free tracked UK delivery on all wall art.';
  } else {
    // Systematic handling of smart sub-collections
    const baseTitle = c.title
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

    if (c.handle.includes('desk-mats')) {
      const candidate = `${baseTitle} XXL Desk Mats | 4mm Gaming Pads`;
      title = candidate.length <= 60 ? candidate : `${baseTitle.slice(0, 32)} XXL Desk Mats | 4mm Pads`;
      desc = `Shop ${baseTitle} extended desk mats engineered with 4mm high-density natural rubber, anti-fray stitched edges & smooth glide cloth. Free tracked UK delivery.`;
    } else if (c.handle.includes('canvas-wall-art') || c.handle.includes('canvas-prints')) {
      const candidate = `${baseTitle} Canvas Wall Art | 1.25" Pine Frames`;
      title = candidate.length <= 60 ? candidate : `${baseTitle.slice(0, 30)} Canvas Wall Art | 1.25" Prints`;
      desc = `Archival ${baseTitle} framed canvas wall art printed on 400gsm cotton-poly canvas with 1.25" kiln-dried pine stretcher bars. Free tracked UK delivery.`;
    } else if (c.handle.includes('cushion-covers')) {
      const candidate = `${baseTitle} Cushion Covers | 45×45cm Velvet`;
      title = candidate.length <= 60 ? candidate : `${baseTitle.slice(0, 33)} Cushion Covers | 45×45cm`;
      desc = `Double-sided ${baseTitle} velvet cushion covers (45×45cm / 18×18") with concealed zipper & vibrant fade-resistant gallery prints. Free tracked UK delivery.`;
    } else if (c.handle.includes('throw-blankets') || c.handle.includes('blankets')) {
      const candidate = `${baseTitle} Throw Blankets | 300 GSM Fleece`;
      title = candidate.length <= 60 ? candidate : `${baseTitle.slice(0, 33)} Throw Blankets | Plush Fleece`;
      desc = `Cozy ${baseTitle} plush coral fleece throw blankets (300 GSM) in 50×60" & 60×80". Machine washable gallery warmth for sofas & beds. Free tracked UK delivery.`;
    } else if (c.handle.includes('bath-mats')) {
      const candidate = `${baseTitle} Bath Mats | Non-Slip Memory Foam`;
      title = candidate.length <= 60 ? candidate : `${baseTitle.slice(0, 33)} Bath Mats | Memory Foam Rugs`;
      desc = `Non-slip ${baseTitle} memory foam bath mats with absorbent microfibre fleece top and durable anti-skid rubber backing. Free tracked UK delivery on all orders.`;
    } else if (c.handle.includes('hoodies')) {
      const candidate = `${baseTitle} Graphic Hoodies | 310 GSM Fleece`;
      title = candidate.length <= 60 ? candidate : `${baseTitle.slice(0, 35)} Graphic Hoodies | Heavyweight`;
      desc = `Heavyweight 310 GSM ${baseTitle} graphic fleece hoodies with double-lined hood, ribbed cuffs & high-definition DTG studio prints. Free tracked UK delivery.`;
    } else if (c.handle.includes('t-shirts')) {
      const candidate = `${baseTitle} Graphic T-Shirts | Heavyweight Cotton`;
      title = candidate.length <= 60 ? candidate : `${baseTitle.slice(0, 33)} Graphic Tees | Cotton T-Shirts`;
      desc = `Premium 100% combed cotton ${baseTitle} graphic t-shirts with durable double-needle stitching and sharp gallery DTG prints. Free tracked UK delivery.`;
    } else {
      const candidate = `${baseTitle} Wall Art & Decor | Prints With Passion`;
      title = candidate.length <= 60 ? candidate : `${baseTitle.slice(0, 35)} Art & Decor | PWP`;
      desc = `Explore the ${baseTitle} studio collection: framed pine canvas prints, 4mm XXL desk mats, velvet cushions & plush throws. Free tracked UK delivery.`;
    }
  }

  // Final length sanity checks
  if (title.length > 60) {
    console.warn(`WARNING: Title > 60 chars for ${c.handle}: "${title}" (${title.length})`);
  }
  if (desc.length < 140 || desc.length > 158) {
    console.warn(`WARNING: Desc length out of 140-158 range for ${c.handle}: (${desc.length}) "${desc}"`);
  }

  proposals.push({
    handle: c.handle,
    id: c.id,
    currentTitle: c.seoTitle,
    proposedTitle: title,
    proposedTitleLen: title.length,
    currentDesc: c.seoDesc,
    proposedDesc: desc,
    proposedDescLen: desc.length
  });
}

fs.writeFileSync(
  path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_survey_2/collection_seo_proposals.json'),
  JSON.stringify(proposals, null, 2)
);

console.log(`Generated proposals for ${proposals.length} collections.`);
const titleOver60 = proposals.filter(p => p.proposedTitleLen > 60);
const descOutOfRange = proposals.filter(p => p.proposedDescLen && (p.proposedDescLen < 140 || p.proposedDescLen > 158));
console.log(`Proposals with title > 60: ${titleOver60.length}`);
console.log(`Proposals with desc out of 140-158 range: ${descOutOfRange.length}`);
