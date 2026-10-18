# โดเมนและ HTTPS

อัปเดต 18 ตุลาคม 2026 (Asia/Bangkok) หลังย้าย repo เข้า Organization

## สถานะที่ตรวจแล้ว

- Repository: https://github.com/intaniadebate/intaniadebate
- เว็บหลัก: https://intaniadebateclub.com/
- GitHub Pages ใช้ GitHub Actions และ Custom domain เป็น `intaniadebateclub.com`
- Enforce HTTPS เปิดแล้ว
- HTTPS โดเมนหลักตอบ 200; HTTPS ของ `www` ผ่านการตรวจใบรับรองและ redirect 301 ไปโดเมนหลัก
- HTTP ทั้งโดเมนหลักและ `www` redirect 301 ไป HTTPS ของโดเมนหลัก
- Organization `intaniadebate` ยืนยันโดเมนใน Settings > Pages สำเร็จแล้ว การยืนยันเดิมในบัญชีส่วนตัวและ TXT เดิมถูกถอดหลังยืนยันของ Organization สำเร็จ

## DNS ที่ต้องคงไว้ใน Cloudflare

| Type | Name | Value | Proxy |
| --- | --- | --- | --- |
| A | @ | 185.199.108.153 | DNS only |
| A | @ | 185.199.109.153 | DNS only |
| A | @ | 185.199.110.153 | DNS only |
| A | @ | 185.199.111.153 | DNS only |
| CNAME | www | intaniadebate.github.io | DNS only |
| TXT | _github-pages-challenge-intaniadebate | ค่าที่ GitHub ออกให้และบันทึกอยู่ใน Cloudflare | DNS only |

เก็บ TXT ของ Organization ไว้เพื่อรักษาการยืนยันโดเมน CNAME ของ `www` ชี้ hostname เท่านั้น ไม่ใส่ชื่อ repo หรือ path

## ตรวจหลังเปลี่ยนค่าหรือส่งต่องาน

1. ตรวจ [Pages settings](https://github.com/intaniadebate/intaniadebate/settings/pages): Custom domain ถูกต้อง, DNS check ผ่าน และ Enforce HTTPS มีเครื่องหมายถูก
2. ตรวจ [Organization Pages](https://github.com/organizations/intaniadebate/settings/pages): `intaniadebateclub.com` แสดง Verified
3. เปิด `https://intaniadebateclub.com/` และ `https://www.intaniadebateclub.com/` ให้ผ่านการตรวจใบรับรองตามปกติ โดย www ต้อง redirect เข้าโดเมนหลัก
4. ตรวจหน้า Home, การแข่งขัน, ทำเนียบ และรูป Cloudinary หลัง deploy

GitHub Actions publishing เก็บ Custom domain ใน Pages settings ไม่จำเป็นต้องมีไฟล์ CNAME ใน output ใบรับรองดูแลโดย GitHub Pages หากกำลัง provision ให้ตรวจ DNS และรอสถานะก่อน ไม่ล้าง/ตั้งโดเมนซ้ำและไม่ปิดการตรวจ certificate

การส่งต่อรุ่นถัดไปให้เพิ่มผู้ดูแลใน Organization เดิม พร้อมสิทธิ์ดูแล Cloudflare และ Cloudinary แยกกัน ดู [คู่มือ GitHub Pages](GITHUB_PAGES.md)

## อ้างอิง

- [GitHub: Manage a custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [GitHub: Verify a custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages)
