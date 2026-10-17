# intaniadebate

เว็บไซต์ Intania Debate Club — MVP 2

เว็บสาธารณะ: https://woraphontrangpanich-jpg.github.io/intaniadebate/

Home และ 3 หน้าหลัก: เส้นทางแข่งขัน ทำเนียบ และนอกเวที ข้อมูลการแข่งขัน 2017–2026 จากตารางของชมรม รายชื่อ/อัลบั้มอยู่ระหว่างรวบรวม

## พัฒนาในเครื่อง

Node.js >=22.22 จากนั้น:

```sh
cd web
npm ci
npm run dev
```

Push เข้า `main` จะ build และ deploy ผ่าน GitHub Actions อัตโนมัติ ภาพต้นฉบับ Excel และ credentials ไม่อยู่ใน repo นี้ รูปที่ยังรออนุญาตเผยแพร่แสดงเป็นพื้นที่ว่าง

- [คู่มือเว็บ](web/README.md)
- [แก้เนื้อหา](docs/CONTENT_GUIDE.md)
- [Cloud media](docs/CLOUD_MEDIA.md)
