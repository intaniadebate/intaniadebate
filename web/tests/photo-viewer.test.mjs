import test from 'node:test';
import assert from 'node:assert/strict';
import { safePhotoUrl, installPhotoViewer } from '../src/lib/photo-viewer.mjs';
const origin = 'https://intaniadebateclub.com';
function fixture() {
  class Node {
    listeners = new Map(); hidden = false; textContent = ''; disabled = false;
    addEventListener(name, fn) { this.listeners.set(name, [...(this.listeners.get(name) || []), fn]); }
    fire(name, data = {}) { for (const fn of this.listeners.get(name) || []) fn(data); }
    removeAttribute(name) { delete this[name]; }
  }
  const dialog = new Node(), photo = new Node(), status = new Node(), caption = new Node(), close = new Node();
  const previous = new Node(), next = new Node(); previous.dataset = { photoStep: '-1' }; next.dataset = { photoStep: '1' };
  dialog.open = false; dialog.showModal = () => { dialog.open = true; }; dialog.close = () => { dialog.open = false; dialog.fire('close'); };
  dialog.querySelector = s => ({ img: photo, '[data-photo-status]': status, '[data-photo-caption]': caption, '[data-photo-close]': close })[s];
  dialog.querySelectorAll = () => [previous, next]; dialog.getBoundingClientRect = () => ({ left: 10, right: 100, top: 10, bottom: 100 });
  const doc = new Node(); doc.querySelector = s => s === '[data-photo-viewer]' ? dialog : null;
  const events = [], win = new Node(); win.location = { origin }; win.HTMLDialogElement = class {};
  win.CustomEvent = class { constructor(type, options) { this.type = type; this.detail = options.detail; } };
  win.dispatchEvent = event => events.push(event);
  const opener = { isConnected: true, focus() { this.focused = true; } };
  const viewer = installPhotoViewer({ doc, win });
  const collection = { section: 'members', year: 2018, member_id: '2018-01', photos: [{ id: 'roster-2018-01', src: '/media/portrait.webp', alt: 'ชื่อสำหรับแสดงในเว็บเท่านั้น' }] };
  return { dialog, photo, status, close, next, previous, events, win, viewer, opener, collection };
}
test('photo URLs reject script/data schemes, credentials and insecure third-party origins', () => {
  for (const value of [undefined, '', 'javascript:alert(1)', 'data:image/svg+xml,test', 'https://user:password@example.com/a', 'http://other.example/a']) assert.equal(safePhotoUrl(value, origin), null);
  assert.equal(safePhotoUrl('/media/a.webp', origin), `${origin}/media/a.webp`);
});
test('a portrait counts an open, then one view only after a successful visible load', () => {
  const f = fixture(); assert.equal(f.viewer.open(f.collection, f.opener), true);
  assert.equal(f.events[0].type, 'intania:photo-open');
  assert.equal(f.events.some(e => e.type === 'intania:photo-view'), false);
  f.photo.naturalWidth = 640; f.photo.fire('load'); f.photo.fire('load');
  assert.equal(f.events.filter(e => e.type === 'intania:photo-view').length, 1);
  assert.equal(f.events.at(-1).detail.image_id, 'roster-2018-01');
  assert.ok(!JSON.stringify(f.events).includes('ชื่อสำหรับแสดง'));
  assert.equal(f.next.disabled, true);
  f.close.fire('click'); assert.equal(f.opener.focused, true);
  f.photo.fire('load'); assert.equal(f.events.at(-1).type, 'intania:photo-close');
});
test('album navigation counts each successfully displayed image and works with keyboard controls', () => {
  const f = fixture(); f.viewer.open({ ...f.collection, section: 'memories', album_id: 'trip-2018', photos: [...f.collection.photos, { id: 'memory-02', src: '/media/second.webp', alt: 'ภาพที่สอง' }] }, f.opener);
  assert.equal(f.events[0].type, 'intania:album-open');
  f.photo.fire('error'); assert.equal(f.events.some(e => e.type === 'intania:photo-view'), false);
  f.next.fire('click'); f.photo.naturalWidth = 640; f.photo.fire('load');
  assert.equal(f.events.at(-1).detail.image_id, 'memory-02');
  assert.equal(f.events.at(-1).detail.method, 'next');
  f.dialog.fire('keydown', { key: 'ArrowLeft', preventDefault() {} }); f.photo.fire('load');
  assert.equal(f.events.at(-1).detail.image_id, 'roster-2018-01');
  assert.equal(f.events.at(-1).detail.method, 'previous');
});
test('fallback backdrop dismissal never closes on the image or dialog padding', () => {
  const f = fixture(); f.viewer.open(f.collection, f.opener);
  f.dialog.fire('click', { target: f.photo, clientX: 0, clientY: 0 }); assert.equal(f.dialog.open, true);
  f.dialog.fire('click', { target: f.dialog, clientX: 20, clientY: 20 }); assert.equal(f.dialog.open, true);
  f.dialog.fire('click', { target: f.dialog, clientX: 0, clientY: 0 }); assert.equal(f.dialog.open, false);
});
