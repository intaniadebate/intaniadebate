export const CONSENT_KEY = 'intania-analytics-consent-v1';
export const CONSENT_DAYS = 180;
const consentLifetime = CONSENT_DAYS * 86400000;
const denied = { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };

export const validMeasurementId = value => /^G-[A-Z0-9]{6,20}$/.test(value || '');
const validId = value => typeof value === 'string' && /^[a-z0-9_-]{1,80}$/i.test(value);
const validYear = value => /^20\d{2}$/.test(String(value || ''));

export function pageContext(path, selectedYear) {
  const archive = path.match(/^\/(competitions|members)(?:\/(\d{4}))?$/);
  if (archive) return { section: archive[1], ...(validYear(archive[2] || selectedYear) ? { year: String(archive[2] || selectedYear) } : {}) };
  const article = path.match(/^\/posts\/([a-z0-9-]+)$/);
  if (article) return { section: 'news', article_slug: article[1] };
  return { section: path === '/memories' ? 'memories' : path === '/home' || path === '/' ? 'home' : 'information' };
}

// Explicit fields only: never send captions, personal names or source image URLs.
export function photoParameters(detail = {}) {
  if (!detail || typeof detail !== 'object') return null;
  if (!validId(detail.image_id) || !['members', 'competitions', 'news', 'memories'].includes(detail.section)) return null;
  if (!['open', 'next', 'previous', 'close'].includes(detail.method)) return null;
  const result = { image_id: detail.image_id, section: detail.section, method: detail.method };
  if (validYear(detail.year)) result.year = String(detail.year);
  if (validId(detail.album_id)) result.album_id = detail.album_id;
  if (/^20\d{2}-\d{2}$/.test(detail.member_id || '')) result.member_id = detail.member_id;
  return result;
}

// Only an explicit production origin can collect. Local previews never do.
export function analyticsEnabled({ production, measurementId, siteUrl, href }) {
  if (!production || !validMeasurementId(measurementId)) return false;
  try {
    const site = new URL(siteUrl);
    const current = new URL(href);
    return site.protocol === 'https:' && site.origin === current.origin;
  } catch { return false; }
}

// Never forward query strings, fragment content, credentials or arbitrary paths.
export function publicPage(value, origin) {
  try {
    const url = new URL(value, origin);
    if (url.origin !== origin) return null;
    const pathname = url.pathname.replace(/\/$/, '') || '/';
    if (!/^\/(?:home|credits|privacy|memories|competitions(?:\/\d{4})?|members(?:\/\d{4})?|posts\/(?:recruitment|workshop|why-join))?$/.test(pathname)) return null;
    return { page_location: `${origin}${pathname}`, page_path: pathname };
  } catch { return null; }
}

export function readConsent(storage, now = Date.now()) {
  try {
    const value = JSON.parse(storage.getItem(CONSENT_KEY));
    if (value?.version !== 1 || !['granted', 'denied'].includes(value.choice) ||
      !Number.isFinite(value.at) || value.at > now || now - value.at >= consentLifetime) return null;
    return value;
  } catch { return null; }
}

export function linkEvent(link, origin) {
  try {
    const url = new URL(link.href, origin);
    if (url.protocol !== 'https:' && url.origin !== origin) return null;
    const data = link.dataset || {};
    const instagram = ['www.instagram.com', 'instagram.com'].includes(url.hostname);
    if (url.origin !== origin) {
      if (instagram && url.pathname.replace(/\/$/, '') === '/intaniadebateclub') {
        return ['contact_click', { platform: 'instagram', contact_kind: 'club' }];
      }
      if (instagram && /^20\d{2}-\d{2}$/.test(data.memberId || '')) {
        return ['contact_click', { platform: 'instagram', contact_kind: 'member', member_id: data.memberId }];
      }
      if (instagram && validId(data.clubPost)) {
        return ['contact_click', { platform: 'instagram', contact_kind: 'news_source', article_slug: data.clubPost }];
      }
      if (link.matches('.match-video') && ['www.youtube.com', 'youtube.com', 'm.youtube.com', 'youtu.be'].includes(url.hostname)) {
        const id = url.hostname === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v') || url.searchParams.get('list');
        if (id && /^[\w-]{6,100}$/.test(id)) return ['video_click', { video_id: id }];
      }
      if (validId(data.contentId)) return ['source_click', { content_id: data.contentId, platform: instagram ? 'instagram' : /(^|\.)facebook\.com$/.test(url.hostname) ? 'facebook' : 'other' }];
      // An unannotated personal social profile is not part of club analytics.
      if (instagram) return null;
      return ['external_click', { platform: /(^|\.)youtube\.com$/.test(url.hostname) || url.hostname === 'youtu.be' ? 'youtube' : 'other' }];
    }
    const page = publicPage(url.href, origin);
    if (!page) return null;
    const context = pageContext(page.page_path);
    if (page.page_path === '/memories' && validYear(url.searchParams.get('year'))) context.year = url.searchParams.get('year');
    if (link.matches('[data-year-link]')) return context.year ? ['year_click', { ...context, method: 'link' }] : null;
    const article = page.page_path.match(/\/posts\/([^/]+)$/);
    const imageId = link.querySelector?.('[data-media-id]')?.dataset.mediaId;
    const image = validId(imageId) ? { image_id: imageId } : {};
    const anchor = /^#(?:about|news|rivals|main|match-20\d{2}-[a-z0-9-]+)$/.test(url.hash) ? { anchor_id: url.hash.slice(1) } : {};
    return article ? ['news_click', { article_slug: article[1], ...image }] : ['navigation_click', { destination: page.page_path, ...context, ...anchor, ...image }];
  } catch { return null; }
}

