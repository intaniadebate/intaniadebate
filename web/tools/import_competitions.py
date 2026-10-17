"""Import the approved workbook unchanged; no result inference is performed here."""
import argparse
import hashlib
import json
import re
from datetime import datetime, timezone, timedelta
from pathlib import Path
from openpyxl import load_workbook

parser = argparse.ArgumentParser()
parser.add_argument('workbook', type=Path)
parser.add_argument('--output', type=Path, default=Path(__file__).resolve().parents[1] / 'src/data/competitions.json')
parser.add_argument('--validated-source', type=Path, help='User-reviewed source workbook used to update this master')
args = parser.parse_args()
book = load_workbook(args.workbook, read_only=True, data_only=True)
sheet = book['ผลการแข่งขัน']
headers = next(sheet.iter_rows(min_row=4, max_row=4, values_only=True))
matches = []
media_file = args.output.parent / 'media.json'
source_file = args.output.parents[2] / '.local/media-sources.json'
media = json.loads(media_file.read_text(encoding='utf-8')) if media_file.exists() else {}
media_sources = json.loads(source_file.read_text(encoding='utf-8')) if source_file.exists() else {}
def links(value):
    return re.findall(r'https://[^\s;]+', str(value or ''))
def clean(value):
    return str(value).strip() if value is not None else ''
for row in sheet.iter_rows(min_row=5, values_only=True):
    if not row[0]:
        continue
    d = dict(zip(headers, row))
    get = lambda key: clean(d.get(key))
    year = int(d['ปี ค.ศ.'])
    seq = int(d['ลำดับในปี'])
    event = 'visionary' if 'สร้างสรรค์สังคม' in get('รอบ') else 'freshy'
    if not get('ญัตติ') or not get('คู่แข่ง') or get('ผลของวิศวะ') not in ('ชนะ', 'แพ้'):
        raise ValueError(f'Incomplete match in {year}, sequence {seq}')
    image_keys = []
    for source in get('ภาพหลักฐานในคลัง').splitlines():
        p = Path(source)
        if not p.is_file():
            continue
        key = 'evidence-' + hashlib.sha256(p.name.encode()).hexdigest()[:12]
        if key not in media:
            from PIL import Image
            with Image.open(p) as im:
                w, h = im.size
            media[key] = {'local': f'/media/{key}.webp', 'width': w, 'height': h, 'alt': f'หลักฐานการแข่งขันปี {year + 543} {get("รอบ")} กับ{get("คู่แข่ง")}', 'publishable': False, 'kind': 'evidence'}
        media_sources[key] = str(p)
        image_keys.append(key)
    matches.append({
        'id': f'{year}-{event}-{seq:02d}', 'year': year, 'sequence': seq,
        'eventId': event, 'order': float(d['ลำดับรอบ']), 'round': get('รอบ'),
        'motion': get('ญัตติ'), 'side': get('ฝ่ายวิศวะ'), 'opponent': get('คู่แข่ง'),
        'opponentSide': get('ฝ่ายคู่แข่ง'), 'result': get('ผลของวิศวะ'),
        'basis': get('สถานะผล'), 'decision': get('มติ'), 'judges': get('จำนวนกรรมการ'),
        'awards': [get(f'นักโต้ดีเด่นอันดับ {i}') for i in range(1, 5)],
        'placement': get('อันดับสุดท้ายปีนั้น'), 'videos': links(d.get('วิดีโอหรือเพลย์ลิสต์')),
        'sources': links(d.get('โพสต์ผล')), 'images': image_keys,
        'reviewed': bool(args.validated_source),
    })
annual = []
for row in book['สรุปรายปี'].iter_rows(min_row=5, values_only=True):
    if row[0]:
        annual.append({'year': int(row[0]), 'placement': clean(row[2])})
book.close()
payload = {'source': args.workbook.name, 'sourceSha256': hashlib.sha256(args.workbook.read_bytes()).hexdigest(), 'updatedAt': datetime.now(timezone(timedelta(hours=7))).date().isoformat(), 'seasons': annual, 'matches': matches}
if args.validated_source:
    payload['validation'] = {'source': args.validated_source.name,
                             'sourceSha256': hashlib.sha256(args.validated_source.read_bytes()).hexdigest(),
                             'date': payload['updatedAt']}
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(args.output.parent / 'media.json').write_text(json.dumps(media, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
local_dir = args.output.parents[2] / '.local'
local_dir.mkdir(exist_ok=True)
(local_dir / 'media-sources.json').write_text(json.dumps(media_sources, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Imported {len(matches)} workbook rows, {len(annual)} seasons, {len(media)} image references')
