import { shopifyGraphQL } from './lib/cloud-env.mjs';

const CHECK_QUERY = `
  query CheckRedirects {
    r1: urlRedirects(first: 5, query: "path:/pages/our-story") {
      edges { node { id path target } }
    }
    r2: urlRedirects(first: 5, query: "path:/pages/faqs") {
      edges { node { id path target } }
    }
  }
`;

const CREATE_MUTATION = `
  mutation UrlRedirectCreate($urlRedirect: UrlRedirectInput!) {
    urlRedirectCreate(urlRedirect: $urlRedirect) {
      urlRedirect { id path target }
      userErrors { field message }
    }
  }
`;

async function main() {
  console.log('1. Checking existing redirects...');
  const checkRes = await shopifyGraphQL(CHECK_QUERY);
  console.log('Existing /pages/our-story:', JSON.stringify(checkRes.r1?.edges || []));
  console.log('Existing /pages/faqs:', JSON.stringify(checkRes.r2?.edges || []));

  const redirectsToCreate = [
    { path: '/pages/our-story', target: '/pages/about-us' },
    { path: '/pages/faqs', target: '/pages/delivery-return' }
  ];

  for (const redir of redirectsToCreate) {
    console.log(`\nCreating redirect: ${redir.path} -> ${redir.target}`);
    const res = await shopifyGraphQL(CREATE_MUTATION, { urlRedirect: redir });
    const payload = res?.urlRedirectCreate;
    if (payload?.userErrors?.length) {
      console.error('Errors:', payload.userErrors);
    } else if (payload?.urlRedirect?.id) {
      console.log(`Successfully created redirect ID: ${payload.urlRedirect.id} (${payload.urlRedirect.path} -> ${payload.urlRedirect.target})`);
    } else {
      console.log('Unexpected response:', JSON.stringify(res));
    }
  }

  console.log('\nDone creating redirects.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
