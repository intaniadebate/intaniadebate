import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { loadLocalEnv } from './env.mjs';
import sharp from 'sharp';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
loadLocalEnv(root);
const manifest = JSON.parse(await fs.readFile(path.join(root, 'src', 'data', 'media.json'), 'utf8'));
const sources = JSON.parse(await fs.readFile(path.join(root, '.local', 'media-sources.json'), 'utf8').catch(() => '{}'));
const requested = process.argv.find(arg => arg.startsWith('--id='))?.slice(5);
const candidates = Object.entries(manifest).filter(([id, asset]) => (!requested || id === requested) && asset.publishable && sources[id] && !asset.cloudinary);
if (!process.argv.includes('--upload')) {
  console.log(`Dry run: ${candidates.length} approved local images can be uploaded. No data was sent.`);
  for (const [id] of candidates) console.log(`  ${id}`);
  console.log('Use --upload after configuring Cloudinary in .env.local; --apply writes returned asset IDs to the media catalog.');
} else {
  const cloud = process.env.PUBLIC_CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !/^[a-zA-Z0-9_-]+$/.test(cloud) || !key || !secret) throw new Error('Set Cloudinary cloud name and upload credentials in .env.local');
  const uploaded = {};
  for (const [id] of candidates) {
    const timestamp = Math.floor(Date.now() / 1000);
    const params = { overwrite: 'false', public_id: `intania/${id}`, timestamp: String(timestamp) };
    const toSign = Object.keys(params).sort().map(name => `${name}=${params[name]}`).join('&');
    const signature = createHash('sha1').update(toSign + secret).digest('hex');
    const form = new FormData();
    const webImage = await sharp(sources[id]).rotate().resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true }).webp({ quality: 88 }).toBuffer();
    form.set('file', new Blob([webImage], { type: 'image/webp' }), `${id}.webp`);
    for (const [name, value] of Object.entries(params)) form.set(name, value);
    form.set('api_key', key); form.set('signature', signature);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: 'POST', body: form });
    if (!response.ok) throw new Error(`Upload failed (${response.status}) for ${id}; credentials were not logged`);
    const result = await response.json();
    uploaded[id] = { publicId: result.public_id, version: result.version };
    console.log(`Uploaded: ${id}`);
  }
  await fs.mkdir(path.join(root, '.local'), { recursive: true });
  await fs.writeFile(path.join(root, '.local', 'cloudinary-upload-results.json'), JSON.stringify(uploaded, null, 2) + '\n');
  if (process.argv.includes('--apply')) {
    for (const [id, value] of Object.entries(uploaded)) manifest[id].cloudinary = value;
    await fs.writeFile(path.join(root, 'src', 'data', 'media.json'), JSON.stringify(manifest, null, 2) + '\n');
  }
}