export function installAnalytics({ win, doc, measurementId, enabled, loadTag }) {
  const panel = doc.querySelector('[data-analytics-panel]');
  const settings = [...doc.querySelectorAll('[data-analytics-settings]')];
  const stateLabels = [...doc.querySelectorAll('[data-analytics-state]')];
  if (!enabled || !validMeasurementId(measurementId) || !publicPage(win.location.href, win.location.origin)) {
    stateLabels.forEach(label => { label.textContent = 'ขณะนี้ยังไม่เปิดเก็บสถิติบนหน้านี้'; });
    return null;
  }
  let consent;
  try { consent = readConsent(win.localStorage); } catch {}
  let started = false;
  let lastPage = null;
  let opener;
  let tag;
  const origin = win.location.origin;
  const disableKey = `ga-disable-${measurementId}`;
  win[disableKey] = true;
  const showState = () => stateLabels.forEach(label => {
    label.textContent = consent?.choice === 'granted' ? 'อนุญาตสถิติการใช้งานแล้ว' : 'ยังไม่อนุญาตสถิติการใช้งาน';
  });
  const command = (...args) => win.gtag(...args);
  function stop() {
    win[disableKey] = true;
    // Remove queued hits as well as the tag, including acceptance followed by
    // immediate withdrawal while the vendor script is still downloading.
    if (win.dataLayer) win.dataLayer.length = 0;
    tag?.remove();
    const names = doc.cookie.split(';').map(cookie => cookie.trim().split('=')[0]).filter(name => name === '_ga' || name === `_ga_${measurementId.slice(2)}`);
    const hostname = win.location.hostname.split('.');
    const domains = ['', ...hostname.slice(0, -1).map((_, i) => `; Domain=${hostname.slice(i).join('.')}`)];
    for (const name of names) for (const domain of domains) doc.cookie = `${name}=; Max-Age=0; Path=/${domain}; SameSite=Lax; Secure`;
  }
  function allowed() {
    if (consent?.choice !== 'granted') return false;
    if (Date.now() - consent.at >= consentLifetime) {
      consent = null; stop(); showState();
      if (panel) panel.hidden = false;
      if (started) win.location.reload();
      return false;
    }
    return true;
  }
  function emit(name, params = {}) {
    const page = publicPage(win.location.href, origin);
    if (!started || !allowed() || !page) return;
    const context = pageContext(page.page_path, doc.querySelector('[data-year-surface]')?.dataset.selectedYear);
    command('event', name, { ...context, ...params, ...page, send_to: measurementId });
  }
  function pageView() {
    const page = publicPage(win.location.href, origin);
    if (!page || !allowed() || page.page_location === lastPage) return;
    const referrer = lastPage || (() => {
      try { return new URL(doc.referrer).origin; } catch { return ''; }
    })();
    lastPage = page.page_location;
    // Keep GA's page context in sync without forwarding URL parameters.
    command('set', { ...page, page_referrer: referrer });
    emit('page_view', { page_referrer: referrer });
    const context = pageContext(page.page_path, doc.querySelector('[data-year-surface]')?.dataset.selectedYear);
    if (context.year) emit('year_view', context);
    if (context.article_slug) emit('news_view', context);
  }
  function start() {
    if (started || !allowed()) return;
    started = true;
    win[disableKey] = false;
    win.dataLayer = win.dataLayer || [];
    // gtag expects Arguments objects, as in Google's official bootstrap.
    win.gtag = function () { win.dataLayer.push(arguments); };
    command('consent', 'default', denied);
    command('consent', 'update', { ...denied, analytics_storage: 'granted' });
    command('js', new Date());
    const page = publicPage(win.location.href, origin);
    command('config', measurementId, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_domain: 'none', cookie_path: '/', cookie_expires: CONSENT_DAYS * 86400,
      cookie_update: false,
      page_location: page?.page_location || `${origin}/`,
      page_referrer: (() => { try { return new URL(doc.referrer).origin; } catch { return ''; } })(),
    });
    pageView();
    if (loadTag) tag = loadTag(measurementId);
    else {
      tag = doc.createElement('script');
      tag.async = true;
      tag.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      tag.referrerPolicy = 'no-referrer';
      doc.head.append(tag);
    }
  }
  function choose(choice) {
    if (!['granted', 'denied'].includes(choice)) return;
    const wasStarted = started;
    consent = { version: 1, choice, at: Date.now() };
    try { win.localStorage.setItem(CONSENT_KEY, JSON.stringify(consent)); } catch {}
    if (panel) panel.hidden = true;
    showState();
    if (choice === 'granted') start();
    else stop();
    opener?.focus({ preventScroll: true });
    // Restart the document to unload Google's already running timers/listeners.
    // No consent update or cookieless ping is sent on withdrawal.
    if (wasStarted && choice === 'denied') win.location.reload();
  }
  settings.forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => {
      opener = button;
      if (panel) { panel.hidden = false; panel.querySelector('[data-analytics-choice]')?.focus({ preventScroll: true }); }
    });
  });
  doc.querySelectorAll('[data-analytics-choice]').forEach(button => button.addEventListener('click', () => choose(button.dataset.analyticsChoice)));
  function click(event) {
    if (![0, 1].includes(event.button) || !allowed()) return;
    if (event.target.closest?.('[data-analytics-panel], [data-analytics-settings], [data-analytics-choice]')) return;
    const newsFilter = event.target.closest?.('[data-filter]');
    if (newsFilter && ['all', 'recruitment', 'activity'].includes(newsFilter.dataset.filter)) {
      emit('filter_change', { filter_name: 'news_category', filter_value: newsFilter.dataset.filter });
      return;
    }
    // The viewer reports successful opens/displays, not speculative click events.
    if (event.target.closest?.('[data-gallery-open], [data-photo-open], [data-photo-viewer]')) return;
    const link = event.target.closest?.('a[href]');
    if (link) {
      const tracked = linkEvent(link, origin);
      if (tracked) emit(...tracked);
      return;
    }
    const control = event.target.closest?.('button, summary, select');
    if (!control) return;
    const type = control.matches?.('.motion-toggle') ? 'motion_toggle' : control.matches?.('[data-tone]') ? 'theme_select' : control.closest?.('.match-details') ? 'match_details' : control.closest?.('.member-bio') ? 'member_bio' : control.closest?.('.mobile-menu') ? 'mobile_menu' : control.closest?.('.tone-panel') ? 'theme_menu' : control.tagName === 'SUMMARY' ? 'details' : control.tagName === 'SELECT' ? 'select' : 'button';
    emit('ui_click', { control_id: type });
  }
  doc.addEventListener('click', click);
  doc.addEventListener('auxclick', event => { if (event.button === 1) click(event); });
  // Capture toggle, which does not bubble, including details inserted on a year swap.
  doc.addEventListener('toggle', event => {
    if (!event.target.matches?.('.match-details') || !event.target.open) return;
    const id = event.target.closest('.match-item')?.id.replace(/^match-/, '');
    if (/^\d{4}-[a-z0-9-]+$/.test(id || '')) emit('match_open', { match_id: id });
  }, true);
  doc.addEventListener('change', event => {
    const control = event.target;
    if (control.matches?.('[data-year-navigation]')) {
      const page = publicPage(control.value, origin);
      const context = page && pageContext(page.page_path);
      if (context?.year) emit('year_click', { ...context, method: 'select' });
      return;
    }
    const filters = { rivalYear: 'rival_year', rivalEvent: 'rival_event', albumYear: 'album_year', albumType: 'album_type' };
    const name = Object.keys(filters).find(key => key in (control.dataset || {}));
    if (name && /^(?:all|\d{4}|freshy|visionary|meal|trip|graduation|other)$/.test(control.value)) {
      emit('filter_change', { filter_name: filters[name], filter_value: control.value });
    }
  });
  win.addEventListener('intania:album-open', event => {
    const detail = event.detail || {};
    if (validId(detail.album_id) && validYear(detail.year)) emit('album_open', { section: 'memories', album_id: detail.album_id, year: String(detail.year) });
  });
  for (const name of ['photo-open', 'photo-view', 'photo-navigate', 'photo-close']) win.addEventListener(`intania:${name}`, event => {
    const params = photoParameters(event.detail);
    if (params) emit(name.replaceAll('-', '_'), params);
  });
  win.addEventListener('intania:year-changed', event => {
    pageView();
    const { kind, year, source } = event.detail || {};
    if (['competitions', 'members'].includes(kind) && /^\d{4}$/.test(String(year)) && ['link', 'select'].includes(source)) {
      emit('year_select', { section: kind, year: String(year), method: source });
    }
  });
  win.addEventListener('storage', event => {
    if (event.key !== CONSENT_KEY && event.key !== null) return;
    let updated;
    try { updated = readConsent(win.localStorage); } catch {}
    consent = updated;
    showState();
    if (updated?.choice === 'granted') { if (panel) panel.hidden = true; start(); }
    else { stop(); if (panel) panel.hidden = Boolean(updated); if (started) win.location.reload(); }
  });
  showState();
  if (consent?.choice === 'granted') start();
  else if (!consent && panel) panel.hidden = false;
  return { choose, pageView };
}
