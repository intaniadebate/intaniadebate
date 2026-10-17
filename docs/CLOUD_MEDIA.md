# รูปภาพและการ deploy

สถานะ 17 ตุลาคม 2026: เตรียมตัวเลือก local / Cloudinary / CDN และคำสั่งอัปโหลดไว้แล้ว ยังไม่เชื่อมบัญชี ไม่อัปโหลด ไม่ซื้อบริการ และไม่ deploy

## คำแนะนำ

**ใช้ Cloudinary สำหรับรูปที่แสดงบนเว็บ และ Google Drive แบบจำกัดสิทธิ์สำหรับต้นฉบับ** เหมาะกับเว็บชมรมที่ผู้ดูแลอยากเลือกภาพและเปลี่ยนภาพได้สะดวก โดยไม่ต้องทำระบบปรับขนาดรูปเองบนเซิร์ฟเวอร์

| ที่เก็บ | ใช้ทำอะไร | ข้อพิจารณา |
| --- | --- | --- |
| Cloudinary | รูปเว็บและ URL สำหรับหน้าเว็บ | มี Media Library, CDN และ image transformations; ตรวจโควตา storage, bandwidth และ transformations ตามแผนก่อนเปิดจริง |
| Google Drive | ต้นฉบับ สำรองไฟล์ และรับภาพจากสมาชิก | ตั้ง Restricted ให้เฉพาะผู้ดูแล; ลิงก์แชร์ไฟล์และสิทธิ์แชร์เป็นอีกชั้นที่ต้องดูแล จึงไม่แนะนำเป็น URL รูปหลักของเว็บนี้ |
| Cloudflare R2 + custom domain | ทางเลือกเมื่อมีรูปจำนวนมากและอยากควบคุม object storage | ต้องจัดการรูปย่อ/CDN และการดูแลไฟล์เพิ่ม; `r2.dev` เป็น development endpoint ที่มี rate limit ไม่ใช่ production domain |

คำแนะนำข้างต้นเป็นการเลือกตามงานของชมรม ไม่ใช่ข้อจำกัดว่า Drive ใช้แสดงภาพไม่ได้

