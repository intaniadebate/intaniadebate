# สถิติผู้เข้าชมและการกดด้วย GA4

ระบบใช้ Google Analytics 4 สำหรับจำนวนเข้าชมและ custom events โดยไม่ต้องเพิ่ม backend หรือ dependency ของแอป รหัส production คือ `G-DKEB91H0R2` ผ่าน repository variable `PUBLIC_GA_MEASUREMENT_ID`; แก้ค่าแล้วต้อง build/deploy ใหม่ เว็บเริ่มโหลด Google tag เฉพาะหลังผู้เข้าชมอนุญาต

## สร้างบัญชีและนำรหัสมาเชื่อม

1. เปิด [Google Analytics](https://analytics.google.com/) ด้วยบัญชีที่ชมรมจะใช้ดูแล เลือกสร้าง account/property หากยังไม่มี เจ้าของบัญชีต้องอ่านและยอมรับข้อตกลงของ Google ด้วยตนเอง
2. ตั้งชื่อ property ว่า Intania Debate Club และ reporting time zone เป็น Thailand / Bangkok
3. สร้าง Web data stream สำหรับ `https://intaniadebateclub.com` แล้วคัดลอก **Measurement ID** รูปแบบ `G-XXXXXXXXXX` ไม่ใช่ Property ID, Stream ID หรือรหัสผ่าน
4. **ปิด Enhanced measurement ของ stream นี้** เพราะแอปส่ง page views และ clicks เองแล้ว โดยเฉพาะ Page changes based on browser history events ต้องปิด มิฉะนั้นการเปลี่ยนปีและ `replaceState` ตอน scroll อาจนับซ้ำ ห้ามติดตั้ง GA tag หรือ GTM ซ้ำอีกชุด
5. ปิด Google signals, advertising personalization และการเก็บข้อมูลที่ผู้ใช้ป้อนในฟอร์ม/การตรวจจับข้อมูลผู้ใช้โดยอัตโนมัติ หากมีตัวเลือกเหล่านี้เปิดอยู่ ไม่เชื่อม Google Ads สำหรับงานสถิตินี้ ตั้ง Data retention ของข้อมูลระดับผู้ใช้/events ไว้ **2 เดือน** ก่อนเปิดใช้งาน
6. ใน repo [intaniadebate](https://github.com/intaniadebate/intaniadebate) ไป Settings → Secrets and variables → Actions → Variables → New repository variable ชื่อ `PUBLIC_GA_MEASUREMENT_ID` ค่าเป็น Measurement ID จริง รหัสนี้เป็น public configuration ไม่ใช่ secret
7. Review และนำ source ที่แก้แล้วเข้า deployment checkout ตามคู่มือ [GitHub Pages](./GITHUB_PAGES.md) workflow เตรียมอ่าน variable นี้ใน build environment แล้ว จากนั้น commit/push ตาม workflow ปกติ ไม่เผยแพร่ด้วยสคริปต์ QA

ส่งเฉพาะ Measurement ID มาให้ผู้ช่วยเชื่อมต่อได้ ไม่ต้องส่งรหัสผ่าน Google, API secret หรือ recovery code และไม่ต้องใส่ Measurement Protocol API secret ใน frontend

## ตรวจหลังเผยแพร่

เปิดเว็บจริงโดยไม่ใช้ ad blocker สำหรับการทดสอบ ตรวจ Network ก่อนเลือก: ต้องไม่พบ `gtag/js` หรือ `g/collect` ของ GA หลังเลือก “ไม่อนุญาต” ก็ต้องไม่มีการเก็บสถิติ ส่วน Google Fonts/ภาพวิดีโอเป็นบริการอื่นซึ่งยังโหลดได้ตามหน้าเว็บ

เมื่อเลือก “อนุญาตสถิติ” ให้เปิด GA → Reports → Realtime ดู `page_view` แล้วทดลอง Instagram, ลิงก์วิดีโอ, รายละเอียดแมตช์ และเลือกปี 2017 → 2021 → Back ควรมี page view หนึ่งครั้งต่อการเปิด/เปลี่ยนหน้าและหนึ่ง `year_select` ต่อการเลือกปีสำเร็จ ไม่เพิ่มยอดหน้าเพียงเพราะ scroll, กด anchor หรือเปิดรายละเอียดแมตช์

ใช้ DebugView กับ Google Analytics Debugger หากต้องการดูพารามิเตอร์ละเอียด ไม่ส่งการทดสอบในเครื่องเข้า property จริง แอปปิด analytics ใน dev, localhost preview และ hostname ที่ไม่ตรง `PUBLIC_SITE_URL` โดยอัตโนมัติ

ลองถอนความยินยอมจากปุ่มท้ายหน้า ต้องลบคุกกี้ GA ของ stream ที่ browser เข้าถึงได้ หยุด event และ reload หน้า จากนั้นไม่โหลด Google tag อีก ทดสอบสองแท็บด้วย: การเปลี่ยนใจในแท็บหนึ่งต้องหยุดเก็บในแท็บอื่นที่เปิดอยู่

ถ้าไม่มีข้อมูล: ตรวจ Measurement ID ที่อยู่ใน HTML ของ **build จริง**, variable ใน workflow, origin ของเว็บ, การยินยอม, ad blocker และ console/network อย่าสร้าง consent ปลอมให้ผู้เข้าชมเพื่อแก้ยอดที่ไม่ขึ้น

## Events ที่ติดตั้ง

| Event | สิ่งที่นับ | Parameters สำคัญ |
| --- | --- | --- |
| `page_view` | หน้าแรกที่เปิดและการเปลี่ยนปีที่สำเร็จ รวม Back/Forward | `page_location`, `page_path`, `page_referrer` |
| `navigation_click` | การกดเมนูและลิงก์ภายในที่รู้จัก | `destination` |
| `contact_click` | กด Instagram หลักของชมรม | `platform` |
| `video_click` | กดลิงก์ YouTube ของแมตช์ ไม่ใช่จำนวนครั้งที่เล่นวิดีโอจบ | `video_id` |
| `news_click` | กดเปิดข่าว | `article_slug` |
| `year_select` | เลือกปีจาก rail/pager/select หลังสลับข้อมูลสำเร็จ | `section`, `year`, `method` |
| `match_open` | เปิดรายละเอียดแมตช์ รวมส่วนที่เปลี่ยนเข้ามาภายหลัง | `match_id` |
| `filter_change` | กรองข่าว คู่แข่ง และอัลบั้ม | `filter_name`, `filter_value` |
| `album_open` | เปิดอัลบั้มสำเร็จ เมื่อมีข้อมูลอัลบั้ม | `album_id` |

จำนวน click เป็นจำนวนการกด ไม่ใช่จำนวนคนไม่ซ้ำ `navigation_click` กับ `page_view` วัดคนละอย่าง อย่านำมาบวกรวมเป็นยอดเข้าชม และ `contact_click` ไม่ได้แปลว่าส่งข้อความแล้ว

หน้า/ปีใช้ page views ดูรายงาน Pages and screens ส่วนการเทียบปุ่มให้ดู Reports → Engagement → Events หรือ Explore สร้าง event-scoped custom dimensions สำหรับ `platform`, `video_id`, `article_slug`, `section`, `year`, `method`, `match_id`, `filter_name`, `filter_value`, `album_id`, `destination` เท่าที่ต้องใช้ แล้วใช้ Event count เทียบกับ Total users ไม่ต้องสร้าง custom dimension สำหรับ URL เต็มที่มีความหลากหลายสูง

## การยินยอมและขอบเขตข้อมูล

ใช้การยินยอมก่อนโหลด Google tag แบบ basic: ก่อนอนุญาตไม่โหลด GA ไม่ queue events ย้อนหลัง และไม่ส่ง cookieless pings ของ GA ใช้ได้ทุกหน้าตามปกติไม่ว่าจะเลือกอะไร ปุ่มยอมรับ/ปฏิเสธมีความสำคัญเท่ากันและตั้งใหม่ได้ท้ายหน้า

โค้ดเก็บตัวเลือกใน `localStorage` ชื่อ `intania-analytics-consent-v1` 180 วัน ไม่มีข้อมูลบัญชีบุคคลในค่านี้ และตั้งคุกกี้ GA แบบ host-only อายุไม่เกิน 180 วัน โดยไม่ขยายอายุทุกครั้งที่เข้าชม ถ้า storage ใช้ไม่ได้ การยินยอมมีผลเฉพาะเอกสารที่กำลังเปิด

URL ที่โค้ดส่งใช้เฉพาะ routes ที่รู้จัก ไม่มี query string/fragment ชื่อบุคคล หรือข้อความที่ผู้ใช้ป้อน referrer แรกใช้เฉพาะ origin จึงไม่เก็บ UTM/campaign parameters จาก URL นี้ และไม่ส่ง Instagram ส่วนบุคคลของสมาชิก การถอนความยินยอมไม่ลบข้อมูลที่ส่งไปแล้ว; ผู้ดูแลจัดการการลบและอายุข้อมูลในบัญชี GA แยกต่างหาก

Google Analytics ยังประมวลผลข้อมูลอุปกรณ์/การเชื่อมต่อของผู้ยินยอม ไม่ใช่ระบบไม่ระบุตัวบุคคลอย่างสมบูรณ์ จำนวนผู้ชมเป็นค่าประมาณและอาจน้อยกว่าจริงเพราะผู้ชมไม่ยินยอมหรือบล็อกสคริปต์ อ่าน [หน้า privacy](../web/src/pages/privacy.astro) และปรับข้อมูลการเก็บรักษาหรือช่องทางติดต่อให้ตรงกับบัญชีก่อนเผยแพร่จริง

## โค้ดและการทดสอบ

- `web/src/lib/analytics.mjs`: ตรวจ origin, consent, privacy-safe parameters, Google bootstrap, delegated event handlers
- `web/src/scripts/analytics.js` และ `web/src/components/Analytics.astro`: เชื่อม config และ UI
- `web/src/styles/analytics.css`: consent panel ที่ใช้ tokens เดิม
- `web/src/scripts/year-navigation.js`: ส่ง event หลังเปลี่ยนปีสำเร็จเพื่อนับ virtual page view
- `web/tests/analytics.test.mjs`: tests ไม่เรียก network รวมการไม่ยินยอม ถอนความยินยอม สองแท็บ storage ใช้ไม่ได้ และการไม่ส่ง query strings
- `.deployment/analytics-qa/server.mjs`: loopback-only browser fixture ใช้หน้า build จริงและ fake transport ไม่อยู่ใน source ที่ stage/deploy

รัน `npm test` และ `npm run build` ใน `web` ก่อนเผยแพร่ รหัสว่างคือยังไม่เปิดใช้งาน ไม่มี placeholder ที่ส่ง hits เข้าบัญชีบุคคลอื่น

ผลตรวจ branch `feat/enable-ga4` วันที่ 18 ตุลาคม 2026: analytics tests ผ่าน 16/16; `npm test` รวมผ่าน 24/25 โดยเทสต์ fingerprint ของ Excel เดิมไม่ผ่าน เพราะไฟล์ต้นฉบับในเครื่องไม่ตรง checksum ที่บันทึกใน main (ไม่ได้แก้ข้อมูลหรือเทสต์เดิมในงานนี้); build production พร้อมรหัสจริงผ่าน 31 หน้า ตรวจ consent panel บน desktop และ viewport 390×844 ด้วย transport จำลองแล้ว: ก่อนอนุญาต/หลังปฏิเสธไม่มี tag หรือ event, ยอมรับโหลดครั้งเดียวและส่งหนึ่ง page view, เปลี่ยนปี 2017 → 2021 ส่งหนึ่ง page view และหนึ่ง `year_select`, ถอนความยินยอมแล้ว reload และไม่ส่งต่อ ผล Actions/เว็บจริงและรายงาน GA บันทึกใน [Issue #3](https://github.com/intaniadebate/intaniadebate/issues/3)

อ้างอิง: [ติดตั้ง GA](https://support.google.com/analytics/answer/9304153?hl=en), [events](https://developers.google.com/analytics/devguides/collection/ga4/events), [manual page views และการปิด history measurement](https://developers.google.com/analytics/devguides/collection/ga4/views), [consent mode](https://developers.google.com/tag-platform/security/guides/consent)
