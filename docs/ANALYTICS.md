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
| `year_view` | เปิดข้อมูลปีการแข่งขัน/ทำเนียบสำเร็จ รวมเข้าลิงก์ตรงและ Back/Forward | `section`, `year` |
| `year_click` | กดเลือกปี รวมกดปีเดิมหรือเปิดแท็บใหม่ ไม่ยืนยันว่าโหลดสำเร็จ | `section`, `year`, `method` |
| `news_view` | เปิดหน้าข่าวสำเร็จ | `article_slug` |
| `navigation_click` | การกดเมนูและลิงก์ภายในที่รู้จัก | `destination` |
| `contact_click` | กด Instagram ชมรม/ประกาศต้นฉบับ/สมาชิกที่มีลิงก์ในทำเนียบ | `platform`, `contact_kind`, `article_slug`, `member_id` |
| `video_click` | กดลิงก์ YouTube ของแมตช์ ไม่ใช่จำนวนครั้งที่เล่นวิดีโอจบ | `video_id` |
| `news_click` | กดเปิดข่าว | `article_slug` |
| `year_select` | เลือกปีจาก rail/pager/select หลังสลับข้อมูลสำเร็จ | `section`, `year`, `method` |
| `match_open` | เปิดรายละเอียดแมตช์ รวมส่วนที่เปลี่ยนเข้ามาภายหลัง | `match_id` |
| `filter_change` | กรองข่าว คู่แข่ง และอัลบั้ม | `filter_name`, `filter_value` |
| `album_open` | เปิดอัลบั้มสำเร็จ เมื่อมีข้อมูลอัลบั้ม | `album_id` |
| `photo_open` | เปิดรูปขยายจากสมาชิก ข่าว หรือภาพประกอบการแข่งขัน | `image_id`, `section`, `year`, `member_id` |
| `photo_view` | รูปโหลดและแสดงในหน้าขยายสำเร็จ รวมรูปแรกและการเลื่อนรูป | `image_id`, `album_id`, `section`, `year`, `method` |
| `photo_navigate` | เลือกรูปถัดไป/ก่อนหน้า รวมใช้ปุ่มลูกศรคีย์บอร์ด | `image_id`, `album_id`, `method` |
| `photo_close` | ปิดหน้าขยายด้วยปุ่ม Escape หรือแตะนอกภาพ | `image_id`, `album_id` |
| `ui_click` | ปุ่ม เมนู รายละเอียด และตัวเลือกอื่น ๆ โดยไม่ส่งข้อความบนปุ่ม | `control_id` |
| `source_click`, `external_click` | แหล่งอ้างอิงการแข่งขันและลิงก์ภายนอกอื่น | `content_id`, `platform` |

จำนวน click เป็นจำนวนการกด ไม่ใช่จำนวนคนไม่ซ้ำ `navigation_click` กับ `page_view` วัดคนละอย่าง อย่านำมาบวกรวมเป็นยอดเข้าชม และ `contact_click` ไม่ได้แปลว่าส่งข้อความแล้ว

