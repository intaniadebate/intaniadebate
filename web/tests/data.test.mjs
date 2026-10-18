import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { awardText, intania, rivals, resultSummary, validateData } from '../src/lib/data.mjs';
import { resolveMedia, mediaSrcset } from '../src/lib/media.mjs';
const read = file => JSON.parse(fs.readFileSync(new URL(file, import.meta.url), 'utf8'));
const competition = read('../src/data/competitions.json');
const roster = read('../src/data/rosters.json');
const media = read('../src/data/media.json');
const albums = read('../src/data/albums.json');
const videoPreviews = read('../src/data/video-previews.json');

test('team years map to Intania cohort codes', () => {
  assert.equal(intania(2017), 'Intania 101');
  assert.equal(intania(2026), 'Intania 110');
});
test('the validated import retains all 44 rows and all ten final placements', () => {
  assert.equal(competition.matches.length, 44);
  assert.deepEqual(competition.seasons.map(s => s.placement), ['อันดับ 4', 'อันดับ 3', 'ตกรอบคัดเลือก', 'อันดับ 4', 'อันดับ 1', 'อันดับ 3', 'อันดับ 4', 'อันดับ 2', 'อันดับ 2', 'ตกรอบคัดเลือก']);
  assert.deepEqual(resultSummary(competition.matches), { total: 44, wins: 29, losses: 15 });
  assert.ok(competition.matches.every(m => m.reviewed));
  assert.equal(competition.validation.date, '2026-10-18');
  validateData(competition, roster, albums, media);
});
// The source workbook is private and deliberately absent from the public repo/CI.
// When explicitly supplied, a mismatch must fail rather than silently skip.
test('an explicitly supplied private source workbook matches the import fingerprint', { skip: !process.env.INTANIA_SOURCE_WORKBOOK && 'private workbook not supplied' }, () => {
  const workbook = path.resolve(process.env.INTANIA_SOURCE_WORKBOOK);
  assert.equal(createHash('sha256').update(fs.readFileSync(workbook)).digest('hex'), competition.sourceSha256);
});
test('rival totals account for each validated match once and retain event filtering', () => {
  assert.equal(rivals(competition.matches).reduce((n, r) => n + r.matches.length, 0), 44);
  assert.equal(rivals(competition.matches, { event: 'freshy' }).reduce((n, r) => n + r.matches.length, 0), 44);
  assert.equal(rivals(competition.matches, { event: 'visionary' }).reduce((n, r) => n + r.matches.length, 0), 0);
});

test('corrected results, inserted rounds and the confirmed 2023 motion survive the import', () => {
  const match = (year, order) => competition.matches.find(m => m.year === year && m.order === order);
  assert.equal(match(2020, 2).result, 'แพ้');
  assert.equal(match(2020, 2.5).result, 'ชนะ');
  assert.equal(match(2022, 1).result, 'ชนะ');
  assert.equal(match(2022, 2).result, 'ชนะ');
  assert.equal(match(2021, 3).opponent, 'คณะแพทยศาสตร์');
  assert.equal(match(2022, 3).opponent, 'คณะพาณิชยศาสตร์และการบัญชี');
  assert.equal(match(2024, 2).opponent, 'คณะอักษรศาสตร์');
  assert.equal(match(2021, 1).motion, 'เวทีประกวดนางงามไม่ควรจัดต่อไปในอนาคต');
  assert.equal(match(2023, 3).motion, 'อสังหาริมทรัพย์ไทยไม่ควรให้ชาวต่างชาติซื้อขายขาดได้');
  assert.equal(match(2021, 6).round, 'รอบชิงชนะเลิศ');
  for (const year of [2021, 2022, 2023, 2024]) {
    assert.equal(competition.matches.filter(m => m.year === year).length, 5);
  }
});

