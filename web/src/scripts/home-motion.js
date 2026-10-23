const initialized = new WeakSet();
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export function initHomeMotion() {
  const root = document.documentElement;
  if (initialized.has(root)) return;
  initialized.add(root);
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const enabled = () => fine.matches && !reduced.matches && root.dataset.motion !== 'paused' && !document.hidden;
  const scenes = [];
  let frame = 0;
  let previousTime = 0;

  function schedule() {
    if (enabled() && !frame) frame = requestAnimationFrame(tick);
  }
  function reset(scene) {
    scene.x = scene.y = scene.z = scene.vx = scene.vy = scene.vz = 0;
    scene.tx = scene.ty = scene.tz = 0;
    scene.dragging = false;
    scene.surface.removeAttribute('data-dragging');
    scene.target.style.removeProperty('transform');
    scene.folds?.forEach(fold => fold.style.removeProperty('transform'));
  }
  function tick(time) {
    frame = 0;
    if (!enabled()) return;
    const dt = Math.min((time - previousTime) / 1000 || 1 / 60, .032);
    previousTime = time;
    let moving = false;
    for (const scene of scenes) {
      if (!scene.visible) continue;
      // A mass-1, stiffness-100, damping-10 spring carries velocity through gestures.
      for (const axis of ['x', 'y', 'z']) {
        const velocity = 'v' + axis;
        scene[velocity] += (100 * (scene['t' + axis] - scene[axis]) - 10 * scene[velocity]) * dt;
        scene[axis] += scene[velocity] * dt;
        moving ||= Math.abs(scene[velocity]) > .001 || Math.abs(scene['t' + axis] - scene[axis]) > .001;
      }
      if (scene.folds) {
        scene.target.style.transform = `rotateX(${-scene.y * 9}deg) rotateY(${scene.x * 12}deg) rotateZ(${scene.z * 9}deg)`;
        scene.folds.forEach((fold, i) => {
          const distance = i / (scene.folds.length - 1) - (scene.x + 1) / 2;
          const influence = Math.exp(-distance * distance / .035);
          fold.style.transform = `translateY(${influence * scene.y * -24}px) rotateY(${55 + scene.z * 45 + influence * scene.x * 20}deg) rotateX(${influence * scene.y * 12}deg)`;
        });
      } else {
        scene.target.style.transform = `translate3d(${scene.x * scene.move}px,${scene.y * scene.move}px,0) rotateX(${-scene.y * scene.tilt}deg) rotateY(${scene.x * scene.tilt}deg)`;
      }
    }
    if (moving) schedule();
    else previousTime = 0;
  }

  function bind(surface, target, tilt = 5, move = 4, folds = null) {
    if (!surface || !target) return;
    const scene = { surface, target, tilt, move, folds, visible: false, dragging: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, tx: 0, ty: 0, tz: 0, bounds: null };
    scenes.push(scene);
    const measure = () => { scene.bounds = surface.getBoundingClientRect(); };
    const aim = event => {
      if (!enabled() || event.pointerType === 'touch') return;
      if (!scene.bounds) measure();
      const b = scene.bounds;
      scene.tx = clamp((event.clientX - b.left) / b.width * 2 - 1, -1, 1);
      scene.ty = clamp((event.clientY - b.top) / b.height * 2 - 1, -1, 1);
      if (scene.dragging) scene.tz = clamp((event.clientX - scene.dragStart) / b.width * 3, -1, 1);
      schedule();
    };
    surface.addEventListener('pointerenter', event => { measure(); aim(event); });
    surface.addEventListener('pointermove', aim, { passive: true });
    surface.addEventListener('pointerleave', () => {
      if (!scene.dragging) { scene.tx = scene.ty = scene.tz = 0; schedule(); }
    });
    if (folds) {
      surface.addEventListener('pointerdown', event => {
        if (!enabled() || event.pointerType !== 'mouse' || event.button !== 0) return;
        measure();
        scene.dragStart = event.clientX;
        scene.dragging = true;
        surface.dataset.dragging = 'true';
        surface.setPointerCapture(event.pointerId);
        aim(event);
      });
      const release = () => {
        scene.dragging = false;
        surface.removeAttribute('data-dragging');
        scene.tx = scene.ty = scene.tz = 0;
        schedule();
      };
      surface.addEventListener('pointerup', release);
      surface.addEventListener('pointercancel', release);
      surface.addEventListener('lostpointercapture', release);
    }
    new IntersectionObserver(entries => {
      scene.visible = entries[0].isIntersecting;
      if (!scene.visible) reset(scene);
    }, { rootMargin: '60px' }).observe(surface);
    new ResizeObserver(() => { scene.bounds = null; }).observe(surface);
  }

  bind(document.querySelector('.home-hero'), document.querySelector('.hero-photo-pointer'), 3, 8);
  bind(document.querySelector('.story-perspective'), document.querySelector('.story-pointer-frame'), 5, 4);
  document.querySelectorAll('.chapter-entry').forEach(card => bind(card, card.querySelector('.mini-route, .six-voices, .memory-lines'), 12, 5));

  function syncPreference() {
    if (enabled()) return;
    cancelAnimationFrame(frame);
    frame = previousTime = 0;
    scenes.forEach(reset);
  }
  reduced.addEventListener('change', syncPreference);
  fine.addEventListener('change', syncPreference);
  document.addEventListener('visibilitychange', syncPreference);
  new MutationObserver(syncPreference).observe(root, { attributes: true, attributeFilter: ['data-motion'] });
  // Cached pointer bounds are refreshed without reflow on every pointer event.
  window.addEventListener('scroll', () => scenes.forEach(scene => { scene.bounds = null; }), { passive: true });
}
