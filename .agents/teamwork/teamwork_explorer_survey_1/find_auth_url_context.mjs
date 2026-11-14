async function main() {
  const res = await fetch('https://printswithpassion.com/', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const html = await res.text();

  const idx = html.indexOf('/https://printswithpassion.com/customer_authentication');
  if (idx !== -1) {
    console.log('Found /https://printswithpassion.com/customer_authentication at char', idx);
    console.log('Context (500 chars):\n', html.slice(Math.max(0, idx - 200), idx + 300));
  } else {
    console.log('Did not find /https://printswithpassion.com/customer_authentication directly.');
    // Check all customer_authentication occurrences
    const matches = [...html.matchAll(/([^\n]*customer_authentication[^\n]*)/gi)];
    matches.forEach(m => console.log('Match line:\n', m[0]));
  }
}

main().catch(console.error);
