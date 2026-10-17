# เชื่อม intaniadebateclub.com กับ GitHub Pages

วันที่เตรียม: 18 ตุลาคม 2026 (Asia/Bangkok)

ผู้ใช้แจ้งว่าซื้อ `intaniadebateclub.com` จาก Cloudflare แล้ว ใช้ repo `woraphontrangpanich-jpg/intaniadebate` และ GitHub Pages ที่มีอยู่ต่อได้

## สถานะ

- แก้ workflow ใน `.deploy-repo/.github/workflows/pages.yml` เป็น `PUBLIC_SITE_URL=https://intaniadebateclub.com` และ `PUBLIC_BASE_PATH=/` แล้ว commit/push `e687094a9fa2bb570a895c9b423cbb10b0b523c6`
- ทดลอง production build จาก `web` ด้วยค่า site/base ใหม่ ผ่าน 30 หน้า
- ตั้ง Custom domain ใน GitHub และเพิ่ม A 4 records + www CNAME ใน Cloudflare แบบ DNS only แล้ว DNS สาธารณะ 1.1.1.1 และ 8.8.8.8 ตรวจพบค่าที่ถูกต้อง
- GitHub Actions run `39055543286` deploy สำเร็จ
- ตรวจ HTTP `/`, `/home/`, `/competitions/`, `/members/`, `/memories/`, `/credits/` ตอบ 200 ไม่มี base path เก่า; ภาพ/CSS/JS ที่อ้างผ่าน href/src ในหน้าที่ตรวจตอบ 200 และ www redirect 301 เข้าโดเมนหลัก
- GitHub Pages verified domain สำเร็จในบัญชี `woraphontrangpanich-jpg` เพิ่ม TXT `_github-pages-challenge-woraphontrangpanich-jpg` ตามค่าที่ GitHub กำหนดแล้ว ต้องเก็บ record นี้ไว้
- ตรวจ HTTPS ของโดเมนหลักสำเร็จครบ 29 หน้าปกติ พร้อมภาพ/CSS/JS ที่อ้างถึง ทุกหน้าตอบ 200 ไม่มี base path เก่า (build มี 30 หน้าโดยนับ 404.html ด้วย)
- GitHub DNS health check ผ่านทั้ง domain และ alt_domain (`is_valid=true`, `is_https_eligible=true`, ไม่มี CAA error) แล้ว
- ยังรอ HTTPS certificate ใหม่สำหรับ www: API รายงาน `dns_changed` และกำลังขอ certificate ใหม่ การตรวจ certificate ของโดเมนหลักผ่าน แต่ www ยังไม่ผ่าน `peer_failed_verification` และ `https_enforced=false` การลองเปิด Enforce HTTPS ถูก GitHub ปฏิเสธด้วยข้อความ `The certificate has not finished being issued` จึงต้องรอ certificate พร้อมก่อนลองอีกครั้ง
- วันที่ 18 ตุลาคม 2026 ประมาณ 01:09 (Asia/Bangkok) เริ่มคำขอใหม่หนึ่งครั้งด้วยการล้าง/ตั้ง Custom domain กลับทันทีผ่าน API ตามคู่มือ GitHub โดยคง DNS เดิมและ verified domain ไว้ หลังดำเนินการโดเมนหลักยัง HTTPS 200 แต่ www ยังรอ certificate ไม่ควรเริ่มใหม่ซ้ำระหว่างรอ

## ขั้นตอนเชื่อม

1. เข้าสู่ระบบ GitHub เจ้าของ repo และ Cloudflare ที่มีโดเมน
2. ตั้ง GitHub repo Settings > Pages > Custom domain เป็น `intaniadebateclub.com` แล้ว Save ก่อนชี้ DNS; หากทำได้ ให้ verify domain ใน account Pages settings ด้วย TXT ตามค่าที่ GitHub สร้าง
3. Cloudflare > โดเมน > DNS > Records: ตรวจรายการเดิมก่อนแก้ เพิ่ม A ที่ root และ CNAME ของ www ดังตาราง ใช้ DNS only ระหว่างตั้งค่า/ออก certificate ไม่เปลี่ยน MX หรือ record บริการอื่นที่ไม่เกี่ยวข้อง

| Type | Name | Value | Proxy |
| --- | --- | --- | --- |
| A | @ | 185.199.108.153 | DNS only |
| A | @ | 185.199.109.153 | DNS only |
| A | @ | 185.199.110.153 | DNS only |
| A | @ | 185.199.111.153 | DNS only |
| CNAME | www | woraphontrangpanich-jpg.github.io | DNS only |

4. ตรวจ DNS records ไม่ซ้ำหรือขัดกับ record เดิมที่ root/www ไม่เพิ่ม wildcard; CNAME ไม่ใส่ `/intaniadebate/`
5. Review/commit/push เฉพาะ workflow เปลี่ยน site/base หลังตั้ง custom domain แล้ว รอ GitHub Actions ผ่าน หลีกเลี่ยง stage source ทั้งชุดทับงานล่าสุดที่ผู้อื่นอาจแก้ไว้
6. เมื่อ GitHub DNS check ผ่านและออก certificate แล้ว ให้เปิด Enforce HTTPS ใน Settings > Pages
7. ตรวจ `https://intaniadebateclub.com/`, `/home/`, `/competitions/`, `/members/`, `/memories/` และตรวจ www redirect; อัปเดต README/คู่มือเป็น URL ใหม่เมื่อยืนยันสำเร็จ

GitHub Actions publishing ไม่จำเป็นต้องใช้ไฟล์ CNAME ใน output เพราะ custom domain เก็บในการตั้งค่า Pages โดเมนกับ Cloudinary เป็นคนละการตั้งค่า เชื่อมโดเมนได้ก่อนเปิด Cloudinary จริง

DNS และ certificate อาจใช้เวลาถึง 24 ชั่วโมง อย่าใช้การปิดตรวจ certificate หรือ Flexible SSL เพื่อแก้ปัญหาชั่วคราว ให้ตรวจสถานะการออก certificate และ DNS ตามจริง

## งานที่ยังเหลือหลัง DNS กระจายถึง GitHub

1. เปิด repo Settings > Pages แล้ว Check again หากยังขึ้น DNS error; ตรวจว่าทั้งโดเมนหลักและ www ผ่าน
2. รอ certificate ออกและปุ่ม Enforce HTTPS ใช้งานได้ แล้วเปิด
3. ทดสอบ HTTPS ของ root/Home/การแข่งขัน/ทำเนียบ/อัลบั้ม/เครดิตและ www redirect โดยใช้การตรวจ certificate ตามปกติ
4. เปลี่ยนสถานะส่วนต้นเอกสารเป็นสำเร็จเมื่อทดสอบผ่านจริง หากยังมีปัญหาหลัง 24 ชั่วโมงให้ตรวจ DNS/certificate ตามคู่มือ GitHub ก่อนเปลี่ยนค่าอื่น

หากย้าย repo ไป GitHub Organization ของชมรมในอนาคต ต้องวางแผนปรับ domain verification ที่ขณะนี้ผูกบัญชีส่วนตัวนี้ด้วย เพราะ verified domain จำกัดว่า repo ของบัญชีใดใช้เผยแพร่โดเมนได้

## อ้างอิงทางการ

- [GitHub: Managing a custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
