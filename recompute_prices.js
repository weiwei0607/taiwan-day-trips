const fs = require('fs');

const mainFile = 'index.html';
const content = fs.readFileSync(mainFile, 'utf8');

const match = content.match(/const itineraries = \[[\s\S]*?\n\];/);
if (!match) {
  console.error('Cannot find itineraries array');
  process.exit(1);
}
const itineraries = eval(match[0].replace('const itineraries =', '').replace(/;$/, ''));

function extractPrice(str) {
  if (!str) return null;
  const m = String(str).match(/NT\$([\d,]+)/);
  return m ? parseInt(m[1].replace(/,/g, ''), 10) : null;
}

function getTransportCost(it) {
  const types = it.transportTypes || [];
  const region = it.region || '北部';
  const text = (it.title || '') + ' ' + JSON.stringify(it.stops);
  let min = 0, max = 0;

  const has = t => types.includes(t);
  const textHas = s => text.includes(s);

  if (has('捷運')) { min += 90; max += 150; }

  if (has('台鐵')) {
    if (region === '北部') { min += 80; max += 260; }
    else if (region === '中部') { min += 350; max += 800; }
    else if (region === '南部') { min += 700; max += 1600; }
    else if (region === '東部') { min += 600; max += 1500; }
  }

  if (has('高鐵')) {
    if (region === '中部') { min += 750; max += 1300; }
    else if (region === '南部') { min += 1450; max += 2600; }
    else if (region === '東部') { min += 750; max += 1300; }
    else { min += 750; max += 1300; }
  }

  if (has('公車')) {
    if (textHas('客運') || textHas('巴士') || textHas('墾丁快線') || textHas('國光') || textHas('統聯')) {
      min += 250; max += 900;
    } else { min += 80; max += 250; }
  }

  if (has('客運')) { min += 250; max += 900; }

  if (has('船')) {
    if (textHas('蘭嶼') || textHas('綠島') || textHas('澎湖') || textHas('馬祖') || textHas('金門') || textHas('小琉球')) {
      min += 800; max += 2600;
    } else { min += 300; max += 1200; }
  }

  if (has('飛機')) { min += 2500; max += 5500; }

  if (textHas('計程車') || textHas('taxi') || textHas('Taxi')) { min += 200; max += 800; }

  if (textHas('租車') || textHas('租機車') || textHas('租腳踏車')) { min += 200; max += 600; }

  return [min, max];
}

function recompute(it) {
  const text = JSON.stringify(it);
  let mealMin = 0, mealMax = 0;
  let ticketMin = 0, ticketMax = 0;
  let otherMin = 0, otherMax = 0;

  it.stops.forEach(stop => {
    if (stop.options && stop.options.length) {
      const prices = stop.options.map(o => extractPrice(o.price)).filter(p => p !== null);
      if (prices.length) {
        mealMin += Math.min(...prices);
        mealMax += Math.max(...prices);
      }
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

    const rentalMatch = combined.match(/租(?:車|機車|腳踏車|自行車).*?NT\$([\d,]+)/);
    if (rentalMatch) {
      const p = parseInt(rentalMatch[1].replace(/,/g, ''), 10);
      otherMin += p; otherMax += p;
    }

    const activityPrices = [
      { regex: /天燈\s*NT\$([\d,]+)/ },
      { regex: /划船\s*NT\$([\d,]+)/ },
      { regex: /獨木舟\s*NT\$([\d,]+)/ },
      { regex: /浮潛\s*NT\$([\d,]+)/ },
      { regex: /纜車\s*NT\$([\d,]+)/ },
      { regex: /溫泉\s*NT\$([\d,]+)/ },
    ];
    activityPrices.forEach(a => {
      const am = combined.match(a.regex);
      if (am) {
        const p = parseInt(am[1].replace(/,/g, ''), 10);
        otherMin += p; otherMax += p;
      }
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

let newContent = content;
let changed = 0;

itineraries.forEach(it => {
  if (it.id < 701 || it.id > 1000) return;

  const computed = recompute(it);
  if (computed.budget !== it.budget || computed.budgetLevel !== it.budgetLevel) {
    const idPattern = new RegExp(
      `(id:\\s*${it.id},[\\s\\S]{0,1200}?budget:\\s*")[^"]+("[\\s\\S]{0,400}?budgetLevel:\\s*")[^"]+(")`,
      'g'
    );
    const replaced = newContent.replace(idPattern, (match, p1, p2, p3) => {
      return `${p1}${computed.budget}${p2}${computed.budgetLevel}${p3}`;
    });
    if (replaced !== newContent) {
      newContent = replaced;
      changed++;
    } else {
      console.warn('Could not replace id', it.id);
    }
  }
});

fs.writeFileSync(mainFile, newContent);
console.log(`Updated ${changed} itineraries (701-1000)`);

const verifyMatch = newContent.match(/const itineraries = \[[\s\S]*?\n\];/);
const arr = eval(verifyMatch[0].replace('const itineraries =', '').replace(/;$/, ''));
const levels = {};
arr.forEach(i => { levels[i.budgetLevel] = (levels[i.budgetLevel] || 0) + 1; });
console.log('budgetLevel distribution:', levels);
console.log('Total:', arr.length);
