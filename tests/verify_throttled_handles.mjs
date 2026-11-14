const handlesToVerify = [
  'cyberpunk-neon-gaming-desk-mats',
  'space-galaxy-nebula-desk-mats',
  'fantasy-dragon-mythology-desk-mats',
  'minimalist-abstract-geometric-desk-mats',
  'retro-vintage-synthwave-desk-mats',
  'nature-mountain-landscape-canvas-wall-art',
  'botanical-floral-coastal-canvas-wall-art',
  'abstract-minimalist-bauhaus-canvas-wall-art',
  'japanese-ukiyo-e-zen-canvas-wall-art',
  'space-cosmic-astronomy-canvas-wall-art',
  'fantasy-mythology-gothic-cushion-covers',
  'world-travel-mediterranean-cushion-covers',
  'retro-vintage-pop-art-cushion-covers',
  'nature-mountain-cabin-throw-blankets',
  'abstract-boho-kilim-throw-blankets',
  'animals-wildlife-cozy-throw-blankets',
  'fantasy-dragon-mythic-throw-blankets',
  'sci-fi-cyberpunk-gamer-throw-blankets',
  'world-travel-paris-european-throw-blankets',
  'japanese-sakura-oriental-throw-blankets',
  'minimalist-abstract-stone-bath-mats',
  'animals-wildlife-whimsical-bath-mats',
  'fantasy-gothic-witchy-bath-mats',
  'fantasy-dragon-graphic-hoodies'
];

async function verifyThrottledHandles() {
  console.log(`Verifying ${handlesToVerify.length} handles with 400ms pacing...`);
  let passed = 0;
  let failed = 0;

  for (let i = 0; i < handlesToVerify.length; i++) {
    const handle = handlesToVerify[i];
    const url = `https://printswithpassion.com/collections/${handle}?_ch=${Date.now()}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) VerificationChallenger/1.0'
      }
    });

    if (res.status === 200) {
      passed++;
      console.log(`[${i + 1}/${handlesToVerify.length}] 200 OK: /collections/${handle}`);
    } else {
      failed++;
      console.error(`[${i + 1}/${handlesToVerify.length}] FAIL HTTP ${res.status}: /collections/${handle}`);
    }
    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`\nVerified: ${passed}/${handlesToVerify.length}`);
  if (failed > 0) process.exit(1);
}

verifyThrottledHandles();
