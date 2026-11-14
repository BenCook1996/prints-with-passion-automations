import fs from 'fs';

const data = JSON.parse(fs.readFileSync('C:\\Users\\Benjamin\\.gemini\\antigravity\\brain\\07bfb7d6-9234-4f9d-b17c-a75686424c5d\\scratch\\gsc_authenticated_drilldown_20261109.json', 'utf8'));

console.log('Top level keys in gsc_authenticated_drilldown_20261109.json:', Object.keys(data));

// Check each key
for (const key of Object.keys(data)) {
  const val = data[key];
  if (Array.isArray(val)) {
    console.log(`Key "${key}" is array with ${val.length} items. Sample:`, val.slice(0, 3));
  } else if (typeof val === 'object' && val !== null) {
    console.log(`Key "${key}" is object with keys:`, Object.keys(val).slice(0, 10));
  }
}
