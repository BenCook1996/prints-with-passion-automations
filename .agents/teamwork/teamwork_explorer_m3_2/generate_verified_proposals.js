import fs from 'fs';
import path from 'path';

// Load original inventory with IDs and product counts
const inventory = JSON.parse(
  fs.readFileSync('C:\\Users\\Benjamin\\.gemini\\antigravity\\scratch\\pwp-seo-blog-engine\\.agents\\teamwork\\teamwork_explorer_m3_2\\combined_inventory.json', 'utf8')
);

// Map of handcrafted, verified proposals for all 70 collections
const verifiedProposals = [
  // 0: frontpage
  {
    handle: 'frontpage',
    proposedTitle: 'Canvas Wall Art, XXL Desk Mats & Decor | Prints With Passion',
    proposedDesc: 'Shop archival framed canvas wall art (1.25" pine), 4mm XXL stitched desk mats, velvet cushions & plush throws for modern UK homes. Free tracked UK delivery.'
  },
  // 1: canvas-prints
  {
    handle: 'canvas-prints',
    proposedTitle: 'Framed Canvas Wall Art | Archival Prints | PWP Studio',
    proposedDesc: 'Shop archival canvas wall art printed on 400gsm cotton-poly canvas with 1.25" pine stretcher bars and vivid fade-resistant inks. Free tracked UK delivery.'
  },
  // 2: apparel
  {
    handle: 'apparel',
    proposedTitle: 'Graphic T-Shirts & Studio Apparel | Prints With Passion',
    proposedDesc: 'Heavyweight 100% combed cotton graphic t-shirts and streetwear apparel featuring high-res DTG prints and durable hems. Free tracked UK delivery.'
  },
  // 3: avada-upsell-best-sellers
  {
    handle: 'avada-upsell-best-sellers',
    action: 'UNPUBLISH_FROM_ONLINE_STORE',
    notes: 'Unpublish from Online Store publication gid://shopify/Publication/124388507959 so it exits sitemap_collections_1.xml',
    proposedTitle: 'Best Selling Art, Desk Mats & Apparel | Prints With Passion',
    proposedDesc: 'Shop top-rated archival canvas wall art, 4mm XXL gaming desk mats, plush blankets and graphic apparel at Prints With Passion. Free tracked UK delivery.'
  },
  // 4: hoodies
  {
    handle: 'hoodies',
    proposedTitle: 'Graphic Hoodies | Heavyweight 310 GSM Fleece | PWP',
    proposedDesc: 'Heavyweight 310 GSM fleece graphic hoodies featuring double-lined hoods, pouch pockets and gallery artwork for cozy warmth. Free tracked UK delivery.'
  },
  // 5: pillow-cases
  {
    handle: 'pillow-cases',
    proposedTitle: 'Velvet Cushion Covers 45×45cm | Double-Sided Pillows',
    proposedDesc: 'Double-sided 45×45cm (18×18") velvet cushion covers with concealed zippers and vibrant gallery prints for sofas and beds. Free tracked UK delivery.'
  },
  // 6: bath-mats (repaired from 116 chars)
  {
    handle: 'bath-mats',
    proposedTitle: 'Non-Slip Memory Foam Bath Mats | Fast-Drying Rugs',
    proposedDesc: 'High-density non-slip memory foam bath mats topped with ultra-absorbent microfibre fleece and durable anti-skid backing. Free tracked UK delivery.'
  },
  // 7: desk-mats
  {
    handle: 'desk-mats',
    proposedTitle: 'XXL Gaming Desk Mats & Large Mouse Pads | 4mm Stitched',
    proposedDesc: 'Precision XXL gaming desk mats engineered with 4mm non-slip rubber, 360° anti-fray stitched borders & smooth glide cloth. Free tracked UK delivery.'
  },
  // 8: blankets
  {
    handle: 'blankets',
    proposedTitle: 'Plush Throw Blankets | 300 GSM Fleece Throws | PWP',
    proposedDesc: 'Ultra-soft 300 GSM plush coral fleece throw blankets available in 50×60" and 60×80" bed sizes for living room comfort. Free tracked UK delivery.'
  },
  // 9: clothing
  {
    handle: 'clothing',
    proposedTitle: 'Streetwear Graphic Clothing & Apparel | Prints With Passion',
    proposedDesc: 'Shop streetwear graphic clothing, heavyweight cotton tees and plush fleece hoodies featuring studio art and durable seams. Free tracked UK delivery.'
  },
  // 10: home-living
  {
    handle: 'home-living',
    proposedTitle: 'Home Decor, Cushions, Blankets & Mats | Prints With Passion',
    proposedDesc: 'Discover premium home decor including 4mm XXL gaming desk mats, framed canvas art, velvet cushions and fleece throw blankets. Free tracked UK delivery.'
  },
  // 11: all-products
  {
    handle: 'all-products',
    proposedTitle: 'Art Prints, XXL Desk Mats & Home Decor | Prints With Passion',
    proposedDesc: 'Explore the complete Prints With Passion catalog: archival framed canvas prints, 4mm XXL desk mats, cushions and plush throws. Free tracked UK delivery.'
  },
  // 12: t-shirts
  {
    handle: 't-shirts',
    proposedTitle: 'Heavyweight Graphic T-Shirts & Cotton Tees | PWP Studio',
    proposedDesc: 'Shop premium heavyweight 100% combed cotton graphic t-shirts with reinforced double-needle collars and crisp gallery prints. Free tracked UK delivery.'
  },
  // 13: nature-landscapes
  {
    handle: 'nature-landscapes',
    proposedTitle: 'Nature & Landscape Wall Art & Decor | Prints With Passion',
    proposedDesc: 'Explore the Nature & Landscape Art collection: archival framed pine canvas prints, 4mm XXL desk mats, cushions and plush throws. Free tracked UK delivery.'
  },
  // 14: sci-fi-cyberpunk
  {
    handle: 'sci-fi-cyberpunk',
    proposedTitle: 'Sci-Fi & Cyberpunk Wall Art & Decor | Prints With Passion',
    proposedDesc: 'Explore the Sci-Fi & Cyberpunk Art collection: framed pine canvas prints, 4mm XXL gaming desk mats, cushions and fleece throws. Free tracked UK delivery.'
  },
  // 15: space-cosmic
  {
    handle: 'space-cosmic',
    proposedTitle: 'Space & Galaxy Wall Art & Home Decor | Prints With Passion',
    proposedDesc: 'Explore the Space & Galaxy Art studio collection: framed pine canvas prints, 4mm XXL desk mats, velvet cushions and throws. Free tracked UK delivery.'
  },
  // 16: animals-wildlife
  {
    handle: 'animals-wildlife',
    proposedTitle: 'Animals & Wildlife Wall Art & Decor | Prints With Passion',
    proposedDesc: 'Explore the Animals & Wildlife Art collection: archival framed pine canvas prints, 4mm XXL desk mats, cushions and fleece throws. Free tracked UK delivery.'
  },
  // 17: abstract-geometric
  {
    handle: 'abstract-geometric',
    proposedTitle: 'Abstract & Minimalist Wall Art & Decor | Prints With Passion',
    proposedDesc: 'Explore the Abstract & Minimalist collection: framed pine canvas prints, 4mm XXL gaming desk mats, cushions and fleece throws. Free tracked UK delivery.'
  },
  // 18: fantasy-mythology
  {
    handle: 'fantasy-mythology',
    proposedTitle: 'Fantasy & Mythology Wall Art & Decor | Prints With Passion',
    proposedDesc: 'Explore the Fantasy & Mythology collection: framed pine canvas prints, 4mm XXL desk mats, velvet cushions and fleece throws. Free tracked UK delivery.'
  },
  // 19: world-travel-cities
  {
    handle: 'world-travel-cities',
    proposedTitle: 'World Travel & City Skyline Wall Art | Prints With Passion',
    proposedDesc: 'Explore the World Travel & City Art collection: archival framed pine canvas prints, 4mm XXL desk mats, cushions and cozy throws. Free tracked UK delivery.'
  },
  // 20: retro-vintage
  {
    handle: 'retro-vintage',
    proposedTitle: 'Retro & Vintage Wall Art & Home Decor | Prints With Passion',
    proposedDesc: 'Explore the Retro & Vintage Art collection: framed pine canvas prints, 4mm XXL desk mats, velvet cushions and fleece throws. Free tracked UK delivery.'
  },
  // 21: japanese-asian-art
  {
    handle: 'japanese-asian-art',
    proposedTitle: 'Japanese & Samurai Wall Art & Decor | Prints With Passion',
    proposedDesc: 'Explore the Japanese & Samurai Art collection: archival framed pine canvas prints, 4mm XXL desk mats, cushions and fleece throws. Free tracked UK delivery.'
  },
  // 22: japanese-anime-desk-mats (SPECIFIC FIX: bespoke category-level title <=60 chars)
  {
    handle: 'japanese-anime-desk-mats',
    proposedTitle: 'Japanese Anime & Gaming Desk Mats | 4mm XXL Mouse Pads',
    proposedDesc: 'Shop Japanese anime, samurai and ukiyo-e XXL gaming desk mats featuring 4mm non-slip rubber, stitched edges and smooth cloth. Free tracked UK delivery.'
  },
  // 23: cyberpunk-neon-gaming-desk-mats
  {
    handle: 'cyberpunk-neon-gaming-desk-mats',
    proposedTitle: 'Sci-Fi & Cyberpunk XXL Gaming Desk Mats | 4mm Mouse Pads',
    proposedDesc: 'Shop Sci-Fi, Cyberpunk & Synthwave XXL gaming desk mats featuring 4mm high-density non-slip rubber and stitched anti-fray edges. Free tracked UK delivery.'
  },
  // 24: space-galaxy-nebula-desk-mats
  {
    handle: 'space-galaxy-nebula-desk-mats',
    proposedTitle: 'Space, Galaxy & Nebula XXL Desk Mats | 4mm Gaming Pads',
    proposedDesc: 'Shop Space, Galaxy, Nebula & Astronaut XXL gaming desk mats featuring 4mm high-density non-slip rubber and stitched borders. Free tracked UK delivery.'
  },
  // 25: fantasy-dragon-mythology-desk-mats
  {
    handle: 'fantasy-dragon-mythology-desk-mats',
    proposedTitle: 'Fantasy, Dragon & Mythic XXL Desk Mats | 4mm Gaming Pads',
    proposedDesc: 'Shop Fantasy, Dragon, Dark Mythic & RPG XXL gaming desk mats engineered with 4mm non-slip rubber and durable stitched edges. Free tracked UK delivery.'
  },
  // 26: nature-mountain-forest-desk-mats
  {
    handle: 'nature-mountain-forest-desk-mats',
    proposedTitle: 'Nature & Mountain Landscape XXL Desk Mats | 4mm Mouse Pads',
    proposedDesc: 'Shop Nature Mountain XXL gaming desk mats featuring 4mm high-density non-slip rubber, stitched borders and smooth glide cloth. Free tracked UK delivery.'
  },
  // 27: minimalist-abstract-geometric-desk-mats
  {
    handle: 'minimalist-abstract-geometric-desk-mats',
    proposedTitle: 'Minimalist & Bauhaus XXL Gaming Desk Mats | 4mm Mouse Pads',
    proposedDesc: 'Shop Minimalist & Abstract XXL gaming desk mats featuring 4mm high-density non-slip rubber, stitched borders and smooth cloth. Free tracked UK delivery.'
  },
  // 28: animals-wildlife-pet-desk-mats
  {
    handle: 'animals-wildlife-pet-desk-mats',
    proposedTitle: 'Animals, Wildlife & Pets XXL Desk Mats | 4mm Mouse Pads',
    proposedDesc: 'Shop Animals & Pets XXL gaming desk mats featuring 4mm high-density non-slip rubber, stitched borders and micro-woven glide cloth. Free tracked UK delivery.'
  },
  // 29: retro-vintage-synthwave-desk-mats
  {
    handle: 'retro-vintage-synthwave-desk-mats',
    proposedTitle: 'Retro Synthwave & 80s XXL Desk Mats | 4mm Gaming Pads',
    proposedDesc: 'Shop Retro Synthwave XXL gaming desk mats featuring 4mm high-density non-slip rubber, stitched borders and smooth glide cloth. Free tracked UK delivery.'
  },
  // 30: nature-mountain-landscape-canvas-wall-art
  {
    handle: 'nature-mountain-landscape-canvas-wall-art',
    proposedTitle: 'Nature Landscape Canvas Wall Art | 1.25" Framed Prints',
    proposedDesc: 'Archival Nature Landscape framed canvas wall art printed on 400gsm cotton-poly canvas with 1.25" pine bars for modern rooms. Free tracked UK delivery.'
  },
  // 31: botanical-floral-coastal-canvas-wall-art
  {
    handle: 'botanical-floral-coastal-canvas-wall-art',
    proposedTitle: 'Botanical & Floral Canvas Wall Art | 1.25" Framed Prints',
    proposedDesc: 'Archival Botanical & Floral framed canvas wall art printed on 400gsm cotton-poly canvas with 1.25" pine bars for fresh decor. Free tracked UK delivery.'
  },
  // 32: abstract-minimalist-bauhaus-canvas-wall-art (SPECIFIC FIX: complete title <=60 chars)
  {
    handle: 'abstract-minimalist-bauhaus-canvas-wall-art',
    proposedTitle: 'Bauhaus & Minimalist Canvas Wall Art | Framed Art Prints',
    proposedDesc: 'Abstract, minimalist and Bauhaus geometric canvas wall art on 400gsm cotton-poly canvas over 1.25" pine frames for calm interiors. Free tracked UK delivery.'
  },
  // 33: japanese-ukiyo-e-zen-canvas-wall-art
  {
    handle: 'japanese-ukiyo-e-zen-canvas-wall-art',
    proposedTitle: 'Japanese Ukiyo-e Canvas Wall Art | 1.25" Framed Prints',
    proposedDesc: 'Archival Japanese Ukiyo-e Samurai framed canvas wall art printed on 400gsm cotton-poly canvas with 1.25" pine bars for home decor. Free tracked UK delivery.'
  },
  // 34: animals-wildlife-equestrian-canvas-wall-art
  {
    handle: 'animals-wildlife-equestrian-canvas-wall-art',
    proposedTitle: 'Animals & Highland Cow Canvas Wall Art | 1.25" Framed Art',
    proposedDesc: 'Archival Animals & Highland Cow framed canvas wall art printed on 400gsm cotton-poly canvas with 1.25" pine bars for home. Free tracked UK delivery.'
  },
  // 35: world-travel-city-skyline-canvas-wall-art
  {
    handle: 'world-travel-city-skyline-canvas-wall-art',
    proposedTitle: 'World Travel & City Canvas Wall Art | 1.25" Framed Prints',
    proposedDesc: 'Archival World Travel & City framed canvas wall art printed on 400gsm cotton-poly canvas with 1.25" pine bars for living spaces. Free tracked UK delivery.'
  },
  // 36: space-cosmic-astronomy-canvas-wall-art
  {
    handle: 'space-cosmic-astronomy-canvas-wall-art',
    proposedTitle: 'Space & Nebula Canvas Wall Art | 1.25" Framed Prints',
    proposedDesc: 'Archival Space Nebula framed canvas wall art printed on 400gsm cotton-poly canvas with 1.25" pine bars for modern interiors. Free tracked UK delivery.'
  },
  // 37: sci-fi-cyberpunk-neon-canvas-wall-art
  {
    handle: 'sci-fi-cyberpunk-neon-canvas-wall-art',
    proposedTitle: 'Sci-Fi & Cyberpunk Canvas Wall Art | 1.25" Framed Prints',
    proposedDesc: 'Archival Sci-Fi & Cyberpunk framed canvas wall art printed on 400gsm cotton-poly canvas with 1.25" pine bars for game rooms. Free tracked UK delivery.'
  },
  // 38: botanical-floral-garden-cushion-covers (FIX: duplication removed)
  {
    handle: 'botanical-floral-garden-cushion-covers',
    proposedTitle: 'Botanical & Floral Cushion Covers | 45×45cm Soft Velvet',
    proposedDesc: 'Double-sided Botanical & Floral velvet cushion covers (45×45cm / 18×18") with concealed zippers and vivid gallery prints. Free tracked UK delivery.'
  },
  // 39: abstract-geometric-bauhaus-cushion-covers
  {
    handle: 'abstract-geometric-bauhaus-cushion-covers',
    proposedTitle: 'Abstract Geometric Cushion Covers | 45×45cm Soft Velvet',
    proposedDesc: 'Double-sided Abstract Geometric velvet cushion covers (45×45cm / 18×18") with concealed zippers and gallery prints for sofas. Free tracked UK delivery.'
  },
  // 40: animals-wildlife-woodland-cushion-covers
  {
    handle: 'animals-wildlife-woodland-cushion-covers',
    proposedTitle: 'Animals & Wildlife Cushion Covers | 45×45cm Soft Velvet',
    proposedDesc: 'Double-sided Animals & Wildlife velvet cushion covers (45×45cm / 18×18") with concealed zippers and gallery prints for sofas. Free tracked UK delivery.'
  },
  // 41: space-celestial-galaxy-cushion-covers
  {
    handle: 'space-celestial-galaxy-cushion-covers',
    proposedTitle: 'Celestial Galaxy Cushion Covers | 45×45cm Soft Velvet',
    proposedDesc: 'Double-sided Celestial Galaxy velvet cushion covers (45×45cm / 18×18") with concealed zippers and gallery prints for bed decor. Free tracked UK delivery.'
  },
  // 42: fantasy-mythology-gothic-cushion-covers
  {
    handle: 'fantasy-mythology-gothic-cushion-covers',
    proposedTitle: 'Fantasy & Gothic Cushion Covers | 45×45cm Soft Velvet',
    proposedDesc: 'Double-sided Fantasy & Gothic velvet cushion covers (45×45cm / 18×18") with concealed zippers and gallery prints for bed decor. Free tracked UK delivery.'
  },
  // 43: japanese-asian-art-cushion-covers (FIX: Wave Wave duplication removed)
  {
    handle: 'japanese-asian-art-cushion-covers',
    proposedTitle: 'Japanese Wave & Koi Cushion Covers | 45×45cm Soft Velvet',
    proposedDesc: 'Double-sided Japanese Great Wave & Koi velvet cushion covers (45×45cm / 18×18") with concealed zippers and gallery prints. Free tracked UK delivery.'
  },
  // 44: world-travel-mediterranean-cushion-covers
  {
    handle: 'world-travel-mediterranean-cushion-covers',
    proposedTitle: 'World Travel & Coastal Cushion Covers | 45×45cm Velvet',
    proposedDesc: 'Double-sided World Travel Coastal velvet cushion covers (45×45cm / 18×18") with concealed zippers and vivid gallery prints. Free tracked UK delivery.'
  },
  // 45: retro-vintage-pop-art-cushion-covers (FIX: Pop Art Art duplication removed)
  {
    handle: 'retro-vintage-pop-art-cushion-covers',
    proposedTitle: 'Retro Vintage Pop Art Cushion Covers | 45×45cm Velvet',
    proposedDesc: 'Double-sided Retro Vintage Pop Art velvet cushion covers (45×45cm / 18×18") with concealed zippers and gallery prints for sofas. Free tracked UK delivery.'
  },
  // 46: nature-mountain-cabin-throw-blankets (FIX: punctuation added)
  {
    handle: 'nature-mountain-cabin-throw-blankets',
    proposedTitle: 'Nature & Mountain Throw Blankets | 300 GSM Fleece Throws',
    proposedDesc: 'Cozy Nature Mountain plush coral fleece throw blankets (300 GSM) in 50×60" and 60×80" bed sizes for living room lounging. Free tracked UK delivery.'
  },
  // 47: abstract-boho-kilim-throw-blankets (FIX: punctuation added)
  {
    handle: 'abstract-boho-kilim-throw-blankets',
    proposedTitle: 'Abstract Geometric Throw Blankets | 300 GSM Fleece Throws',
    proposedDesc: 'Cozy Abstract Geometric plush coral fleece throw blankets (300 GSM) in 50×60" and 60×80" bed sizes for warm home lounging. Free tracked UK delivery.'
  },
  // 48: space-starry-night-galaxy-throw-blankets (FIX: punctuation added)
  {
    handle: 'space-starry-night-galaxy-throw-blankets',
    proposedTitle: 'Space Galaxy Throw Blankets | 300 GSM Plush Fleece Throws',
    proposedDesc: 'Cozy Space Galaxy plush coral fleece throw blankets (300 GSM) in 50×60" and 60×80" bed sizes for living room lounging. Free tracked UK delivery.'
  },
  // 49: animals-wildlife-cozy-throw-blankets
  {
    handle: 'animals-wildlife-cozy-throw-blankets',
    proposedTitle: 'Animals & Wildlife Throw Blankets | 300 GSM Fleece Throws',
    proposedDesc: 'Cozy Animals, Wildlife & Pets plush coral fleece throw blankets (300 GSM) in 50×60" and 60×80" bed sizes for warm lounging. Free tracked UK delivery.'
  },
  // 50: fantasy-dragon-mythic-throw-blankets
  {
    handle: 'fantasy-dragon-mythic-throw-blankets',
    proposedTitle: 'Fantasy, Dragon & Mythic Throw Blankets | 300 GSM Fleece',
    proposedDesc: 'Cozy Fantasy, Dragon & Mythic plush coral fleece throw blankets (300 GSM) in 50×60" and 60×80" bed sizes for cozy lounging. Free tracked UK delivery.'
  },
  // 51: sci-fi-cyberpunk-gamer-throw-blankets (FIX: punctuation added)
  {
    handle: 'sci-fi-cyberpunk-gamer-throw-blankets',
    proposedTitle: 'Sci-Fi Gamer Throw Blankets | 300 GSM Plush Fleece Throws',
    proposedDesc: 'Cozy Sci-Fi Gamer plush coral fleece throw blankets (300 GSM) in 50×60" and 60×80" bed sizes for game room lounging. Free tracked UK delivery.'
  },
  // 52: world-travel-paris-european-throw-blankets (FIX: punctuation added)
  {
    handle: 'world-travel-paris-european-throw-blankets',
    proposedTitle: 'World Travel Cityscape Throw Blankets | 300 GSM Fleece',
    proposedDesc: 'Cozy World Travel Cityscape plush coral fleece throw blankets (300 GSM) in 50×60" and 60×80" bed sizes for sofa lounging. Free tracked UK delivery.'
  },
  // 53: japanese-sakura-oriental-throw-blankets
  {
    handle: 'japanese-sakura-oriental-throw-blankets',
    proposedTitle: 'Japanese Sakura Great Wave Throw Blankets | 300 GSM Fleece',
    proposedDesc: 'Cozy Japanese Sakura Great Wave plush coral fleece throw blankets (300 GSM) in 50×60" and 60×80" bed sizes for cozy lounging. Free tracked UK delivery.'
  },
  // 54: coastal-ocean-botanical-bath-mats (FIX: Coastal Ocean Coastal duplication removed)
  {
    handle: 'coastal-ocean-botanical-bath-mats',
    proposedTitle: 'Coastal Ocean & Botanical Bath Mats | Non-Slip Memory Foam',
    proposedDesc: 'Non-slip Coastal Ocean memory foam bath mats with absorbent microfibre fleece top and durable anti-skid backing rubber. Free tracked UK delivery.'
  },
  // 55: minimalist-abstract-stone-bath-mats
  {
    handle: 'minimalist-abstract-stone-bath-mats',
    proposedTitle: 'Minimalist & Abstract Bath Mats | Non-Slip Memory Foam Rugs',
    proposedDesc: 'Non-slip Minimalist Abstract memory foam bath mats with absorbent microfibre fleece top and durable anti-skid rubber backing. Free tracked UK delivery.'
  },
  // 56: animals-wildlife-whimsical-bath-mats (FIX: for modern UK fragment fixed)
  {
    handle: 'animals-wildlife-whimsical-bath-mats',
    proposedTitle: 'Animals & Wildlife Bath Mats | Non-Slip Memory Foam Rugs',
    proposedDesc: 'Non-slip Animals Wildlife memory foam bath mats with absorbent microfibre fleece top and durable anti-skid rubber backing. Free tracked UK delivery.'
  },
  // 57: celestial-space-moon-bath-mats (FIX: Moon Moon duplication removed)
  {
    handle: 'celestial-space-moon-bath-mats',
    proposedTitle: 'Celestial Moon & Space Bath Mats | Non-Slip Memory Foam',
    proposedDesc: 'Non-slip Celestial Moon memory foam bath mats with absorbent microfibre fleece top and durable anti-skid rubber backing. Free tracked UK delivery.'
  },
  // 58: fantasy-gothic-witchy-bath-mats (FIX: for modern UK fragment fixed)
  {
    handle: 'fantasy-gothic-witchy-bath-mats',
    proposedTitle: 'Fantasy & Gothic Bath Mats | Non-Slip Memory Foam Rugs',
    proposedDesc: 'Non-slip Fantasy Gothic memory foam bath mats with absorbent microfibre fleece top and durable anti-skid rubber backing. Free tracked UK delivery.'
  },
  // 59: sci-fi-neon-cyberpunk-bath-mats (FIX: for modern UK fragment fixed)
  {
    handle: 'sci-fi-neon-cyberpunk-bath-mats',
    proposedTitle: 'Sci-Fi & Cyberpunk Bath Mats | Non-Slip Memory Foam Rugs',
    proposedDesc: 'Non-slip Sci-Fi Cyberpunk memory foam bath mats with absorbent microfibre fleece top and durable anti-skid rubber backing. Free tracked UK delivery.'
  },
  // 60: japanese-zen-onsen-bath-mats (FIX: for modern UK fragment fixed)
  {
    handle: 'japanese-zen-onsen-bath-mats',
    proposedTitle: 'Japanese Koi & Zen Bath Mats | Non-Slip Memory Foam Rugs',
    proposedDesc: 'Non-slip Japanese Koi Zen memory foam bath mats with absorbent microfibre fleece top and durable anti-skid rubber backing. Free tracked UK delivery.'
  },
  // 61: retro-vintage-funky-bath-mats (FIX: Retro 70s Groovy 70s Retro duplication removed)
  {
    handle: 'retro-vintage-funky-bath-mats',
    proposedTitle: 'Retro 70s Groovy Bath Mats | Non-Slip Memory Foam Rugs',
    proposedDesc: 'Non-slip Retro 70s Groovy memory foam bath mats with absorbent microfibre fleece top and durable anti-skid rubber backing. Free tracked UK delivery.'
  },
  // 62: japanese-anime-graphic-t-shirts (FIX: missing Tees noun before pipe and fragment fixed)
  {
    handle: 'japanese-anime-graphic-t-shirts',
    proposedTitle: 'Japanese Anime & Samurai Graphic T-Shirts | Cotton Tees',
    proposedDesc: 'Premium 100% combed cotton Japanese anime, samurai & ukiyo-e graphic t-shirts with durable double-needle stitching. Free tracked UK delivery.'
  },
  // 63: cyberpunk-sci-fi-graphic-t-shirts
  {
    handle: 'cyberpunk-sci-fi-graphic-t-shirts',
    proposedTitle: 'Sci-Fi & Cyberpunk Graphic T-Shirts | Combed Cotton Tees',
    proposedDesc: 'Premium 100% combed cotton Sci-Fi & Cyberpunk graphic t-shirts with durable double-needle stitching and crisp DTG prints. Free tracked UK delivery.'
  },
  // 64: space-galaxy-graphic-t-shirts (FIX: missing Tees noun and fragment fixed)
  {
    handle: 'space-galaxy-graphic-t-shirts',
    proposedTitle: 'Space, Galaxy & Nebula Graphic T-Shirts | Cotton Tees',
    proposedDesc: 'Premium 100% combed cotton Space, Galaxy, Nebula & Celestial graphic t-shirts with double-needle stitching and DTG prints. Free tracked UK delivery.'
  },
  // 65: retro-synthwave-graphic-t-shirts (FIX: missing Tees noun and fragment fixed)
  {
    handle: 'retro-synthwave-graphic-t-shirts',
    proposedTitle: 'Retro 80s Synthwave Graphic T-Shirts | Combed Cotton Tees',
    proposedDesc: 'Premium 100% combed cotton Retro 80s Synthwave, Vintage & Abstract graphic t-shirts with durable double-needle stitching. Free tracked UK delivery.'
  },
  // 66: japanese-ukiyo-e-graphic-hoodies (FIX: missing Hoodies noun and fragment fixed)
  {
    handle: 'japanese-ukiyo-e-graphic-hoodies',
    proposedTitle: 'Japanese Samurai & Sakura Graphic Hoodies | 310 GSM Fleece',
    proposedDesc: 'Heavyweight 310 GSM Japanese Samurai, Great Wave & Sakura graphic fleece hoodies with double-lined hoods and ribbed cuffs. Free tracked UK delivery.'
  },
  // 67: cyberpunk-neon-graphic-hoodies (FIX: missing Hoodies noun and fragment fixed)
  {
    handle: 'cyberpunk-neon-graphic-hoodies',
    proposedTitle: 'Sci-Fi & Cyberpunk Streetwear Hoodies | 310 GSM Fleece',
    proposedDesc: 'Heavyweight 310 GSM Sci-Fi, Cyberpunk & Neon Streetwear graphic fleece hoodies with double-lined hoods and ribbed cuffs. Free tracked UK delivery.'
  },
  // 68: fantasy-dragon-graphic-hoodies (FIX: missing Hoodies noun and fragment fixed)
  {
    handle: 'fantasy-dragon-graphic-hoodies',
    proposedTitle: 'Fantasy, Dragon & Gothic Graphic Hoodies | 310 GSM Fleece',
    proposedDesc: 'Heavyweight 310 GSM Fantasy, Dragon, Gothic & Mythology graphic fleece hoodies with double-lined hoods and ribbed cuffs. Free tracked UK delivery.'
  },
  // 69: nature-mountain-graphic-hoodies (FIX: missing Hoodies noun and fragment fixed)
  {
    handle: 'nature-mountain-graphic-hoodies',
    proposedTitle: 'Nature Mountain & Wildlife Graphic Hoodies | 310 GSM Fleece',
    proposedDesc: 'Heavyweight 310 GSM Nature, Mountain Landscape & Wildlife graphic fleece hoodies with double-lined hoods and ribbed cuffs. Free tracked UK delivery.'
  }
];

