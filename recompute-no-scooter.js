const fs = require('fs');
const mainFile = 'index.html';
let content = fs.readFileSync(mainFile, 'utf8');

const match = content.match(/const itineraries = \[[\s\S]*?\n\];/);
if (!match) { console.error('Could not find itineraries array'); process.exit(1); }
const itineraries = eval(match[0].replace('const itineraries =', ''));

function extractPrice(str) {
  if (!str) return null;
  const m = str.match(/NT\$([\d,]+)/);
  if (!m) return null;
  return parseInt(m[1].replace(/,/g, ''), 10);
}

function getTransportCost(it) {
  const types = it.transportTypes || [];
  const region = it.region;
  let min = 0, max = 0;
  const add = (t, a, b) => { if (types.includes(t)) { min += a; max += b; } };
  if (region === '北部') {
    add('捷運', 80, 200); add('台鐵', 100, 400); add('高鐵', 400, 1500); add('公車', 50, 150);
    add('船', 400, 1200); add('飛機', 2500, 5000);
  } else if (region === '中部') {
    add('台鐵', 150, 500); add('高鐵', 700, 1800); add('公車', 50, 200);
    add('船', 300, 900); add('飛機', 2000, 4500);
  } else if (region === '南部') {
    add('台鐵', 150, 600); add('高鐵', 700, 1800); add('公車', 50, 200);
    add('船', 300, 1000); add('飛機', 2500, 5000);
  } else if (region === '東部') {
    add('台鐵', 200, 800); add('公車', 80, 250); add('船', 400, 1200);
    add('飛機', 2000, 4500);
  }
  if (min === 0) { min = 50; max = 150; }
  return [min, max];
}

function recompute(it) {
  let mealMin = 0, mealMax = 0;
  let ticketMin = 0, ticketMax = 0;
  let otherMin = 0, otherMax = 0;

  it.stops.forEach(stop => {
    if (stop.options && stop.options.length) {
      const prices = stop.options.map(o => extractPrice(o.price)).filter(p => p !== null);
      if (prices.length) { mealMin += Math.min(...prices); mealMax += Math.max(...prices); }
    }
    const desc = stop.desc || '';
    const name = stop.name || '';
    const combined = name + ' ' + desc;
    const ticketMatches = combined.match(/門票\s*NT\$([\d,]+)/g);
    if (ticketMatches) {
      ticketMatches.forEach(tm => {
        const p = parseInt(tm.match(/NT\$([\d,]+)/)[1].replace(/,/g, ''), 10);
        ticketMin += p; ticketMax += p;
      });
    }
    const rentalMatch = combined.match(/租(?:車|腳踏車|自行車).*?NT\$([\d,]+)/);
    if (rentalMatch) { const p = parseInt(rentalMatch[1].replace(/,/g, ''), 10); otherMin += p; otherMax += p; }
    [
      /天燈\s*NT\$([\d,]+)/,
      /划船\s*NT\$([\d,]+)/,
      /獨木舟\s*NT\$([\d,]+)/,
      /浮潛\s*NT\$([\d,]+)/,
      /纜車\s*NT\$([\d,]+)/,
      /溫泉\s*NT\$([\d,]+)/,
    ].forEach(re => {
      const am = combined.match(re);
      if (am) { const p = parseInt(am[1].replace(/,/g, ''), 10); otherMin += p; otherMax += p; }
    });
  });

  const mealStops = it.stops.filter(s => s.options && s.options.length).length;
  if (mealStops <= 1) { mealMin += 30; mealMax += 120; }

  const [transMin, transMax] = getTransportCost(it);
  const totalMin = transMin + mealMin + ticketMin + otherMin;
  const totalMax = transMax + mealMax + ticketMax + otherMax;

  const round = n => Math.max(50, Math.round(n / 50) * 50);
  const minR = round(totalMin);
  const maxR = round(Math.max(totalMax, totalMin + 150));
  const midpoint = (minR + maxR) / 2;
  let level;
  if (midpoint < 600) level = 'low';
  else if (midpoint <= 1200) level = 'mid';
  else level = 'high';

  return { budget: `NT$${minR}–${maxR}`, budgetLevel: level };
}

const targetIds = [144, 148, 164, 233, 329, 344, 345, 353, 358, 370, 605, 651, 655, 656, 657, 658, 659, 660, 661, 662, 683, 684, 685];
let changed = 0;

targetIds.forEach(id => {
  const it = itineraries.find(x => x.id === id);
  if (!it) return;
  const computed = recompute(it);
  console.log('ID', id, 'computed:', computed.budget, computed.budgetLevel);
  const idPattern = new RegExp(
    `(id:\\s*${id},[\\s\\S]{0,20000}?budget:\\s*")[^"]+("[\\s\\S]{0,40000}?budgetLevel:\\s*")[^"]+(")`,
    'g'
  );
  const replaced = content.replace(idPattern, (match, p1, p2, p3) => {
    return p1 + computed.budget + p2 + computed.budgetLevel + p3;
  });
  if (replaced !== content) {
    content = replaced;
    changed++;
  } else {
    console.warn('Could not replace id', id);
  }
});

fs.writeFileSync(mainFile, content);
console.log(`Updated ${changed} itineraries`);
