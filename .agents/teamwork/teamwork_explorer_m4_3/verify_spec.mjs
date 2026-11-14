import fs from 'fs';

const html = fs.readFileSync('./.agents/teamwork/teamwork_explorer_m4_3/proposed_uk_product_catalog.html', 'utf8');

const h1s = [...html.matchAll(/<h1\b/gi)];
console.log('H1 count in proposed catalog (MUST BE 0):', h1s.length);

const links = [...html.matchAll(/href=["'](\/pages\/[a-z0-9\-]+)["']/gi)].map(m => m[1]);
const uniquePageLinks = [...new Set(links)];
console.log('Unique /pages/ links in proposed catalog:', uniquePageLinks.length);
console.log('Linked pages:');
uniquePageLinks.forEach((p, i) => console.log(`  ${i+1}. ${p}`));

const spec = JSON.parse(fs.readFileSync('./.agents/teamwork/teamwork_explorer_m4_3/internal_linking_spec.json', 'utf8'));
console.log('\nSpec validation:');
console.log('- Unindexed pages listed:', spec.unindexedPagesRemediation?.pages?.length);
console.log('- Footer menu items to add:', spec.footerMenuSpecification?.itemsToAdd?.length);
console.log('- Uncrawled articles:', spec.blogCrossLinkingSpecification?.uncrawledArticles?.length);
console.log('- Uncrawled sub-collections:', spec.blogCrossLinkingSpecification?.uncrawledSubcollections?.length);
console.log('- Total article cross-link specs:', spec.blogCrossLinkingSpecification?.articleRemediationSpecs?.length);
