// Simulate the certificate image URL generation logic

const customizationData = {
  "first_stone": "diamond",
  "chain_type": "black_leather",
  "metal": "white_gold",
  "second_stone": "emerald",
  "diamondType": "lab_grown"
};

const jewelryType = "bracelet";

// Simulated filename mappings from DB (based on the query results)
const mappingMap = new Map([
  ["white_gold", "whitegold"],
  ["yellow_gold", "yellowgold"],
  ["black_leather", "black-leather"],
  ["gold_cord", "gold-cord"],
  ["emerald", "emerald"],
  ["diamond", "diamond"],
]);

// Build variant options from customizations
const variantOptions = Object.entries(customizationData).map(([setting_id, option_id]) => ({
  setting_id,
  option_id
}));

// Extract options by setting
const chainOption = variantOptions.find(opt => opt.setting_id === 'chain_type');
const firstStoneOption = variantOptions.find(opt => opt.setting_id === 'first_stone');
const secondStoneOption = variantOptions.find(opt => opt.setting_id === 'second_stone');
const metalOption = variantOptions.find(opt => opt.setting_id === 'metal');

// Build filename parts
const filenameParts = [jewelryType];

// Add chain/cord
if (chainOption) {
  const slug = mappingMap.get(chainOption.option_id) || chainOption.option_id;
  filenameParts.push(slug);
  console.log(`Chain: ${chainOption.option_id} -> ${slug}`);
}

// Diamond check function
const isDiamond = (optionId) => {
  const lower = optionId.toLowerCase();
  return lower === 'diamond' || lower.endsWith('_diamond') || lower.includes('diamond');
};

// Only include first_stone if it's NOT diamond
if (firstStoneOption && !isDiamond(firstStoneOption.option_id)) {
  const firstStoneSlug = mappingMap.get(firstStoneOption.option_id) || firstStoneOption.option_id;
  filenameParts.push(firstStoneSlug);
  console.log(`First stone: ${firstStoneOption.option_id} -> ${firstStoneSlug}`);
} else if (firstStoneOption) {
  console.log(`First stone SKIPPED (diamond): ${firstStoneOption.option_id}`);
}

// Always include second stone
if (secondStoneOption) {
  const secondStoneSlug = mappingMap.get(secondStoneOption.option_id) || secondStoneOption.option_id;
  filenameParts.push(secondStoneSlug);
  console.log(`Second stone: ${secondStoneOption.option_id} -> ${secondStoneSlug}`);
}

// Add metal
if (metalOption) {
  const slug = mappingMap.get(metalOption.option_id) || metalOption.option_id;
  filenameParts.push(slug);
  console.log(`Metal: ${metalOption.option_id} -> ${slug}`);
}

const baseFilename = filenameParts.join('-');
console.log(`\nGenerated filename: ${baseFilename}`);
console.log(`Expected: bracelet-black-leather-emerald-whitegold`);
console.log(`Match: ${baseFilename === 'bracelet-black-leather-emerald-whitegold'}`);

const folder = 'bracelets';
const fullUrl = `https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/customization-item/${folder}/${baseFilename}.PNG`;
console.log(`\nFull URL: ${fullUrl}`);
