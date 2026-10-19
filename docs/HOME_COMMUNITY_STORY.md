# Home community photo story

## Direction

Extension of main's quiet campus editorial design: existing cream/wine colors, Noto Sans Thai/Cormorant typography, spacing and motion tokens. Design dials: variance 3, motion 3, density 3, assets 7, brand fidelity 9. Protected: routes, Home anchors, hero, news, analytics and competition/member data.

The story is **meeting each other → sharing the stage → friendships beyond competition**. The existing heading remains “มากกว่าการพูด คือการรับฟัง”. The supporting line is “มากกว่าการแข่งขัน คือความสัมพันธ์ระหว่างทาง”. The text describes listening, cheering each other on and shared memories, rather than a list of awards.

## Photo selection

All five photos come from the maintainer-provided `กิจกรรมต่างๆ/โปรโมท/` folder. The maintainer requested these photos for the public Home section in this task (2026-10-19). No other event folders were needed. Source originals stay outside the Git repository.

| Order / media ID | Original filename | Purpose | 640 / 960 / 1280 px, KiB |
| --- | --- | --- | --- |
| 1 `community-first-hello` | `LINE_ALBUM_วันคัด 110_261019_12.jpg` | Warm first meeting, clear group faces | 47.0 / 90.1 / 142.1 |
| 2 `community-on-stage` | `LINE_ALBUM_รอบชิงงง_261019_35.jpg` | A shared moment on stage | 26.0 / 44.1 / 63.5 |
| 3 `community-farewell` | `LINE_ALBUM_ส่งท้าย110_261019_9.jpg` | People who grow together | 40.9 / 74.5 / 114.3 |
| 4 `community-trip` | `LINE_ALBUM_ทริปโต้_261019_60.jpg` | Playful off-stage friendship | 39.5 / 71.5 / 104.8 |
| 5 `community-evening` | `LINE_ALBUM_รอบชิงงง_261019_15.jpg` | An evening together closes the loop | 30.3 / 54.7 / 84.1 |

Portrait and differently scaled views of the same moments were excluded: selection-day `_1` / `_4`, stage `_173` / `_176`, farewell `_1`. The wide landscape versions keep people larger and clearer in the split layout. The townhall portrait leaves people too small within its tall architectural composition for this section.

The 4:3 stage uses `object-fit: contain`, deliberately preserving every person. Wide photos sit on the existing paper surface; there are no black bars or aggressive face crops. Original files are not altered. All derivatives are auto-oriented, metadata-stripped WebP, quality 78, effort 6, with no upscaling.

## Delivery and motion

- `home-story.json` controls order, chapter labels and captions; `media.json` controls permission and responsive sources. The resolver excludes revoked assets from production. Other Home content is unchanged.
- Selected WebP derivatives are committed under `web/static/media/`. The existing build copies approved assets to the static site. This works with the production Cloudinary provider through its existing local fallback; **no Cloudinary upload, new account or service configuration is needed**. Hosting serves these static files alongside the site.
- Five 640 px files total about **184 KiB**; five 960 px files total **335 KiB**; five 1280 px files total **509 KiB**. Browsers choose one derivative per photo with `srcset`/`sizes`, not all fifteen. Actual transfer depends on viewport/DPR and whether the viewer watches the whole story.
- First photo is below the fold with native lazy loading. Other frames initially have no `src` or `srcset`; only the next frame is hydrated once the story is visible and allowed to play. It does not compete with the hero during initial loading. Previously decoded frames are reused.
- Hold for 6.5 seconds, crossfade over 1.2 seconds using `opacity` and the existing `--ease-in-out`. The outgoing frame remains opaque underneath the incoming frame to prevent a flash of background. No GIF, MP4, motion library or frame-by-frame JavaScript.
- Pause/play and five manual selectors have keyboard focus states and chapter labels. Manual selection pauses rotation. Caption announcements occur only for manual selections, avoiding continuous screen-reader interruptions.
- Autoplay stops offscreen, in hidden tabs, with the site's motion pause, and with `prefers-reduced-motion`. Reduced motion removes the fade but keeps manual selection. Save-Data starts paused. Without JavaScript, the first image and text remain visible and inactive controls stay hidden.
- Image decoding must complete before the active frame changes; failed incoming images keep the previous frame and their selectors become disabled. Local fallback is attempted when the provider URL differs.

## Validation

See the task's [work session log](work-sessions/2026-10-19-home-community-story.md) for checks, evidence, branch and release status. A passing local build does not imply deployment.

## Editing later

1. Follow the repository check-in protocol before editing.
2. Change captions/order in `web/src/data/home-story.json`.
3. For a new photo, add an approved media entry and WebP derivatives using the same ID/width filename pattern, recording the actual width of each derivative. Keep private originals and local paths out of commits.
4. Run `npm run build` in `web/`. Inspect desktop/mobile, image transitions, manual controls and reduced motion. Verify that every deployed image URL is present in the build.

Guidance used: Modern Web Guidance `optimize-image-priority` (“For standard below-the-fold images, `loading="lazy"` is sufficient”) and `motion` (“Provide Pause mechanism”). Supporting references: [MDN image loading/decoding](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img), [W3C reduced motion](https://www.w3.org/WAI/WCAG22/Techniques/css/C39.html).
