const fs = require('fs');

let f = fs.readFileSync('index.html', 'utf8');

// Transport types and descriptions
f = f.replace(/transport: "飛機\+機車"/g, 'transport: "飛機+公車"');
f = f.replace(/transport: "船\+機車"/g, 'transport: "船+公車"');
f = f.replace(/transport: "台鐵\+機車"/g, 'transport: "台鐵+公車"');
f = f.replace(/transport: "台鐵\+租機車"/g, 'transport: "台鐵+公車"');
f = f.replace(/transportTypes: \["飛機", "機車"\]/g, 'transportTypes: ["飛機", "公車"]');
f = f.replace(/transportTypes: \["船", "機車"\]/g, 'transportTypes: ["船", "公車"]');

// Stops descriptions - careful replacements
f = f.replace(/租機車或腳踏車/g, '租腳踏車');
f = f.replace(/租機車環島/g, '搭公車環島');
f = f.replace(/騎機車環島/g, '搭公車環島');
f = f.replace(/騎機車繞/g, '搭公車繞');
f = f.replace(/騎機車過橋/g, '搭公車過橋');
f = f.replace(/租機車出發/g, '搭公車出發');
f = f.replace(/租機車跨/g, '搭公車跨');
f = f.replace(/機車租金NT\$\d+/g, '公車約NT$100');
f = f.replace(/機車NT\$\d+/g, '公車約NT$100');
f = f.replace(/，機車/g, '，公車');
f = f.replace(/租機車/g, '搭公車');
f = f.replace(/全台唯一機車環島小島/g, '適合搭公車或步行環島的小島');
f = f.replace(/搭計程車或騎機車/g, '搭計程車或公車');

fs.writeFileSync('index.html', f);
console.log('Removed scooter references');
