// Keep the shared page in place while loading another static year page.
// Every control remains a real URL for new tabs, sharing and no-JS navigation.
export function initYearNavigation(onSwap) {
  const surface = () => document.querySelector('[data-year-surface]');
  if (!surface()) return;
  const kind = surface().dataset.yearSurface;
  const announcement = document.querySelector('[data-year-announcement]');
  const cache = new Map();
  let pending;
  let lastUrl = location.href;
  const position = () => ({ x: window.scrollX, y: window.scrollY });
  const saveCurrent = () => history.replaceState({ ...history.state, intaniaYear: { kind, ...position() } }, '', location.href);
  saveCurrent();
  history.scrollRestoration = 'manual';
  let scrollFrame;
  window.addEventListener('scroll', () => {
    if (pending || scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = null;
      if (!pending && history.state?.intaniaYear?.kind === kind) saveCurrent();
    });
  }, { passive: true });

  async function navigate(href, { pop = false, restore = null, focus = false } = {}) {
    const url = new URL(href, location.href);
    if (url.origin !== location.origin) return;
    if (!pop && url.pathname.replace(/\/$/, '') === location.pathname.replace(/\/$/, '')) return;
    pending?.abort();
    const controller = new AbortController();
    pending = controller;
    const before = surface();
    const saved = restore || position();
    before.querySelector('.year-navigation')?.setAttribute('aria-busy', 'true');
    const loading = before.querySelector('[data-year-loading]');
    if (loading) loading.textContent = 'กำลังเปิดปี…';
    if (announcement) announcement.textContent = 'กำลังเปิดข้อมูลประจำปี';
    try {
      let html = cache.get(url.pathname);
      if (!html) {
        const response = await fetch(url.href, { signal: controller.signal, credentials: 'same-origin' });
        if (!response.ok) throw new Error('Year unavailable');
        html = await response.text();
        cache.set(url.pathname, html);
      }
      if (controller.signal.aborted) return;
      const page = new DOMParser().parseFromString(html, 'text/html');
      const replacement = page.querySelector('[data-year-surface]');
      if (!replacement || replacement.dataset.yearSurface !== kind) throw new Error('Different page type');
      if (!pop) {
        saveCurrent();
        history.pushState({ intaniaYear: { kind, ...saved } }, '', url.href);
      }
      // A short year must not collapse the page before scroll position is restored.
      const oldHeight = before.getBoundingClientRect().height;
      replacement.style.minHeight = `${oldHeight}px`;
      before.replaceWith(replacement);
      document.title = page.title;
      const canonical = document.querySelector('link[rel="canonical"]');
      const nextCanonical = page.querySelector('link[rel="canonical"]');
      if (canonical && nextCanonical) canonical.href = nextCanonical.href;
      lastUrl = url.href;
      onSwap?.(replacement);
      if (focus) {
        const control = matchMedia('(max-width: 800px)').matches
          ? replacement.querySelector('[data-year-navigation]')
          : replacement.querySelector('[data-year-link][aria-current="page"]');
        control?.focus({ preventScroll: true });
      }
      window.scrollTo({ left: saved.x, top: saved.y, behavior: 'instant' });
      requestAnimationFrame(() => {
        replacement.style.minHeight = '';
        window.scrollTo({ left: saved.x, top: saved.y, behavior: 'instant' });
      });
      if (announcement) announcement.textContent = `แสดงข้อมูลปี ${replacement.dataset.selectedYear} แล้ว`;
    } catch (error) {
      if (error.name !== 'AbortError') location.assign(url.href);
    } finally {
      if (pending === controller) {
        surface()?.querySelector('.year-navigation')?.removeAttribute('aria-busy');
        const status = surface()?.querySelector('[data-year-loading]');
        if (status) status.textContent = '';
        pending = null;
      }
    }
  }

  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-year-link]');
    if (!link || !surface()?.contains(link) || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank' || link.hasAttribute('download')) return;
    event.preventDefault();
    void navigate(link.href, { focus: true });
  });
  document.addEventListener('change', event => {
    if (event.target.matches('[data-year-navigation]')) void navigate(event.target.value, { focus: true });
  });
  window.addEventListener('popstate', event => {
    if (event.state?.intaniaYear?.kind !== kind) return;
    if (new URL(lastUrl).pathname === location.pathname) {
      pending?.abort();
      pending = null;
      lastUrl = location.href;
      window.scrollTo({ left: event.state.intaniaYear.x, top: event.state.intaniaYear.y, behavior: 'instant' });
      return;
    }
    void navigate(location.href, { pop: true, restore: event.state.intaniaYear });
  });
}
