import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { variantWidths } from '../scripts/prepare-media.mjs';

test('variant widths use the stored width for upright photos', () => {
  assert.deepEqual(variantWidths({ width: 1000, height: 600, orientation: 1 }), [640, 1000]);
  assert.deepEqual(variantWidths({ width: 3000, height: 2000 }), [640, 1440]);
});

test('variant widths use the displayed width for EXIF-rotated photos', () => {
  assert.deepEqual(variantWidths({ width: 1000, height: 600, orientation: 6 }), [600]);
  assert.deepEqual(variantWidths({ width: 4000, height: 3000, orientation: 8 }), [640, 1440]);
});

test('planned widths match the auto-oriented derivative sharp produces', async () => {
  const source = await sharp({ create: { width: 1000, height: 600, channels: 3, background: '#c33' } }).jpeg().withMetadata({ orientation: 6 }).toBuffer();
  for (const width of variantWidths(await sharp(source).metadata())) {
    const output = await sharp(source).rotate().resize({ width, withoutEnlargement: true }).webp().toBuffer();
    assert.equal((await sharp(output).metadata()).width, width);
  }
});