// Merge with inventory metadata (id, productsCount, etc.)
const merged = inventory.map(item => {
  const p = verifiedProposals.find(v => v.handle === item.handle);
  if (!p) {
    throw new Error(`Missing proposal for handle: ${item.handle}`);
  }
  const result = {
    handle: item.handle,
    id: item.id,
    proposedTitle: p.proposedTitle,
    proposedTitleLen: p.proposedTitle.length,
    proposedDesc: p.proposedDesc,
    proposedDescLen: p.proposedDesc.length
  };
  if (p.action) {
    result.action = p.action;
    result.notes = p.notes;
  }
  return result;
});

// Comprehensive Validator Suite
let failed = false;
const templateRegex = /(?:Transform|Elevate|Style|Refresh|Upgrade|Wear|Claim)\s+with\b/i;
const entityRegex = /&(?:quot|amp|#39|apos|lt|gt|amp;quot);/i;
const danglingRegex = /(?:[–—\-|,/&:]\s*$|\b(?:&|&amp;|Mo|Si|Desig|Pass|and|with|the|in|for|of|vs|at|on|by)\s*$|\.\.\.\s*$|\([^\)]*$)/i;
const substrateRegex = /(?:Canvas|Desk Mat|Cushion|Blanket|Bath Mat|T-Shirt|Hoodie|Apparel|Art|Prints|Decor)/i;

console.log('=== RUNNING RIGOROUS VALIDATION ON ALL 70 PROPOSALS ===\n');

merged.forEach((item, idx) => {
  const title = item.proposedTitle;
  const desc = item.proposedDesc;
  const errors = [];

  // Title checks
  if (!title || title.trim().length === 0) {
    errors.push('Title is empty');
  } else {
    if (title.length < 25) errors.push(`Title too short: ${title.length} < 25`);
    if (title.length > 60) errors.push(`Title too long: ${title.length} > 60`);
    if (danglingRegex.test(title)) errors.push(`Title ends with dangling token/delimiter: "${title}"`);
    if (entityRegex.test(title)) errors.push(`Title contains entity: "${title}"`);
    if (!substrateRegex.test(title)) errors.push(`Title lacks commercial substrate noun: "${title}"`);
    if (/\.\.\./.test(title)) errors.push('Title has ellipsis');
  }

  // Description checks
  if (!desc || desc.trim().length === 0) {
    errors.push('Desc is empty');
  } else {
    if (desc.length < 140) errors.push(`Desc too short: ${desc.length} < 140`);
    if (desc.length > 158) errors.push(`Desc too long: ${desc.length} > 158`);
    if (entityRegex.test(desc)) errors.push(`Desc contains HTML entity: "${desc}"`);
    if (templateRegex.test(desc)) errors.push(`Desc contains template phrase: "${desc}"`);
    if (!/[.!?]$/.test(desc.trim())) errors.push(`Desc does not end with terminal punctuation (.!?): "${desc.slice(-10)}"`);
    if (/\b(?:delve into|testament to|tapestry of|a calm serene|symphony of|beacon of)\b/i.test(desc)) {
      errors.push('Desc contains AI cliché');
    }
  }

  // Specific collections checks
  if (item.handle === 'japanese-anime-desk-mats') {
    if (!/Desk Mats/i.test(title)) errors.push('Anime desk mats must contain plural "Desk Mats"');
    if (/Japanese Wave Desk Mat\b/i.test(title)) errors.push('Anime desk mats must NOT have single product title');
  }
  if (item.handle === 'abstract-minimalist-bauhaus-canvas-wall-art') {
    if (/\(CM & I/i.test(title)) errors.push('Bauhaus must not contain truncated (CM & I');
  }

  if (errors.length > 0) {
    failed = true;
    console.error(`[FAIL] #${idx} ${item.handle}:`);
    errors.forEach(e => console.error(`   - ${e}`));
  } else {
    console.log(`[PASS] #${idx.toString().padStart(2)} ${item.handle.padEnd(45)} | T: ${title.length.toString().padStart(2)} | D: ${desc.length.toString().padStart(3)}`);
  }
});

if (failed) {
  console.error('\nVALIDATION FAILED. Aborting file creation.');
  process.exit(1);
}

// Write verified proposals file
const targetPath = 'C:\\Users\\Benjamin\\.gemini\\antigravity\\scratch\\pwp-seo-blog-engine\\.agents\\teamwork\\teamwork_explorer_m3_2\\verified_collection_proposals.json';
fs.writeFileSync(targetPath, JSON.stringify(merged, null, 2), 'utf8');

console.log(`\nSUCCESS! 100% compliant verified proposals generated at:\n${targetPath}`);
