import { shopifyGraphQL } from '../lib/cloud-env.mjs';

async function main() {
  const pageSpec = (await import('../.agents/teamwork/teamwork_explorer_m4_1/page_remediation_spec.json', { with: { type: 'json' } })).default;
  
  for (const p of pageSpec.pages) {
    const res = await shopifyGraphQL(`{ page(id: "${p.page_id}") { handle body } }`);
    const body = res?.page?.body || '';
    if (body.includes('&amp;')) {
      const matches = [...body.matchAll(/.{0,30}&amp;.{0,30}/g)].map(m => m[0]);
      console.log(`Page ${p.handle} has ${matches.length} &amp; instances:`);
      for (const m of matches) {
        console.log(`   "${m}"`);
      }
    }
  }
}

main().catch(console.error);
