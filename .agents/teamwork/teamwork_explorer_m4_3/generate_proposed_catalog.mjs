import fs from 'fs';

const currentHtml = fs.readFileSync('./.agents/teamwork/teamwork_explorer_m4_3/current_catalog_body.html', 'utf8');

// 1. Demote inner H1 to H2
let newHtml = currentHtml.replace(
  /<h1 style="font-size:32px;line-height:1.25;margin:0 0 16px;">UK Home Decor, Extended Desk Mat &amp; Stretched Canvas Wall Art Catalog Directory<\/h1>/i,
  '<h2 style="font-size:28px;line-height:1.3;margin:0 0 16px;font-weight:700;color:#111827;">UK Home Decor, Extended Desk Mat & Stretched Canvas Wall Art Catalog Directory</h2>'
);

// 2. Clean up &amp; in headings
newHtml = newHtml.replace(/Core Storefront Collections &amp; Live Atom\/RSS Product Feeds/g, 'Core Storefront Collections & Live Atom/RSS Product Feeds');
newHtml = newHtml.replace(/20 Curated UK Category, Theme &amp; Room Styling Guides/g, '20 Curated UK Category, Theme & Room Styling Guides');
newHtml = newHtml.replace(/Interactive UK Sizing Tools &amp; Free Creative Commons Resources/g, 'Interactive UK Sizing Tools & Free Creative Commons Resources');

// 3. Expand Section 3 to include full interactive tools, and add Section 4 and Section 5 before closing </div>
const additionalSections = `
  <h2 style="font-size:24px;margin:32px 0 16px;">3. Studio Specifications, Hardware Compatibility &amp; B2B Trade Guides</h2>
  <ul style="margin-bottom:32px;line-height:1.75;font-size:15px;color:#374151;">
    <li style="margin-bottom:8px;">
      <a href="/pages/size-guide"><strong>Studio Size Guide (Dual Metric CM &amp; Imperial Inches)</strong></a> — Complete conversion dimensions for 40x40cm/45x45cm cushions, 80x40cm/90x40cm desk mats, 24x16"/30x20" canvas, and 50x60"/60x80" fleece throws.
    </li>
    <li style="margin-bottom:8px;">
      <a href="/pages/us-shipping-and-sizing-guide"><strong>US Shipping, Local USA Print Fulfillment &amp; Imperial Sizing Guide</strong></a> — Complete guide for North American collectors with localized imperial dimensions and US production fulfillment specs.
    </li>
    <li style="margin-bottom:8px;">
      <a href="/pages/desk-setup-hardware-compatibility-guide"><strong>Desk Mat &amp; Wall Art Hardware Compatibility Guide</strong></a> — Precise clearance and acoustic specs for IKEA Karlby, Secretlab Magnus, Keychron, Wooting &amp; Ultrawide display setups.
    </li>
    <li style="margin-bottom:8px;">
      <a href="/pages/studio-quality-vs-generic-prints"><strong>Prints With Passion Studio Standard vs. Generic 2mm Pads &amp; Rolled Posters</strong></a> — Direct technical comparison of 4mm non-slip rubber, 1.25" European pine frames, and archival inks vs mass-market alternatives.
    </li>
    <li style="margin-bottom:8px;">
      <a href="/pages/trade-and-bulk-orders"><strong>B2B Corporate Workspaces, Interior Staging &amp; Bulk Trade Orders</strong></a> — Commercial architectural staging, corporate gifting, and tiered trade discounts (15%–35% off) for UK interior designers.
    </li>
  </ul>

  <h2 style="font-size:24px;margin:32px 0 16px;">4. Studio Discovery, Lookbooks &amp; VIP Member Vault</h2>
  <ul style="margin-bottom:32px;line-height:1.75;font-size:15px;color:#374151;">
    <li style="margin-bottom:8px;">
      <a href="/pages/studio-lookbook-social-feed"><strong>Studio Lookbook, Room Inspiration &amp; Pinterest Feed Hub</strong></a> — Visual gallery of real customer living rooms, bedroom sanctuaries, and gaming desk battlestations styled with Prints With Passion.
    </li>
    <li style="margin-bottom:8px;">
      <a href="/pages/ai-catalog-directory"><strong>Studio Catalog, Sizing &amp; AI Discovery Index (50 Curated Collections)</strong></a> — Machine-readable semantic catalog index and AI shopping assistant exploration directory.
    </li>
    <li style="margin-bottom:8px;">
      <a href="/pages/vip-loyalty-program"><strong>Prints With Passion VIP — Official Loyalty Program</strong></a> — Club member access, early-access limited edition drop reservations, and exclusive rewards.
    </li>
    <li style="margin-bottom:8px;">
      <a href="/pages/desk-size-visualizer"><strong>Interactive UK Desk Mat, Canvas Wall Art &amp; Throw Blanket Size Visualizer</strong></a> — Compare 80x40cm &amp; 90x40cm mats on IKEA desks and preview canvas dimensions over UK beds and sofas.
    </li>
    <li style="margin-bottom:8px;">
      <a href="/pages/free-4k-wallpapers"><strong>Free 4K Desktop &amp; Ultrawide Wallpaper Vault (CC BY 4.0)</strong></a> — High-resolution digital wallpapers matching best-selling canvas art prints and gaming desk mats.
    </li>
  </ul>

  <h2 style="font-size:24px;margin:32px 0 16px;">5. Studio Brand, Customer Support &amp; Compliance Directory</h2>
  <ul style="margin-bottom:32px;line-height:1.75;font-size:15px;color:#374151;">
    <li style="margin-bottom:8px;">
      <a href="/pages/about-us"><strong>About Prints With Passion</strong></a> — Our design philosophy, archival printing standards, museum-grade pigment inks, and ethical UK craftsmanship.
    </li>
    <li style="margin-bottom:8px;">
      <a href="/pages/contact-us"><strong>Contact Our UK Studio Team</strong></a> — Customer support, order inquiries, custom dimensions, and trade consultation channels.
    </li>
    <li style="margin-bottom:8px;">
      <a href="/pages/delivery-return"><strong>UK Tracked Delivery &amp; 30-Day Hassle-Free Returns</strong></a> — Shipping timeframes, zero-cost delivery policies (£0.00), and straightforward return instructions.
    </li>
    <li style="margin-bottom:8px;">
      <a href="/pages/privacy-policy"><strong>Privacy Policy &amp; Data Protection</strong></a> — GDPR-compliant data processing, customer privacy protection, and transparent checkout security.
    </li>
    <li style="margin-bottom:8px;">
      <a href="/pages/data-sharing-opt-out"><strong>Your Privacy Choices &amp; Data Sharing Preferences</strong></a> — Customer data sharing controls, cookie management, and privacy preference settings.
    </li>
    <li style="margin-bottom:8px;">
      <a href="/sitemap.xml"><strong>XML Sitemap Index (/sitemap.xml)</strong></a> — Real-time index of all active product, collection, and editorial sitemaps.
    </li>
  </ul>
</div>
`;

// Replace existing section 3 with the expanded sections 3, 4, and 5
const section3Index = newHtml.indexOf('<h2 style="font-size:24px;margin:32px 0 16px;">3. Interactive UK Sizing Tools');
if (section3Index !== -1) {
  newHtml = newHtml.slice(0, section3Index) + additionalSections.trim();
}

fs.writeFileSync('./.agents/teamwork/teamwork_explorer_m4_3/proposed_uk_product_catalog.html', newHtml);
console.log('Successfully wrote proposed_uk_product_catalog.html (Length:', newHtml.length, ')');
