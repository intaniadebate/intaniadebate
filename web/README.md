# Intania Debate Club — MVP 2

เว็บ Astro แบบ static ใช้ design system ครีม–ไวน์เดิม ข้อมูลการแข่งขันจาก Excel ที่ผู้ใช้ยืนยัน รายชื่อและอัลบั้มแยกจากหน้าตาเว็บ

## เปิดในเครื่อง

ใช้ Node.js >= 22.22 และ npm จากนั้นทำในโฟลเดอร์ `E:\debate\web`:

```powershell
npm ci
npm run dev
```

เปิด <http://127.0.0.1:4321/home> หน้าใหม่คือ `/competitions`, `/members`, `/memories` มีลิงก์ปี 2017–2026 สำหรับการแข่งขันและทำเนียบ

`dev` แสดงภาพที่อนุญาตเฉพาะ local preview ด้วยตามข้อสรุป D21; `build` สร้างเฉพาะภาพที่อนุญาตเผยแพร่ และใช้พื้นที่ว่างแทนภาพที่รอสิทธิ์

## สร้างไฟล์สำหรับ deploy

```powershell
npm run build
npm run preview
```

ผลลัพธ์อยู่ใน `dist/`; hosting ใช้ build command `npm run build`, output `dist`, project root `web` ยังไม่มีการเชื่อมบัญชีหรือ deploy จริง

ก่อน deploy ให้ตั้ง `PUBLIC_SITE_URL` เป็นโดเมน HTTPS จริง และตั้ง cloud ตาม [คู่มือรูป](../docs/CLOUD_MEDIA.md)

## เนื้อหา

- [วิธีแก้เนื้อหาและนำเข้า Excel](../docs/CONTENT_GUIDE.md)
- [รูปใน Cloudinary / Google Drive / CDN](../docs/CLOUD_MEDIA.md)
- `src/data/competitions.json`: 44 แมตช์ CU Freshy Debate จาก Excel ที่ผู้ใช้ตรวจแก้ 18 ตุลาคม 2569 ชนะ 29 แพ้ 15; ห้ามแก้ผลแข่งแยกจากต้นทาง
- `src/data/rosters.json`: 10 ปี ปีละ 6 คน
- `src/data/albums.json`: อัลบั้มจริง ปัจจุบันยังว่าง
- `src/data/media.json`: ทะเบียนรูปที่ทุกหน้าอ้างด้วย ID

ยังไม่มีหน้า admin แก้เนื้อหาผ่านไฟล์ข้อมูลแล้ว build ใหม่ การเชื่อม cloud เตรียมไว้ แต่ยังไม่ได้อัปโหลดหรือทดสอบกับบัญชีจริง
