import fs from 'fs';

const data = JSON.parse(fs.readFileSync('C:\\Users\\Benjamin\\.gemini\\antigravity\\brain\\07bfb7d6-9234-4f9d-b17c-a75686424c5d\\scratch\\latest_gsc_update_20261109.json', 'utf8'));

console.log('perf28dPages rows sample:');
if (data.perf28dPages?.rows) {
  console.log(`Total rows: ${data.perf28dPages.rows.length}`);
  data.perf28dPages.rows.slice(0, 30).forEach(r => console.log(r));
}