ตั้ง event-scoped custom dimensions ใน property แล้วสำหรับ `year`, `section`, `article_slug`, `image_id`, `album_id`, `member_id`, `match_id`, `destination`, `platform`, `contact_kind`, `method`, `filter_name`, `filter_value`, `control_id`, `content_id`, `video_id`, `anchor_id` รวม 17 มิติ ใช้รหัสเนื้อหาที่กำหนดไว้ ไม่สร้างมิติจากชื่อบุคคล ข้อความปุ่ม หรือ URL ภายนอกเต็ม รายงานของมิติใหม่อาจใช้เวลาประมวลผล 24–48 ชั่วโมงหลังสร้างตาม [คู่มือ custom dimensions ของ Google](https://support.google.com/analytics/answer/14240153?hl=en)

## ดูยอดตามสิ่งที่ผู้ชมสนใจ

ใช้ Reports → Realtime overview ตรวจ event ที่เพิ่งส่ง ส่วนยอดย้อนหลังใช้ Explore → Free form เพิ่ม Event name, Event count และมิติที่ต้องการ:

- ปีไหนมีคนเปิดดู: กรอง Event name = `year_view`; Rows = Content section (`section`) และ Content year (`year`); Values = Event count เพิ่ม Total users ได้หากต้องการแยกจำนวนคน
- ปีไหนถูกกดเลือก: เปลี่ยน event เป็น `year_click`; `year_select` นับเฉพาะการสลับปีสำเร็จในหน้าเดิม ตัวเลขทั้งสามมีความหมายต่างกัน ไม่บวกรวมเป็นยอดเดียว
- ข่าวไหนถูกกด/อ่าน: ใช้ `news_click`/`news_view` กับ News article (`article_slug`)
- รูปไหนถูกเปิดดู: ใช้ `photo_view` กับ Photo ID (`image_id`) และ Content section; เพิ่ม Content year, Album ID หรือ Member ID ตามหน้า `photo_open` แยกวัดการเปิดหน้าขยาย ส่วนรูปที่โหลดไม่สำเร็จไม่เพิ่ม `photo_view`
- Instagram ถูกกดกี่ครั้ง: ใช้ `contact_click` กับ Contact kind; `club` คือชมรม, `news_source` คือประกาศต้นฉบับ, `member` คือ IG จากทำเนียบ (เก็บเฉพาะรหัสสมาชิก ไม่ส่ง URL โปรไฟล์)
- รูปในอัลบั้มความทรงจำ: `album_open` นับเปิดอัลบั้ม; `photo_view` แยกตาม Album ID + Photo ID นับการแสดงรูปแรก/ถัดไป/ก่อนหน้า รวมการใช้คีย์บอร์ด

หน้าความทรงจำยังไม่มีอัลบั้มในข้อมูล production การทดสอบใช้ fixture เฉพาะเครื่องโดยไม่เพิ่มรูปหรือเรื่องราวจำลองลงเว็บ เมื่อเพิ่มอัลบั้มที่อนุญาตเผยแพร่แล้ว ตัวดูรูปและสถิติจะทำงานอัตโนมัติ

## การเก็บรักษาค่าตั้งค่าและรหัสลับ

`G-DKEB91H0R2` เป็น Measurement ID สาธารณะที่ต้องปรากฏใน HTML ไม่ใช่รหัสผ่าน เก็บค่าที่ใช้ build ใน Actions variable `PUBLIC_GA_MEASUREMENT_ID` ตามเดิม ไม่ hard-code ค่าใหม่ใน JavaScript ตัวอย่าง `.env.example` เว้นค่าว่างและ `.env`/`.env.local` ถูก ignore

ไม่ใช้ Measurement Protocol API secret, private key, OAuth token หรือรหัสผ่าน Google ในเว็บนี้ หากมีระบบ backend เพิ่มในอนาคต รหัสลับต้องอยู่ใน secret store ฝั่งเซิร์ฟเวอร์ ห้ามใส่ใน `PUBLIC_*`, โค้ดหน้าเว็บ, localStorage, Issue หรือ PR

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
- `web/src/lib/photo-viewer.mjs`, `web/src/components/PhotoViewer.astro`, `web/src/styles/photo-viewer.css`: ตัวขยายรูปและอัลบั้มร่วม ใช้ native modal, keyboard, focus restoration และ fallback สำหรับ light dismiss
- `web/tests/photo-viewer.test.mjs`: รูปโหลดสำเร็จ/ไม่สำเร็จ การเปลี่ยนรูป keyboard URL validation และ backdrop fallback
- `.deployment/analytics-qa/server.mjs`: loopback-only browser fixture ใช้หน้า build จริงและ fake transport ไม่อยู่ใน source ที่ stage/deploy

รัน `npm test` และ `npm run build` ใน `web` ก่อนเผยแพร่ Actions รัน tests ก่อน build/deploy และหยุดถ้าพบความผิดพลาด รหัสว่างคือยังไม่เปิดใช้งาน ไม่มี placeholder ที่ส่ง hits เข้าบัญชีบุคคลอื่น

เทสต์ตรวจข้อมูลสาธารณะทำงานได้ใน clean checkout ส่วน checksum ของ Excel ส่วนตัวเป็น opt-in: ตั้ง `INTANIA_SOURCE_WORKBOOK` เป็น absolute path ของต้นฉบับที่ต้องการตรวจแล้วรัน `npm test` หากระบุไฟล์แต่ checksum ไม่ตรงหรือเปิดไม่ได้จะ fail; หากไม่ระบุจะ skip เฉพาะเทสต์นี้ ไม่มีการคัดลอก Excel ส่วนตัวขึ้น GitHub checksum ที่เคยไม่ตรงในเครื่องยังไม่ได้แก้ข้อมูลในงานนี้

การเชื่อม GA ครั้งแรกและผล production อยู่ใน [Issue #3](https://github.com/intaniadebate/intaniadebate/issues/3) ส่วนการเพิ่มสถิติทุกจุดคลิก รูปขยาย และ CI tests ติดตามผลตรวจ/PR/Actions/เว็บจริงใน [Issue #5](https://github.com/intaniadebate/intaniadebate/issues/5)

อ้างอิง: [ติดตั้ง GA](https://support.google.com/analytics/answer/9304153?hl=en), [events](https://developers.google.com/analytics/devguides/collection/ga4/events), [manual page views และการปิด history measurement](https://developers.google.com/analytics/devguides/collection/ga4/views), [consent mode](https://developers.google.com/tag-platform/security/guides/consent)
