# GitHub Pages และการส่งต่อผู้ดูแล

อัปเดต 18 ตุลาคม 2026 หลังย้ายเข้า Organization `intaniadebate`

- Repository: https://github.com/intaniadebate/intaniadebate
- Website: https://intaniadebateclub.com/
- Branch: `main`; push แล้ว GitHub Actions build/deploy อัตโนมัติ
- Workflow: `.github/workflows/pages.yml`
- Build: Node 24, `npm ci` และ `npm run build` ใน `web`; output `web/dist`
- Site origin: `https://intaniadebateclub.com`; base path `/`
- Media provider: Cloudinary; cloud name `cdzhyyir`
- Custom domain, Organization verification, DNS และ HTTPS: [คู่มือโดเมน](CUSTOM_DOMAIN.md)

## ก่อนแก้หรือเผยแพร่เว็บ

ทุกคนรวมถึง AI ต้องทำ [check-in/check-out](WORK_LOG.md) ตาม [คู่มือร่วมพัฒนา](../CONTRIBUTING.md) ตรวจ Issue/PR ที่เปิดอยู่ แยก branch ต่อหนึ่งงาน และระบุผลตรวจพร้อมงานค้างก่อนส่งต่อ การ merge เข้า `main` จะเผยแพร่เว็บจริงทันที จึงต้อง review diff ให้แน่ใจว่าไม่รวมงานค้างของคนอื่น

## Security headers

GitHub Pages ไม่รองรับการตั้ง HTTP response header เอง และไม่อ่านไฟล์ `_headers` (ไฟล์นี้ใช้ได้เฉพาะบาง host เช่น Cloudflare Pages/Netlify) repo จึงไม่เก็บ `_headers` ไว้ เพื่อไม่ให้เข้าใจผิดว่ามีผลอยู่

- `Referrer-Policy: strict-origin-when-cross-origin` ตั้งแทนด้วย `<meta name="referrer">` ใน `web/src/layouts/SiteLayout.astro` ซึ่งทุกหน้าใช้ร่วมกัน
- `X-Content-Type-Options: nosniff` และ `Permissions-Policy` ตั้งผ่าน `<meta>` ไม่ได้ ตอนนี้จึงยังไม่มีบนเว็บจริง

หากต้องการ header เหล่านี้ในอนาคต ต้องให้ผู้ดูแลตัดสินใจเปลี่ยนโครงสร้าง เช่น เปิด proxy/CDN หน้า GitHub Pages (Cloudflare proxy พร้อม Transform Rules) หรือย้ายไป host ที่รองรับ header เอง (Cloudflare Pages, Netlify) งานนี้กระทบ DNS/HTTPS ตาม[คู่มือโดเมน](CUSTOM_DOMAIN.md) จึงต้องเปิด Issue แยกก่อน ตรวจผลด้วย `curl -sI https://intaniadebateclub.com/`

## เริ่มจากเครื่องใหม่

```sh
git clone https://github.com/intaniadebate/intaniadebate.git
cd intaniadebate/web
npm ci
npm run dev
```

สำหรับ clone เดิม อัปเดต remote ก่อนทำงาน:

```sh
git remote set-url origin https://github.com/intaniadebate/intaniadebate.git
git fetch origin
```

ตรวจและเก็บงานที่ยังไม่ commit ก่อน pull/rebase หากมีคนแก้บน GitHub ต้องนำกลับมารวมก่อน push ไม่ใช้ force push ทับงานของผู้อื่น

## Workspace เดิม

ไฟล์พัฒนาอยู่ใน `E:\debate\web` และ checkout สำหรับ deploy อยู่ใน `E:\debate\.deploy-repo` สคริปต์ `node .deployment/stage-site.mjs` คัดลอก source ที่อนุญาตเข้า checkout จึงต้อง sync ทั้งสองฝั่งก่อนใช้สคริปต์ และ review diff ก่อน commit ทุกครั้ง ไฟล์ต้นฉบับ Excel และ credentials ต้องคงอยู่ภายนอก repo สาธารณะ

## ส่งต่อแต่ละรุ่น

- ใช้ Organization เดิมและเพิ่มผู้ดูแลใหม่ ให้ Owner เฉพาะคนที่รับผิดชอบการตั้งค่าองค์กร ส่วนผู้ช่วยแก้เว็บให้สิทธิ์ตามหน้าที่ผ่าน Team
- ควรมี Owner ที่ไว้ใจได้อย่างน้อย 2 คน โดยผู้ดูแลหลักต้องระบุบัญชีผู้รับก่อนเพิ่มสิทธิ์
- โดเมนใน Cloudflare และรูปใน Cloudinary มีสมาชิก/สิทธิ์ของบริการนั้นแยกจาก GitHub จัดการสิทธิ์และผู้รับผิดชอบการต่ออายุให้ครบก่อนผู้ดูแลเดิมออก
- ตรวจ deploy สำเร็จและเข้าเว็บไซต์จริงได้หลังเปลี่ยนสิทธิ์หรือการตั้งค่า

อ้างอิง: [GitHub repository transfer](https://docs.github.com/en/repositories/creating-and-managing-repositories/transferring-a-repository), [Organization ownership continuity](https://docs.github.com/en/organizations/managing-peoples-access-to-your-organization-with-roles/maintaining-ownership-continuity-for-your-organization)
