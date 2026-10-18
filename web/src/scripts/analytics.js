import { analyticsEnabled, installAnalytics } from '../lib/analytics.mjs';

const config = document.querySelector('[data-analytics-config]');
if (config) {
  installAnalytics({
    win: window, doc: document,
    measurementId: config.dataset.measurementId,
    enabled: analyticsEnabled({
      production: import.meta.env.PROD,
      measurementId: config.dataset.measurementId,
      siteUrl: config.dataset.siteUrl,
      href: location.href,
    }),
  });
}
