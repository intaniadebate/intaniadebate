import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { rivals, resultSummary, validateData } from '../src/lib/data.mjs';
import { resolveMedia, mediaSrcset } from '../src/lib/media.mjs';
const read = file => JSON.parse(fs.readFileSync(new URL(file, import.meta.url), 'utf8'));
const competition = read('../src/data/competitions.json');
const roster = read('../src/data/rosters.json');
const media = read('../src/data/media.json');
const albums = read('../src/data/albums.json');

test('the approved Excel import retains all 43 rows, source fingerprint and all ten final placements', () => {
  assert.equal(competition.matches.length, 43);
  const workbook = path.resolve('..', 'การแข่งขัน', competition.source);
  assert.equal(createHash('sha256').update(fs.readFileSync(workbook)).digest('hex'), competition.sourceSha256);
  assert.deepEqual(competition.seasons.map(s => s.placement), ['อันดับ 4', 'อันดับ 3', 'ตกรอบคัดเลือก', 'อันดับ 4', 'อันดับ 1', 'อันดับ 3', 'อันดับ 4', 'อันดับ 2', 'อันดับ 2', 'ตกรอบคัดเลือก']);
  assert.equal(resultSummary(competition.matches).wins + resultSummary(competition.matches).losses, 43);
  validateData(competition, roster, albums, media);
});
test('rival totals account for each imported match once; the alternate event has its own scope', () => {
  assert.equal(rivals(competition.matches).reduce((n, r) => n + r.matches.length, 0), 43);
  assert.equal(rivals(competition.matches, { event: 'freshy' }).reduce((n, r) => n + r.matches.length, 0), 42);
  assert.equal(rivals(competition.matches, { event: 'visionary' }).reduce((n, r) => n + r.matches.length, 0), 1);
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