แหล่งข้อมูลทางการ: [Cloudinary image transformations](https://cloudinary.com/documentation/image_transformations), [upload API และการเก็บ API secret](https://cloudinary.com/documentation/image_upload_api_reference), [แผนและโควตา](https://cloudinary.com/pricing), [Google Drive sharing](https://support.google.com/drive/answer/2494822?hl=en), [R2 public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/) ตรวจราคาและโควตาอีกครั้งตอน deploy

## โครงที่เตรียมไว้

ทุกหน้าเรียกรูปด้วย ID เช่น `member-2026-01` ทะเบียน `web/src/data/media.json` เก็บ alt, ขนาด, เครดิต, สิทธิ์เผยแพร่ และตำแหน่งรูป ส่วน absolute path ของไฟล์ในเครื่องอยู่ใน `web/.local/media-sources.json` ที่ไม่เข้า Git และไม่อยู่ในเว็บที่ build

เว็บเลือกแหล่งรูปด้วย environment variables:

```dotenv
PUBLIC_SITE_URL=https://www.example.org
PUBLIC_MEDIA_PROVIDER=cloudinary
PUBLIC_CLOUDINARY_CLOUD_NAME=ชื่อ-cloud
```

ชื่อ cloud และ URL รูปเป็นข้อมูลสาธารณะได้ ส่วน `CLOUDINARY_API_SECRET` และ `CLOUDINARY_API_KEY` ใช้เฉพาะคำสั่งอัปโหลดบนเครื่องผู้ดูแล เก็บใน `.env.local` ที่ถูก ignore ไม่ตั้งชื่อด้วย `PUBLIC_` และไม่ใส่ใน HTML/JavaScript ของเว็บ

ทะเบียนรูปที่อัปโหลดแล้วมี:

```json
{
  "cloudinary": { "publicId": "intania/member-2026-01", "version": 1234567890 }
}
```

Cloudinary ใช้ URL แบบ versioned พร้อม `f_auto,q_auto` และขนาดที่เหมาะกับหน้าจอ หากยังไม่มี cloud ID จะใช้ไฟล์ local ที่อนุญาตแทน รูปที่ `publishable: false` ไม่แสดงใน production ไม่ว่าตั้ง provider ใด

## ขั้นตอนตอนพร้อมใช้ cloud

1. ให้ผู้ดูแลสมัครบัญชีด้วยอีเมลที่จะส่งต่อให้ชมรมได้ เปิด 2FA เก็บ recovery codes อย่างปลอดภัย และใช้สิทธิ์ผู้ร่วมดูแลตามแผนบริการจริง หลีกเลี่ยงแชร์รหัสผ่านกัน
2. เก็บต้นฉบับบน Drive แบบ Restricted แยกหมวด/ปี เลือกเฉพาะรูปที่จะเผยแพร่ ตรวจชื่อบุคคล เครดิต และคำบรรยาย
3. ลงทะเบียนรูปตาม [คู่มือเนื้อหา](CONTENT_GUIDE.md) และตั้ง `publishable: true` เฉพาะรูปที่พร้อมเผยแพร่
4. คัดลอก `.env.example` เป็น `.env.local` ใส่ชื่อ cloud กับ upload credentials บนเครื่องผู้ดูแล
5. `npm run media:upload` จะแสดงรายการเท่านั้น ไม่ส่งไฟล์; เมื่อตรวจรายการแล้วใช้ `npm run media:upload -- --upload --apply` หรือระบุ `--id=...` เพื่อส่งเฉพาะรูป
6. คำสั่งส่งภาพ WebP ด้านยาวไม่เกิน 1920 px ที่ตัด metadata แล้ว ไม่ส่งต้นฉบับเต็ม และใช้ signed upload ผ่าน API secret ฝั่งเครื่องผู้ดูแล ไม่สร้าง unsigned upload endpoint ในเว็บ
7. ตรวจทะเบียนที่ได้ แล้ว commit เฉพาะ metadata ตั้ง PUBLIC variables ใน hosting และ build ใหม่

ตัวอัปโหลดใช้ `overwrite=false` เพื่อไม่ทับรูปเดิมโดยไม่ตั้งใจ หากมีการอัปโหลดสำเร็จบางไฟล์ก่อนคำสั่งหยุด ให้ดู Media Library และเติม publicId/version ของไฟล์เหล่านั้นก่อนรันต่อ กรณีเปลี่ยนภาพ แนะนำสร้าง ID ใหม่แล้วเปลี่ยน reference เพื่อให้ย้อนกลับได้ หรือ replace ใน Media Library แล้วปรับ version ในทะเบียน

## เพิ่มหรือแก้รูปหลังเปิดเว็บ

- เพิ่มภาพใน Cloudinary ไม่ทำให้เกิดอัลบั้มอัตโนมัติ ต้องเพิ่มข้อมูลรูป/อัลบั้มในทะเบียนแล้ว build ใหม่
- แก้ alt, caption, credit ในไฟล์ข้อมูล ไม่ฝังใน component
- เปลี่ยนรูปโดยใช้ ID ใหม่หรืออัปเดต publicId/version แล้ว build ใหม่ เพื่อหลีกเลี่ยง cache ของภาพเก่า
- การถอนรูปจากเว็บที่ deploy แล้วต้อง deploy ใหม่และจัดการไฟล์เก่าบน cloud/hosting ด้วย การตั้ง `publishable: false` ป้องกันการแสดงใน build ถัดไป ไม่ทำให้ URL ภาพสาธารณะเดิมกลายเป็นส่วนตัว
- Drive สำหรับสำรองเท่านั้น อย่าเปิดโฟลเดอร์ต้นฉบับเป็น Anyone with the link เพื่อทำให้เว็บเข้าถึงรูป

## ถ้าเลือก CDN อื่นภายหลัง

ตั้ง `PUBLIC_MEDIA_PROVIDER=cdn`, `PUBLIC_MEDIA_CDN_BASE_URL=https://images.example.org` แล้วเพิ่ม `cdnPath` ของแต่ละภาพในทะเบียน เช่น `members/2026/01.webp` ตัว resolver ยอมรับเฉพาะ HTTPS และปฏิเสธ path ที่ไล่ออกนอกฐาน สามารถเก็บไฟล์เว็บที่สร้างไว้บน R2/CDN ตาม path นี้ได้

## Hosting ที่เข้ากับงานนี้

เสนอ Cloudflare Pages สำหรับเว็บ static และ custom domain โดยใช้ GitHub repo, root `web`, build `npm run build`, output `dist` และ Node >=22.22 ผู้ดูแลแก้ข้อมูล → commit → hosting build ใหม่ ตรวจข้อกำหนดและราคา ณ วันใช้งานจริง; ยังไม่ได้เลือกแพ็กเกจหรือเชื่อมบัญชีให้
