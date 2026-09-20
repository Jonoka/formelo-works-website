// Diagnostic bitmap generated solely in test memory. Not garment/factory imagery or a CMS asset.
import { deflateSync } from 'node:zlib';
const table = Array.from({ length: 256 }, (_, index) => {
  let c = index; for (let bit = 0; bit < 8; bit++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0;
});
function chunk(type: string, data: Buffer) {
  const name = Buffer.from(type), value = Buffer.concat([name, data]); let crc = 0xffffffff;
  for (const byte of value) crc = table[(crc ^ byte) & 255]! ^ (crc >>> 8);
  const out = Buffer.alloc(12 + data.length); out.writeUInt32BE(data.length, 0); value.copy(out, 4); out.writeUInt32BE((crc ^ 0xffffffff) >>> 0, out.length - 4); return out;
}
const letters: Record<string, string[]> = {
  T: ['11111','00100','00100','00100','00100','00100','00100'],
  E: ['11111','10000','10000','11110','10000','10000','11111'],
  S: ['11111','10000','10000','11111','00001','00001','11111'],
};
export function offlineImage(url: URL): Buffer {
  const rect = (url.searchParams.get('rect') ?? '0,0,1200,800').split(',').map(Number);
  const cropWidth = rect[2]!, cropHeight = rect[3]!;
  const width = Number(url.searchParams.get('w') ?? cropWidth), height = Math.round(cropHeight * width / cropWidth);
  if (!Number.isInteger(width) || width < 1 || width > 1200 || height < 1 || height > 1200) throw new Error('OFFLINE_IMAGE_SCOPE');
  const rowLength = width * 3 + 1, pixels = Buffer.alloc(rowLength * height);
  const scale = Math.max(1, Math.floor(width / 42)), textWidth = 23 * scale, xStart = Math.floor((width - textWidth) / 2), yStart = Math.floor((height - 7 * scale) / 2);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    let tone = (Math.floor(x / 80) + Math.floor(y / 80)) % 2 ? 214 : 230;
    const tx = Math.floor((x - xStart) / scale), ty = Math.floor((y - yStart) / scale);
    if (tx >= 0 && tx < 23 && ty >= 0 && ty < 7) {
      const letter = 'TEST'[Math.floor(tx / 6)]!, column = tx % 6;
      if (column < 5 && letters[letter]![ty]![column] === '1') tone = 65;
    }
    const at = y * rowLength + 1 + x * 3; pixels[at] = tone; pixels[at + 1] = tone; pixels[at + 2] = tone;
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 2;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', deflateSync(pixels)), chunk('IEND', Buffer.alloc(0))]);
}
