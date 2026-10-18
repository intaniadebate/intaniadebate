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
