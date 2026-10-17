const allowedWidths = [400, 640, 960, 1440, 1920];
export function resolveMedia(asset, config = {}, width = 960) {
  if (!asset || (!asset.publishable && !config.preview)) return null;
  const targetWidth = allowedWidths.find(w => w >= width) || 1920;
  if (config.provider === 'cloudinary' && asset.cloudinary?.publicId && /^[a-zA-Z0-9_-]+$/.test(config.cloudName || '')) {
    const parts = asset.cloudinary.publicId.split('/');
    if (parts.some(p => !p || p === '.' || p === '..' || /[\\\u0000-\u001f]/.test(p))) throw new Error('Unsafe Cloudinary public ID');
    const id = parts.map(encodeURIComponent).join('/');
    const version = Number.isInteger(asset.cloudinary.version) ? `v${asset.cloudinary.version}/` : '';
    return `https://res.cloudinary.com/${config.cloudName}/image/upload/f_auto,q_auto,c_limit,w_${targetWidth}/${version}${id}`;
  }
  if (config.provider === 'cdn' && asset.cdnPath && config.cdnBase) {
    const base = new URL(config.cdnBase);
    if (base.protocol !== 'https:' || base.username || base.password) throw new Error('The public media CDN must use HTTPS without credentials');
    const key = asset.cdnPath.replace(/^\/+/, '');
    const parts = key.split('/').map(decodeURIComponent);
    if (parts.some(p => !p || p === '..' || p === '.' || /[:\\/\u0000-\u001f]/.test(p))) throw new Error('Unsafe CDN object path');
    return new URL(parts.map(encodeURIComponent).join('/'), base.href.replace(/\/?$/, '/')).href;
  }
  if (asset.local?.startsWith('/media/') && !asset.local.includes('..')) {
    const variant = asset.variants?.find(v => v.width >= targetWidth) || asset.variants?.at(-1);
    return variant?.src || asset.local;
  }
  return null;
}
export function mediaSrcset(asset, config) {
  if (!resolveMedia(asset, config)) return undefined;
  if (config.provider === 'cloudinary' && asset?.cloudinary) return [400, 640, 960, 1440].map(w => `${resolveMedia(asset, config, w)} ${w}w`).join(', ');
  if (config.provider === 'cdn' && asset?.cdnPath) return undefined;
  return asset?.variants?.map(v => `${v.src} ${v.width}w`).join(', ') || undefined;
}
