// Test image URL generation for different product types

const https = require('https');

const testCases = [
  {
    name: "Bracelet (diamond + emerald)",
    jewelryType: "bracelet",
    customizationData: {
      "first_stone": "diamond",
      "chain_type": "black_leather",
      "metal": "white_gold",
      "second_stone": "emerald"
    },
    expectedFilename: "bracelet-black-leather-emerald-whitegold"
  },
  {
    name: "Necklace (diamond + emerald)", 
    jewelryType: "necklace",
    customizationData: {
      "first_stone": "diamond",
      "chain_type": "black_leather",
      "metal": "white_gold",
      "second_stone": "emerald"
    },
    expectedFilename: "necklace-black-leather-emerald-whitegold"
  },
  {
    name: "Earrings (blue sapphire)",
    jewelryType: "earrings", 
    customizationData: {
      "first_stone": "blue_sapphire",
      "metal": "white_gold"
    },
    expectedFilename: "earrings-blue_sapphire-whitegold"
  },
  {
    name: "Ring (ruby + emerald)",
    jewelryType: "ring",
    customizationData: {
      "first_stone": "ruby",
      "metal": "yellow_gold",
      "second_stone": "emerald"
    },
    expectedFilename: "ring-ruby-emerald-yellowgold"
  }
];

// Filename slug mappings (from DB)
const mappingMap = new Map([
  ["white_gold", "whitegold"],
  ["yellow_gold", "yellowgold"],
  ["rose_gold", "rose_gold"],
  ["black_leather", "black-leather"],
  ["gold_cord", "gold-cord"],
  ["emerald", "emerald"],
  ["diamond", "diamond"],
  ["ruby", "ruby"],
  ["blue_sapphire", "blue_sapphire"],
  ["pink_sapphire", "pink_sapphire"],
]);

// Folder mapping
const folderMap = {
  'bracelet': 'bracelets',
  'necklace': 'necklaces',
  'earrings': 'earringss', // Typo in storage
  'ring': 'rings',
};

function isDiamond(optionId) {
  const lower = optionId.toLowerCase();
  return lower === 'diamond' || lower.endsWith('_diamond') || lower.includes('diamond');
}

function generateFilename(jewelryType, customizationData) {
  const variantOptions = Object.entries(customizationData).map(([setting_id, option_id]) => ({
    setting_id,
    option_id
  }));

  const chainOption = variantOptions.find(opt => opt.setting_id === 'chain_type');
  const firstStoneOption = variantOptions.find(opt => opt.setting_id === 'first_stone');
  const secondStoneOption = variantOptions.find(opt => opt.setting_id === 'second_stone');
  const metalOption = variantOptions.find(opt => opt.setting_id === 'metal');

  const filenameParts = [jewelryType];

  if (chainOption) {
    const slug = mappingMap.get(chainOption.option_id) || chainOption.option_id;
    filenameParts.push(slug);
  }

  if (firstStoneOption && !isDiamond(firstStoneOption.option_id)) {
    const slug = mappingMap.get(firstStoneOption.option_id) || firstStoneOption.option_id;
    filenameParts.push(slug);
  }

  if (secondStoneOption) {
    const slug = mappingMap.get(secondStoneOption.option_id) || secondStoneOption.option_id;
    filenameParts.push(slug);
  }

  if (metalOption) {
    const slug = mappingMap.get(metalOption.option_id) || metalOption.option_id;
    filenameParts.push(slug);
  }

  return filenameParts.join('-');
}

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => resolve(false));
  });
}

async function runTests() {
  console.log("Testing certificate image URL generation for all product types:\n");
  
  for (const test of testCases) {
    const filename = generateFilename(test.jewelryType, test.customizationData);
    const folder = folderMap[test.jewelryType] || `${test.jewelryType}s`;
    
    // Try different extensions
    const extensions = ['.webp', '.PNG', '.png', '.jpg'];
    let found = false;
    let foundUrl = '';
    
    for (const ext of extensions) {
      const url = `https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/customization-item/${folder}/${filename}${ext}`;
      const exists = await checkUrl(url);
      if (exists) {
        found = true;
        foundUrl = url;
        break;
      }
    }
    
    const filenameMatch = filename === test.expectedFilename ? '✓' : '✗';
    const imageStatus = found ? '✓ Found' : '✗ Missing';
    
    console.log(`${test.name}:`);
    console.log(`  Generated: ${filename} ${filenameMatch}`);
    console.log(`  Expected:  ${test.expectedFilename}`);
    console.log(`  Folder:    ${folder}`);
    console.log(`  Image:     ${imageStatus}`);
    if (found) console.log(`  URL:       ${foundUrl}`);
    console.log();
  }
}

runTests();