test('each YouTube match recording has a titled poster from the approved thumbnail host', () => {
  const youtubeHosts = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be']);
  const videoUrls = [...new Set(competition.matches.flatMap(match => match.videos))];
  const youtubeUrls = videoUrls.filter(value => youtubeHosts.has(new URL(value).hostname));
  assert.deepEqual(Object.keys(videoPreviews).sort(), youtubeUrls.sort());
  for (const url of youtubeUrls) {
    const preview = videoPreviews[url];
    const thumbnail = new URL(preview.thumbnail);
    assert.ok(preview.title.trim());
    assert.equal(thumbnail.protocol, 'https:');
    assert.equal(thumbnail.hostname, 'i.ytimg.com');
    assert.ok(Number.isInteger(preview.width) && preview.width > 0);
    assert.ok(Number.isInteger(preview.height) && preview.height > 0);
  }
});

test('a known award role remains visible when the person name is unavailable', () => {
  assert.equal(awardText('ไม่พบข้อมูล - หัวหน้าฝ่ายค้าน'), 'หัวหน้าฝ่ายค้าน');
  assert.equal(awardText('ไม่พบข้อมูล สนับสนุนค้าน #3'), 'สนับสนุนค้าน #3');
  assert.equal(awardText('ไม่พบข้อมูล'), '');
  assert.equal(awardText('— รอบนี้ประกาศอันดับ 1 เท่านั้น'), '');
});
test('rivals rank losses before frequency and frequency before their name', () => {
  const fixture = [
    ...Array.from({ length: 2 }, () => ({ opponent: 'A', result: 'แพ้', year: 2020, eventId: 'freshy' })),
    ...Array.from({ length: 2 }, () => ({ opponent: 'B', result: 'แพ้', year: 2020, eventId: 'freshy' })),
    { opponent: 'B', result: 'ชนะ', year: 2020, eventId: 'freshy' },
    ...Array.from({ length: 4 }, () => ({ opponent: 'C', result: 'ชนะ', year: 2021, eventId: 'freshy' })),
  ];
  assert.deepEqual(rivals(fixture).map(r => r.name), ['B', 'A', 'C']);
  assert.equal(rivals(fixture, { year: 2021 })[0].name, 'C');
});
test('every year has six slots and no real member names are fabricated', () => {
  assert.equal(roster.length, 10);
  assert.ok(roster.every(r => r.members.length === 6));
  const broken = structuredClone(roster); broken[0].members.pop();
  assert.throws(() => validateData(competition, broken, albums, media), /six members/);
});
test('media delivery supports cloud resizing, versioned URLs and local fallback', () => {
  const asset = { publishable: true, local: '/media/test.webp', cloudinary: { publicId: 'intania/test portrait', version: 123 } };
  assert.equal(resolveMedia(asset, { provider: 'cloudinary', cloudName: 'club' }, 600), 'https://res.cloudinary.com/club/image/upload/f_auto,q_auto,c_limit,w_640/v123/intania/test%20portrait');
  assert.equal(resolveMedia(asset, { provider: 'local' }), '/media/test.webp');
  assert.equal(resolveMedia(asset, { provider: 'cloudinary', cloudName: '' }), '/media/test.webp');
});
test('unapproved media cannot be delivered in production, including srcset', () => {
  const asset = { publishable: false, local: '/media/test.webp', cloudinary: { publicId: 'test' } };
  assert.equal(resolveMedia(asset, { provider: 'cloudinary', cloudName: 'club' }), null);
  assert.equal(mediaSrcset(asset, { provider: 'cloudinary', cloudName: 'club' }), undefined);
  assert.equal(resolveMedia(asset, { preview: true }), '/media/test.webp');
});
test('generic CDN delivery rejects insecure origins and object path escape attempts', () => {
  const asset = { publishable: true, cdnPath: 'members/2026/person.webp' };
  assert.equal(resolveMedia(asset, { provider: 'cdn', cdnBase: 'https://images.example.com/club' }), 'https://images.example.com/club/members/2026/person.webp');
  assert.throws(() => resolveMedia(asset, { provider: 'cdn', cdnBase: 'http://images.example.com' }), /HTTPS/);
  for (const bad of ['../private.webp', '%2e%2e/private.webp', 'https://other.example/file.webp', 'test\\escape.webp']) assert.throws(() => resolveMedia({ ...asset, cdnPath: bad }, { provider: 'cdn', cdnBase: 'https://images.example.com' }), /Unsafe/);
});
