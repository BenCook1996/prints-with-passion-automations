import { shopifyGraphQL } from '../lib/cloud-env.mjs';
import fs from 'fs';

async function generateReport() {
  const query = `
    query get36Pages {
      pages(first: 50) {
        edges {
          node {
            id
            handle
            title
            body
            titleTag: metafield(namespace: "global", key: "title_tag") { value }
            descTag: metafield(namespace: "global", key: "description_tag") { value }
          }
        }
      }
    }
  `;

  const res = await shopifyGraphQL(query);
  const pages = res?.pages?.edges?.map(e => e.node) || [];

  console.log(`Auditing ${pages.length} pages in detail...\n`);
  
  const reportRows = [];
  let allTitlesValid = true;
  let allDescsValid = true;
  let allH1sZero = true;

  for (const p of pages) {
    const titleVal = p.titleTag?.value || '';
    const descVal = p.descTag?.value || '';
    const innerH1Matches = (p.body || '').match(/<h1\b[^>]*>/gi) || [];
    const innerH1Count = innerH1Matches.length;

    const titleOk = titleVal.length > 0 && titleVal.length <= 60;
    const descOk = descVal.length >= 145 && descVal.length <= 158;
    const h1Ok = innerH1Count === 0;

    if (!titleOk) allTitlesValid = false;
    if (!descOk) allDescsValid = false;
    if (!h1Ok) allH1sZero = false;

    reportRows.push({
      handle: p.handle,
      id: p.id,
      titleLen: titleVal.length,
      titleVal,
      descLen: descVal.length,
      descVal,
      innerH1Count,
      titleOk,
      descOk,
      h1Ok
    });
  }

  console.log('Results summary:');
  console.log(`- Total Pages: ${reportRows.length}`);
  console.log(`- All Titles <= 60 chars: ${allTitlesValid}`);
  console.log(`- All Descs 145-158 chars: ${allDescsValid}`);
  console.log(`- All Inner H1s Demoted: ${allH1sZero}`);

  fs.writeFileSync('tests/detailed_pages_audit.json', JSON.stringify(reportRows, null, 2), 'utf8');

  // Print any failures
  const failedTitles = reportRows.filter(r => !r.titleOk);
  const failedDescs = reportRows.filter(r => !r.descOk);
  const failedH1 = reportRows.filter(r => !r.h1Ok);

  if (failedTitles.length > 0) console.error('Failed Titles:', failedTitles);
  if (failedDescs.length > 0) console.error('Failed Descs:', failedDescs);
  if (failedH1.length > 0) console.error('Failed H1s:', failedH1);
}

generateReport().catch(console.error);
