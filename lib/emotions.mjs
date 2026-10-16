// A transparent personal tracking heuristic, not a clinical assessment.
export function validate(data) {
  if (data?.schemaVersion !== 1 || !Array.isArray(data.events)) throw Error('Expected schemaVersion 1 and events array');
  const ids = new Set();
  for (const e of data.events) {
    if (!e.id || typeof e.id !== 'string' || ids.has(e.id)) throw Error('Missing or duplicate event ID');
    ids.add(e.id);
    if (typeof e.title !== 'string' || !e.title.trim()) throw Error('Event title required');
    if (!['positive','negative'].includes(e.valence) || !['active','closed'].includes(e.status)) throw Error('Invalid valence or status');
    if (!Number.isFinite(Date.parse(e.peakAt)) || !Number.isFinite(e.intensity) || e.intensity < 0 || e.intensity > 10) throw Error('Invalid peak');
    if (!Array.isArray(e.riskFactors) || e.riskFactors.length !== 4 || e.riskFactors.some(n => !Number.isInteger(n) || n < 0 || n > 6)) throw Error('Four risk factors from 0 to 6 required');
    if (!Array.isArray(e.followups)) throw Error('Followups required');
    for (const f of e.followups) if (!Number.isFinite(Date.parse(f.at)) || Date.parse(f.at) < Date.parse(e.peakAt) || !Number.isFinite(f.mood) || f.mood < -10 || f.mood > 10) throw Error('Invalid followup');
  }
  return data;
}
export function analyze(data, now = new Date()) {
  validate(data);
  const events = data.events.map(e => {
    const followups = [...e.followups].filter(f => Date.parse(f.at) <= +now).sort((a,b) => Date.parse(a.at)-Date.parse(b.at));
    const score = e.riskFactors.reduce((a,b)=>a+b,0);
    const started = Date.parse(e.peakAt) <= +now;
    return {...e, score, current: e.status === 'active' && started, high: score >= 21,
      latestMood: followups.at(-1)?.mood ?? null,
      delayed: followups.map(f => ({...f, hours: (Date.parse(f.at)-Date.parse(e.peakAt))/3600000}))};
  });
  const active = events.filter(e => e.current);
  const historical = events.filter(e => e.status === 'closed');
  return {events, activeHigh: active.filter(e=>e.high), historicalHigh: historical.filter(e=>e.high),
    activeMax: active.length ? Math.max(...active.map(e=>e.score)) : null,
    historicalMax: historical.length ? Math.max(...historical.map(e=>e.score)) : null,
    positivePeak: Math.max(0,...events.filter(e=>e.valence==='positive' && Date.parse(e.peakAt)<=+now).map(e=>e.intensity)),
    negativePeak: Math.max(0,...events.filter(e=>e.valence==='negative' && Date.parse(e.peakAt)<=+now).map(e=>e.intensity))};
}
export function merge(current, incoming) {
  validate(current); validate(incoming);
  const map = new Map(current.events.map(e=>[e.id,e]));
  for (const e of incoming.events) {
    if (map.has(e.id) && JSON.stringify(map.get(e.id)) !== JSON.stringify(e)) throw Error(`Conflicting event ID: ${e.id}; resolve explicitly before import`);
    map.set(e.id,e);
  }
  return {...current, events:[...map.values()]};
}
