import fs from 'fs';

const inventory = JSON.parse(fs.readFileSync('C:\\Users\\Benjamin\\.gemini\\antigravity\\scratch\\pwp-seo-blog-engine\\.agents\\teamwork\\teamwork_explorer_m3_2\\combined_inventory.json', 'utf8'));

console.log(`Index | Handle | Title | Count`);
inventory.forEach(item => {
  console.log(`${item.index.toString().padStart(2)} | ${item.handle.padEnd(45)} | ${item.title} | ${item.productsCount}`);
});
