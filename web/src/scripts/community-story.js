const initialized = new WeakSet();
const HOLD = 6500;
const FADE = 1200;

export function initCommunityStories() {
  document.querySelectorAll('[data-community-story]').forEach(story => {
    if (initialized.has(story)) return;
    initialized.add(story);
    const slides = [...story.querySelectorAll('[data-story-slide]')];
    if (slides.length < 2) return;
    const button = story.querySelector('[data-story-playback]');
    const choices = [...story.querySelectorAll('[data-story-select]')];
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const connection = navigator.connection;
    const failed = new Set();
    const loading = new Map();
    let current = 0;
    let paused = Boolean(connection?.saveData);
    let visible = false;
    let busy = false;
    let timer;
    let finishFade;
    let request = 0;

    const motionBlocked = () => reduced.matches || document.documentElement.dataset.motion === 'paused';
    const canPlay = () => visible && !document.hidden && !paused && !motionBlocked() && failed.size < slides.length - 1;
    const updateButton = () => {
      const stopped = paused || motionBlocked();
      button.setAttribute('aria-pressed', String(stopped));
      button.disabled = motionBlocked() || failed.size >= slides.length - 1;
      button.querySelector('[data-story-playback-label]').textContent = motionBlocked() ? 'ภาพนิ่ง' : stopped ? 'เล่นภาพ' : 'หยุดภาพ';
      button.querySelector('[data-story-pause-icon]').toggleAttribute('hidden', stopped);
      button.querySelector('[data-story-play-icon]').toggleAttribute('hidden', !stopped);
    };
    const load = index => {
      if (loading.has(index)) return loading.get(index);
      const image = slides[index].querySelector('img');
      const pending = (async () => {
        if (image.dataset.src) {
          // Only hydrate the next needed frame; hidden frames never race the hero.
          image.loading = 'eager';
          image.fetchPriority = 'low';
          if (image.dataset.srcset) image.srcset = image.dataset.srcset;
          image.src = image.dataset.src;
          delete image.dataset.src;
        }
        try { await image.decode(); }
        catch {
          const fallback = image.dataset.fallback;
          if (!fallback || new URL(image.currentSrc || image.src, location.href).pathname === new URL(fallback, location.href).pathname) throw new Error('Image unavailable');
          image.removeAttribute('srcset');
          image.src = fallback;
          await image.decode();
        }
        if (!image.naturalWidth) throw new Error('Image unavailable');
      })().catch(() => {
        failed.add(index);
        choices[index].disabled = true;
        return false;
      });
      loading.set(index, pending);
      return pending;
    };
    const nextIndex = () => {
      for (let step = 1; step < slides.length; step++) {
        const index = (current + step) % slides.length;
        if (!failed.has(index)) return index;
      }
      return current;
    };
    const schedule = () => {
      clearTimeout(timer);
      updateButton();
      if (!canPlay() || busy) return;
      void load(nextIndex());
      timer = setTimeout(() => show(nextIndex()), HOLD);
    };
    const show = async (index, manual = false) => {
      clearTimeout(timer);
      clearTimeout(finishFade);
      slides.forEach(slide => slide.classList.remove('is-leaving'));
      const token = ++request;
      if (index === current) { busy = false; schedule(); return; }
      busy = true;
      const ready = await load(index);
      if (token !== request) return;
      if (ready === false || (!manual && !canPlay())) { busy = false; schedule(); return; }
      const previous = slides[current];
      // Keep the outgoing image opaque behind the incoming fade: no bright flash.
      previous.classList.remove('is-current');
      previous.classList.add('is-leaving');
      previous.setAttribute('aria-hidden', 'true');
      current = index;
      slides[current].classList.add('is-current');
      slides[current].removeAttribute('aria-hidden');
      story.querySelector('[data-story-caption]').textContent = slides[current].dataset.caption;
      story.querySelector('[data-story-count]').textContent = String(current + 1).padStart(2, '0');
      choices.forEach((choice, i) => i === current ? choice.setAttribute('aria-current', 'true') : choice.removeAttribute('aria-current'));
      if (manual) story.querySelector('[data-story-announcement]').textContent = `ภาพ ${current + 1} จาก ${slides.length}: ${slides[current].dataset.caption}`;
      finishFade = setTimeout(() => {
        previous.classList.remove('is-leaving');
        busy = false;
        schedule();
      }, motionBlocked() ? 0 : FADE);
    };
    choices.forEach((choice, index) => choice.addEventListener('click', () => {
      paused = true;
      updateButton();
      void show(index, true);
    }));
    button.addEventListener('click', () => { paused = !paused; schedule(); });
    document.addEventListener('visibilitychange', schedule);
    reduced.addEventListener('change', schedule);
    connection?.addEventListener('change', () => { if (connection.saveData) paused = true; schedule(); });
    new MutationObserver(schedule).observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => { visible = entries[0].isIntersecting; schedule(); }, { threshold: .15 }).observe(story);
    } else { visible = true; }
    story.querySelector('[data-story-controls]').hidden = false;
    schedule();
  });
}
