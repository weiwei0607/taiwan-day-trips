const fs = require('fs');

const mainFile = 'index.html';
const batchFiles = [
  'data-451-500.js',
  'data-501-550.js',
  'data-551-600.js',
  'data-601-650.js',
  'data-651-700.js',
  'data-701-750.js',
  'data-751-800.js',
  'data-801-850.js',
  'data-851-900.js',
  'data-901-950.js',
  'data-951-1000.js',
];

// Backup
const ts = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = `index.html.bak-${ts}`;
fs.copyFileSync(mainFile, backupFile);
console.log('Backup:', backupFile);

let main = fs.readFileSync(mainFile, 'utf8');

// Find the itineraries array: const itineraries = [ ... ];
const match = main.match(/const itineraries = \[[\s\S]*?\n\];/);
if (!match) {
  console.error('Cannot find itineraries array');
  process.exit(1);
}

let allBatchItems = [];
for (const f of batchFiles) {
  const content = fs.readFileSync(f, 'utf8');
  // extract array contents between const batch = [ ... ];
  const m = content.match(/const batch = \[([\s\S]*?)\n\];/);
  if (!m) {
    console.error('Cannot parse', f);
    process.exit(1);
  }
  let items = m[1].trimEnd();
  // Ensure last item ends with a comma so the next batch/comment is valid
  if (!items.endsWith(',')) {
    items += ',';
  }
  allBatchItems.push(`\n  // ===== ${f.replace(/data-|\.js/g, '').replace('-', '-') } batch =====`);
  allBatchItems.push(items);
  console.log('Loaded', f);
}

// Replace the closing ]; of itineraries array with batch items + ];
const insert = ',\n' + allBatchItems.join('\n') + '\n];';
const newArray = match[0].replace(/\n\];$/, insert);

main = main.replace(match[0], newArray);
fs.writeFileSync(mainFile, main);
console.log('Merged batch items into', mainFile);

// Verify
const verifyContent = fs.readFileSync(mainFile, 'utf8');
const verifyMatch = verifyContent.match(/const itineraries = \[[\s\S]*?\n\];/);
const arr = eval(verifyMatch[0].replace('const itineraries =', '').replace(/;$/, ''));
console.log('Total itineraries:', arr.length);
console.log('Last ID:', arr[arr.length-1].id);
const regionCounts = {};
arr.forEach(i => { regionCounts[i.region] = (regionCounts[i.region] || 0) + 1; });
console.log('Region counts:', regionCounts);
const levels = {};
arr.forEach(i => { levels[i.budgetLevel] = (levels[i.budgetLevel] || 0) + 1; });
console.log('BudgetLevel counts:', levels);
