# intaniadebate

เว็บไซต์ Intania Debate Club — MVP 2

เว็บสาธารณะ: https://intaniadebateclub.com/

Repository ของชมรม: https://github.com/intaniadebate/intaniadebate

สถานะการเชื่อมโดเมนและ HTTPS: [คู่มือโดเมน](docs/CUSTOM_DOMAIN.md)

Home และ 3 หน้าหลัก: เส้นทางแข่งขัน ทำเนียบ และนอกเวที ข้อมูลการแข่งขัน 2017–2026 จากตารางของชมรม รายชื่อ/อัลบั้มอยู่ระหว่างรวบรวม

## ทำงานร่วมกัน: check-in / check-out ทุกงาน

ใช้ขั้นตอนนี้ทั้งผู้ดูแลและ AI ก่อนแก้โค้ด เนื้อหา รูป เอกสาร หรือการตั้งค่าบริการ:

1. อ่าน [คู่มือร่วมพัฒนา](CONTRIBUTING.md) และตรวจ [งานที่เปิดอยู่](https://github.com/intaniadebate/intaniadebate/issues?q=is%3Aissue%20is%3Aopen) ว่ามีคนทำส่วนเดียวกันหรือไม่
2. **Check-in ก่อนเริ่มแก้**: เปิด Issue แบบ [Work session](https://github.com/intaniadebate/intaniadebate/issues/new?template=work-session.yml) หรือเพิ่มคอมเมนต์ใน Issue งานเดิม ระบุผู้ทำ เวลา branch และไฟล์/ส่วนที่จะรับผิดชอบ แล้ว Assign yourself
3. แยก branch ต่อหนึ่งงาน ส่ง Pull Request เข้า `main` และระบุผลตรวจตามจริง การ merge เข้า `main` จะเผยแพร่เว็บอัตโนมัติ
4. **Check-out ก่อนจบหรือพักงาน**: บันทึกสิ่งที่แก้ commit/PR ผลทดสอบ สถานะ deploy งานค้าง และขอบเขตที่ส่งต่อได้ใน Issue เดิม

ดู [แม่แบบบันทึกงาน](docs/WORK_LOG.md) และ [ข้อกำหนดสำหรับ AI](AGENTS.md) สถานะล่าสุดใน Issue คือข้อมูลกลางของทีม; อย่าทับไฟล์ที่คนอื่นกำลังแก้โดยไม่ประสานกัน

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
- [Deploy และส่งต่อผู้ดูแล](docs/GITHUB_PAGES.md)
