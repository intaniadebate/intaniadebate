import { initYearNavigation } from './year-navigation.js';
const root = document.documentElement;
const boundImages = new WeakSet();
function initMedia(scope = document) {
scope.querySelectorAll('img[data-media-fallback]').forEach(image => {
  if (boundImages.has(image)) return;
  boundImages.add(image);
  const fallbackImage = () => {
    const fallback = image.dataset.mediaFallback;
    if (fallback && !image.dataset.fallbackUsed && new URL(image.currentSrc || image.src, location.origin).pathname !== fallback) {
      image.dataset.fallbackUsed = 'true'; image.removeAttribute('srcset'); image.src = fallback; return;
    }
    const placeholder = document.createElement('div');
    placeholder.className = `photo-placeholder ${image.className}`;
    placeholder.setAttribute('role', 'img'); placeholder.setAttribute('aria-label', image.alt || 'ภาพไม่พร้อมแสดง');
    const label = document.createElement('span'); label.textContent = 'INTANIA · ภาพไม่พร้อมแสดง'; placeholder.append(label); image.replaceWith(placeholder);
  };
  image.addEventListener('error', fallbackImage);
  if (image.complete && !image.naturalWidth) fallbackImage();
});
}
initMedia();
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let paused = root.dataset.motion === 'paused';
try { paused = localStorage.getItem('intania-motion') === 'paused'; } catch {}
function updateMotion() {
  const stopped = paused || reduced.matches;
  root.dataset.motion = stopped ? 'paused' : 'playing';
  document.querySelectorAll('.motion-toggle').forEach(button => {
    button.textContent = reduced.matches ? 'ลดการเคลื่อนไหวตามระบบ' : `การเคลื่อนไหว: ${stopped ? 'ปิด' : 'เปิด'}`;
    button.setAttribute('aria-pressed', String(!stopped));
    button.disabled = reduced.matches;
  });
}
updateMotion();
reduced.addEventListener('change', updateMotion);
document.querySelectorAll('.motion-toggle').forEach(button => button.addEventListener('click', () => { paused = !paused; try { localStorage.setItem('intania-motion', paused ? 'paused' : 'playing'); } catch {} updateMotion(); }));
document.querySelectorAll('[data-tone]').forEach(button => {
  button.setAttribute('aria-pressed', String(button.dataset.tone === root.dataset.theme));
  button.addEventListener('click', () => {
    root.dataset.theme = button.dataset.tone;
    try { localStorage.setItem('intania-design-tone', button.dataset.tone); } catch {}
    document.querySelectorAll('[data-tone]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  });
});
document.querySelectorAll('.mobile-menu a').forEach(link => link.addEventListener('click', () => document.querySelector('.mobile-menu').open = false));
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  document.querySelectorAll('[data-category]').forEach(item => { item.hidden = button.dataset.filter !== 'all' && item.dataset.category !== button.dataset.filter; });
}));
const rivalBody = document.querySelector('[data-rival-body]');
if (rivalBody) {
  const yearFilter = document.querySelector('[data-rival-year]');
  const eventFilter = document.querySelector('[data-rival-event]');
  const rows = [...rivalBody.querySelectorAll('[data-rival-row]')];
  const updateRivals = () => {
    const values = rows.map(row => {
      const items = [...row.querySelectorAll('[data-rival-match]')];
      const shown = items.filter(item => {
        const visible = (yearFilter.value === 'all' || item.dataset.year === yearFilter.value) && (eventFilter.value === 'all' || item.dataset.event === eventFilter.value);
        item.hidden = !visible; return visible;
      });
      const wins = shown.filter(item => item.dataset.result === 'ชนะ').length;
      const losses = shown.filter(item => item.dataset.result === 'แพ้').length;
      row.querySelector('[data-total]').textContent = shown.length;
      row.querySelector('[data-wins]').textContent = wins;
      row.querySelector('[data-losses]').textContent = losses;
      row.querySelector('.rival-meter i').style.setProperty('--loss-share', `${shown.length ? losses / shown.length * 100 : 0}%`);
      row.hidden = shown.length === 0;
      return { row, wins, losses, total: shown.length };
    }).sort((a, b) => b.losses - a.losses || b.total - a.total || a.row.dataset.name.localeCompare(b.row.dataset.name, 'th'));
    let rank = 0;
    values.forEach(value => { if (value.total) value.row.querySelector('[data-rank]').textContent = String(++rank).padStart(2, '0'); rivalBody.append(value.row); });
    document.querySelector('[data-rival-status]').textContent = `${rank} คณะที่เคยพบกัน`;
    document.querySelector('[data-rival-empty]').hidden = rank !== 0;
  };
  yearFilter.addEventListener('change', updateRivals); eventFilter.addEventListener('change', updateRivals);
}
const albumYear = document.querySelector('[data-album-year]');
if (albumYear) {
  const type = document.querySelector('[data-album-type]');
  const requestedYear = new URLSearchParams(location.search).get('year');
  if ([...albumYear.options].some(option => option.value === requestedYear)) albumYear.value = requestedYear;
  const updateAlbums = () => {
    let count = 0;
    document.querySelectorAll('[data-album-card]').forEach(card => {
      card.hidden = !((albumYear.value === 'all' || card.dataset.year === albumYear.value) && (type.value === 'all' || card.dataset.type === type.value));
      if (!card.hidden) count++;
    });
    document.querySelector('[data-album-empty]').hidden = count !== 0;
    document.querySelector('[data-album-status]').textContent = `${count} เรื่องราว`;
  };
  albumYear.addEventListener('change', updateAlbums); type.addEventListener('change', updateAlbums); updateAlbums();
}
const observer = 'IntersectionObserver' in window && !reduced.matches
  ? new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-inview'); observer.unobserve(entry.target); } }), { threshold: 0.12 })
  : null;
function observeCards(scope = document) {
  scope.querySelectorAll('.match-card,.member-card,.chapter-entry,.album-card').forEach(item => observer?.observe(item));
}
observeCards();
initYearNavigation(workspace => { initMedia(workspace); observeCards(workspace); });
