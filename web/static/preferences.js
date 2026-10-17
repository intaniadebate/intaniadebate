(() => {
  try {
    const theme = localStorage.getItem('intania-design-tone');
    if (['wine', 'sage', 'ink'].includes(theme)) document.documentElement.dataset.theme = theme;
    const stopped = localStorage.getItem('intania-motion') === 'paused' || matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.documentElement.dataset.motion = stopped ? 'paused' : 'playing';
  } catch { document.documentElement.dataset.motion = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'paused' : 'playing'; }
})();
