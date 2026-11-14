async function diag() {
  for (const h of ['canvas-prints', 'desk-mats', 'pillow-cases', 'blankets', 'bath-mats', 'apparel']) {
    const res = await fetch(`https://printswithpassion.com/collections/${h}?_diag=${Date.now()}`);
    const html = await res.text();
    console.log(h, 'status:', res.status, 'len:', html.length);
    const hasHub = html.includes('pwp-curated-hub');
    const h2Match = html.match(/<h2[^>]*id=["']pwp-curated-hub-heading["'][^>]*>([\s\S]*?)<\/h2>/i);
    const h2Count = (html.match(/<h2/gi) || []).length;
    console.log('  hasHub:', hasHub, 'h2Match:', !!h2Match, 'h2Count:', h2Count);
    if (!h2Match && hasHub) {
      const idx = html.indexOf('pwp-curated-hub');
      console.log('  snippet around pwp-curated-hub:');
      console.log(html.substring(idx, idx + 400));
    } else if (h2Match) {
      console.log('  h2 found:', h2Match[0].substring(0, 100));
    }
  }
}
diag();
