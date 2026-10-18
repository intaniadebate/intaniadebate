// Image URLs come from the approved media catalogue, never from query strings.
export function safePhotoUrl(value, origin) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value, origin);
    if (url.username || url.password || !['https:', 'http:'].includes(url.protocol)) return null;
    return url.origin === origin || url.protocol === 'https:' ? url.href : null;
  } catch { return null; }
}

export function installPhotoViewer({ win, doc }) {
  const dialog = doc.querySelector('[data-photo-viewer]');
  if (!dialog || typeof dialog.showModal !== 'function') return null;
  const photo = dialog.querySelector('img');
  const caption = dialog.querySelector('[data-photo-caption]');
  const status = dialog.querySelector('[data-photo-status]');
  const steps = [...dialog.querySelectorAll('[data-photo-step]')];
  let albums = [];
  try { albums = JSON.parse(doc.querySelector('[data-gallery-data]')?.textContent || '[]'); } catch {}
  if (!Array.isArray(albums)) albums = [];
  let current; let index = 0; let opener; let method = 'open'; let reported = false;
  const context = () => ({ section: current.section, year: current.year, album_id: current.album_id, member_id: current.member_id, image_id: current.photos[index].id, method });
  const announce = name => win.dispatchEvent(new win.CustomEvent(`intania:${name}`, { detail: context() }));
  const show = () => {
    reported = false;
    const image = current.photos[index];
    status.textContent = `กำลังโหลดภาพ · ${index + 1} / ${current.photos.length}`;
    caption.textContent = image.caption || image.alt || '';
    photo.alt = image.alt || '';
    photo.src = image.src;
    steps.forEach(button => { button.disabled = current.photos.length < 2; });
  };
  function open(collection, button) {
    const photos = collection.photos.map(image => ({ ...image, src: safePhotoUrl(image.src, win.location.origin) })).filter(image => image.src);
    if (!photos.length || dialog.open) return false;
    current = { ...collection, photos }; index = 0; opener = button; method = 'open';
    dialog.showModal();
    if (current.album_id) announce('album-open');
    else announce('photo-open');
    show();
    return true;
  }
  function move(direction) {
    if (!dialog.open || !current || current.photos.length < 2) return;
    index = (index + direction + current.photos.length) % current.photos.length;
    method = direction > 0 ? 'next' : 'previous';
    announce('photo-navigate'); show();
  }
  photo.addEventListener('load', () => {
    if (!dialog.open || reported || !photo.naturalWidth || photo.src !== current.photos[index].src) return;
    reported = true;
    status.textContent = `ภาพ ${index + 1} / ${current.photos.length}`;
    announce('photo-view');
  });
  photo.addEventListener('error', () => { if (dialog.open) status.textContent = 'โหลดภาพไม่สำเร็จ ลองดูภาพถัดไปหรือเปิดใหม่อีกครั้ง'; });
  doc.addEventListener('click', event => {
    if (event.button !== 0) return;
    const album = event.target.closest?.('[data-gallery-open]');
    if (album) {
      const item = albums.find(item => item.id === album.dataset.galleryOpen);
      if (item) open({ ...item, section: 'memories', album_id: item.id }, album);
      return;
    }
    const button = event.target.closest?.('[data-photo-open]');
    if (!button) return;
    open({ section: button.dataset.photoSection, year: button.dataset.photoYear, member_id: button.dataset.memberId,
      photos: [{ id: button.dataset.photoOpen, src: button.dataset.photoSrc, alt: button.dataset.photoAlt }] }, button);
  });
  dialog.querySelector('[data-photo-close]').addEventListener('click', () => dialog.close());
  steps.forEach(button => button.addEventListener('click', () => move(Number(button.dataset.photoStep))));
  dialog.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key) || event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1);
  });
  // Safari fallback: dismiss only outside the content box, never on its padding.
  if (!('closedBy' in win.HTMLDialogElement.prototype)) dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    if (current) { method = 'close'; announce('photo-close'); }
    photo.removeAttribute('src');
    if (opener?.isConnected) opener.focus({ preventScroll: true });
    current = null;
  });
  win.addEventListener('intania:year-changed', () => { if (dialog.open) dialog.close(); });
  return { open, move };
}
