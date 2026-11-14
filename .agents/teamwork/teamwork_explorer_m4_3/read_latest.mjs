import fs from 'fs';

const data = JSON.parse(fs.readFileSync('C:\\Users\\Benjamin\\.gemini\\antigravity\\brain\\07bfb7d6-9234-4f9d-b17c-a75686424c5d\\scratch\\latest_gsc_update_20261109.json', 'utf8'));

console.log('Keys in latest_gsc_update_20261109.json:', Object.keys(data));
for (const k of Object.keys(data)) {
  if (Array.isArray(data[k])) {
    console.log(`${k}: Array(${data[k].length})`);
  } else if (typeof data[k] === 'object' && data[k] !== null) {
    console.log(`${k}: Object(${Object.keys(data[k]).length})`);
  } else {
    console.log(`${k}:`, data[k]);
  }
}
