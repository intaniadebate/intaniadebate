# Check-in / check-out ของทีมเว็บ

บันทึกกลางอยู่ที่ GitHub Issue ของแต่ละงาน เพื่อให้ทีมเห็นก่อน branch จะ merge และลดการแก้ตาราง Markdown ไฟล์เดียวพร้อมกัน อ่าน [คู่มือร่วมพัฒนา](../CONTRIBUTING.md) ก่อนเริ่ม

- [งานที่ยังเปิดอยู่](https://github.com/intaniadebate/intaniadebate/issues?q=is%3Aissue%20is%3Aopen)
- [Pull Requests ที่กำลังรวมงาน](https://github.com/intaniadebate/intaniadebate/pulls)
- [เปิด Work session ใหม่](https://github.com/intaniadebate/intaniadebate/issues/new?template=work-session.yml)
- [ตัวอย่างใช้งานจริง: คู่มือ check-in/check-out #1](https://github.com/intaniadebate/intaniadebate/issues/1)

หนึ่ง Issue ต่อหนึ่งงาน แต่มีหลาย session ได้ ผู้เริ่มต่อให้ check-in ใหม่ใน Issue เดิม สถานะล่าสุดให้อ่านคอมเมนต์ล่าสุด ไม่ใช้หัวข้อเริ่มต้นที่อาจเก่าแล้ว

## แม่แบบ CHECK-IN

เปิดจากแบบฟอร์ม Work session หรือวางข้อความนี้เป็นคอมเมนต์ใน Issue งานเดิม แล้ว Assign yourself:

```markdown
## CHECK-IN — active
- ผู้รับผิดชอบ: @github-username / ชื่อ session หรือ AI และผู้ดูแลที่สั่ง
- เวลาเริ่ม: YYYY-MM-DD HH:mm +07:00 (Asia/Bangkok)
- เป้าหมาย:
- Branch และ base commit:
- ขอบเขตไฟล์/หน้า/บริการที่จะเปลี่ยน:
- งานอื่นที่อาจชนกัน / ข้อตกลงแบ่งงาน:
- วิธีตรวจผล:
```

## แม่แบบ CHECK-OUT

วางเป็นคอมเมนต์ใน Issue เดิมก่อนจบหรือพักงาน:

```markdown
## CHECK-OUT — done / review / paused / blocked
- ผู้รับผิดชอบ / session:
- เวลาจบ: YYYY-MM-DD HH:mm +07:00 (Asia/Bangkok)
- สิ่งที่เปลี่ยนและไฟล์/บริการที่กระทบ:
- Branch / commit / PR:
- ผลตรวจ: ผ่าน / ไม่ผ่าน / ยังไม่ได้ตรวจ พร้อมรายละเอียด
- Deploy: ยังไม่ได้ deploy / รอ / สำเร็จ พร้อมลิงก์ Actions และผลตรวจเว็บจริง
- งานค้าง / ปัญหา / ขั้นตอนถัดไป:
- ขอบเขตที่ปล่อยให้คนอื่นรับต่อได้:
```

## ความหมายสถานะ

| สถานะล่าสุด | ความหมาย | Issue |
| --- | --- | --- |
| active | session กำลังทำในขอบเขตที่แจ้ง | เปิดไว้ |
| review | ผลงานอยู่ใน branch/PR รอตรวจหรือรวมงาน | เปิดไว้ |
| paused | พักงาน มีจุดส่งต่อและระบุขอบเขตที่ปล่อยแล้ว | เปิดไว้ |
| blocked | ติดปัญหา ระบุสิ่งที่ต้องแก้ก่อนทำต่อ | เปิดไว้ |
| done | ทำเสร็จและตรวจผลตามขอบเขตแล้ว | ปิดได้ |

หากต้องพักงาน ไม่ให้คนถัดไปเดาจากชื่อ branch หรือวันที่ commit ให้เขียนสถานะกับวิธีทำต่อไว้เสมอ การ check-out ไม่ได้แปลว่า merge หรือ deploy สำเร็จโดยอัตโนมัติ
