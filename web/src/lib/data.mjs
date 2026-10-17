export const years = Array.from({ length: 10 }, (_, i) => 2017 + i);
export const events = { freshy: 'CU Freshy Debate', visionary: 'The Visionary Debate' };
export const isKnown = value => Boolean(value && !/^(ไม่พบ|ยังไม่|ไม่ปรากฏ|—)/.test(String(value)));
export const awardText = value => {
  const label = String(value || '').replace(/^ไม่พบข้อมูล\s*[-–—]?\s*/, '').trim();
  return isKnown(label) ? label : '';
};
export const roundName = order => ({ 1: 'รอบคัดเลือก 1', 2: 'รอบคัดเลือก 2', 2.5: 'รอบคัดเลือกรอบพิเศษ', 3: 'รอบ 8 ทีม', 4: 'รอบรองชนะเลิศ', 5: 'ชิงอันดับ 3', 6: 'รอบชิงชนะเลิศ' }[order] || 'รอบที่ 2');
export const seasonMatches = (matches, year) => matches.filter(m => m.year === year).sort((a, b) => a.order - b.order || a.sequence - b.sequence);
export const resultSummary = matches => ({ total: matches.length, wins: matches.filter(m => m.result === 'ชนะ').length, losses: matches.filter(m => m.result === 'แพ้').length });
export function rivals(matches, { year = 'all', event = 'all' } = {}) {
  const groups = new Map();
  for (const match of matches) {
    if ((year !== 'all' && match.year !== Number(year)) || (event !== 'all' && match.eventId !== event)) continue;
    const name = match.opponent.replace(/\s*\(.*$/, '').trim();
    if (!name || name.startsWith('ไม่พบ')) continue;
    const group = groups.get(name) || { name, matches: [], wins: 0, losses: 0 };
    group.matches.push(match);
    if (match.result === 'ชนะ') group.wins++;
    if (match.result === 'แพ้') group.losses++;
    groups.set(name, group);
  }
  return [...groups.values()].sort((a, b) => b.losses - a.losses || b.matches.length - a.matches.length || a.name.localeCompare(b.name, 'th'));
}
export function safeExternalUrl(value) {
  try { const u = new URL(value); return u.protocol === 'https:' ? u.href : null; } catch { return null; }
}
export function validateData(competition, roster, albums, media) {
  const ids = new Set();
  for (const match of competition.matches) {
    if (ids.has(match.id)) throw new Error(`Duplicate match ID: ${match.id}`);
    ids.add(match.id);
    if (!years.includes(match.year) || !['ชนะ', 'แพ้'].includes(match.result)) throw new Error(`Invalid Excel match: ${match.id}`);
    if (!events[match.eventId]) throw new Error(`Unknown event: ${match.id}`);
  }
  for (const year of years) {
    const team = roster.find(r => r.year === year);
    if (!team || team.members.length !== 6) throw new Error(`Roster ${year} must have six members`);
    if (new Set(team.members.map(m => m.id)).size !== 6) throw new Error(`Duplicate member in ${year}`);
  }
  for (const album of albums) {
    if (!album.id || !years.includes(album.year) || !album.title || !album.photos?.length) throw new Error('Invalid album');
    for (const key of album.photos) if (!media[key]) throw new Error(`Missing album media: ${key}`);
  }
  for (const [key, asset] of Object.entries(media)) {
    if (!(asset.width > 0 && asset.height > 0) || !asset.alt) throw new Error(`Incomplete media dimensions/alt: ${key}`);
  }
}
