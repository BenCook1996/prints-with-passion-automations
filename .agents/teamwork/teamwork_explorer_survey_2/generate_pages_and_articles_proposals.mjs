import fs from 'fs';
import path from 'path';

const auditedPages = JSON.parse(fs.readFileSync(
  path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_survey_2/audited_pages.json'),
  'utf8'
));
const auditedArticles = JSON.parse(fs.readFileSync(
  path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_survey_2/audited_articles.json'),
  'utf8'
));

function fit(str, max = 60) {
  str = str.replace(/\s+/g, ' ').trim();
  if (str.length <= max) return str;
  const cut = str.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[,/& -]+$/, '');
}

console.log(`Generating fitted SEO metadata for ${auditedPages.length} Pages...`);
const pageProposals = auditedPages.map(p => {
  let title = '';
  let desc = '';

  if (p.handle === 'contact-us') {
    title = 'Contact Prints With Passion | UK Customer Care Support';
    desc = 'Contact Prints With Passion UK customer care team for order inquiries, bespoke sizing & delivery tracking. Free tracked UK delivery on all art and decor.';
  } else if (p.handle === 'size-guide') {
    title = 'Official Size Guide (CM & Inches) | Prints With Passion';
    desc = 'Complete UK and USA size guide for framed canvas prints, XXL desk mats, cushion covers, throw blankets & bath mats in both metric (cm) and imperial (inches).';
  } else if (p.handle === 'privacy-policy') {
    title = 'Privacy Policy & Data Security | Prints With Passion';
    desc = 'Read the Prints With Passion privacy policy and data security standards. Learn how we protect your personal information, cookies and transactional privacy.';
  } else if (p.handle === 'data-sharing-opt-out') {
    title = 'Your Privacy Choices & Opt-Out | Prints With Passion';
    desc = 'Manage your privacy choices, cookie preferences and personal data sharing opt-out options in compliance with UK GDPR and international privacy legislation.';
  } else if (p.handle === 'about-us') {
    title = 'About Prints With Passion | UK Archival Art & Decor Studio';
    desc = 'Discover Prints With Passion: our independent UK print studio dedicated to archival framed canvas wall art, 4mm XXL desk mats and bespoke home decor.';
  } else if (p.handle === 'delivery-return') {
    title = 'Delivery & Returns Policy | 100% Free UK Tracked Shipping';
    desc = 'Learn about our delivery and returns policy: 100% free Royal Mail tracked shipping across the UK, 30-day guarantee and secure protective studio packaging.';
  } else if (p.handle === 'desk-size-visualizer') {
    title = 'UK Desk Mat & Wall Art Size Visualizer | CM & Inches';
    desc = 'Interactive sizing visualizer: preview 60×35cm, 80×40cm & 90×40cm XXL desk mats, mechanical keyboards and framed canvas prints across popular UK desk setups.';
  } else if (p.handle === 'free-4k-wallpapers') {
    title = 'Free 4K Desktop & Setup Wallpapers | Prints With Passion';
    desc = 'Download free 4K ultra-high-definition desktop and dual-monitor wallpapers matching our archival canvas prints and XXL desk mats. Licensed CC-BY 4.0.';
  } else if (p.handle === 'uk-product-catalog') {
    title = 'UK Catalog Directory: Wall Art, Desk Mats & Home Decor';
    desc = 'Explore the complete Prints With Passion UK catalog directory: 48 studio collections of framed canvas wall art, XXL desk mats, cushions and fleece throws.';
  } else {
    // Guide pages
    const cleanPTitle = p.title
      .replace(/ UK \(.*?\):/g, ' UK:')
      .replace(/ \(.*?\)/g, '')
      .replace(/ Guide UK/g, ' UK Guide')
      .replace(/ &amp; /g, ' & ')
      .trim();

    title = fit(`${cleanPTitle} | PWP`);
    if (title.length > 60) {
      title = fit(cleanPTitle, 60);
    }

    desc = `Expert UK guide: ${cleanPTitle.slice(0, 75)}. Spec comparisons, metric sizing charts, styling ideas and free tracked UK delivery on all orders.`;
    if (desc.length < 145) {
      desc = `Comprehensive UK guide: ${cleanPTitle.slice(0, 75)}. Interior styling advice, exact metric sizing formulas and free tracked UK delivery on all orders.`;
    }
    if (desc.length > 158) {
      desc = desc.slice(0, 157).replace(/\s+\S*$/, '') + '.';
    }
  }

  return {
    handle: p.handle,
    id: p.id,
    currentTitle: p.title,
    proposedTitle: title,
    proposedTitleLen: title.length,
    proposedDesc: desc,
    proposedDescLen: desc.length,
    needsH1Fix: p.innerH1Count > 0,
    needsAmpFix: p.hasAmpInBody || p.hasAmpInTitle
  };
});

fs.writeFileSync(
  path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_survey_2/page_seo_proposals.json'),
  JSON.stringify(pageProposals, null, 2)
);

const pageOver60 = pageProposals.filter(p => p.proposedTitleLen > 60);
const pageDescOut = pageProposals.filter(p => p.proposedDescLen < 145 || p.proposedDescLen > 158);
console.log(`Page titles > 60: ${pageOver60.length}`);
console.log(`Page desc out of 145-158: ${pageDescOut.length}`);

console.log(`\nGenerating fitted SEO metadata for ${auditedArticles.length} Articles...`);
const articleProposals = auditedArticles.map(a => {
  let title = '';
  let desc = '';

  const cleanATitle = a.title
    .replace(/ \(2026.*?\)/g, '')
    .replace(/ &amp; /g, ' & ')
    .trim();

  title = fit(`${cleanATitle} | Prints With Passion`);
  if (title.length > 60) {
    title = fit(cleanATitle, 60);
  }

  desc = `Read our UK guide: ${cleanATitle.slice(0, 80)}. Expert styling tips, hardware specs, metric dimensions and free tracked UK delivery on studio decor.`;
  if (desc.length < 145) {
    desc = `Read our complete UK guide: ${cleanATitle.slice(0, 80)}. Styling tips, hardware specs, metric dimensions and free tracked UK delivery on all studio decor.`;
  }
  if (desc.length > 158) {
    desc = desc.slice(0, 157).replace(/\s+\S*$/, '') + '.';
  }

  return {
    handle: a.handle,
    id: a.id,
    currentTitle: a.title,
    proposedTitle: title,
    proposedTitleLen: title.length,
    proposedDesc: desc,
    proposedDescLen: desc.length
  };
});

fs.writeFileSync(
  path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_survey_2/article_seo_proposals.json'),
  JSON.stringify(articleProposals, null, 2)
);

const artOver60 = articleProposals.filter(a => a.proposedTitleLen > 60);
const artDescOut = articleProposals.filter(a => a.proposedDescLen < 145 || a.proposedDescLen > 158);
console.log(`Article titles > 60: ${artOver60.length}`);
console.log(`Article desc out of 145-158: ${artDescOut.length}`);
