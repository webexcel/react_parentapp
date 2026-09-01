/**
 * Shared `event_image` parser.
 *
 * The backend stores attachment URLs in the `event_image` column of several
 * tables (flashmessage, final, homeworkapp, newsevent, sms_*) in one of two
 * shapes, and BOTH must keep working:
 *
 *   - NEW: a JSON array string  — '["https://…","https://…"]'  (multi-attach)
 *   - OLD: a single bare URL    — 'https://…'                  (legacy rows)
 *
 * Nothing writes the bare form any more, but rows created before the
 * multi-attach change keep it forever, so the legacy branch is permanent.
 *
 * Mirrors parseEventImage in the teacher app (src/utils/fileUtils.ts) and in
 * st_react (src/utils/eventImage.js) — keep the three in step.
 */

export type AttachmentType = 'pdf' | 'image' | 'audio' | 'video' | 'document';

export interface Attachment {
  id: string;
  type: AttachmentType;
  url: string;
  name: string;
  size?: number;
  /** Derived poster URL for videos. May 404 — render a play icon on error. */
  thumb?: string;
}

const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
const VIDEO_EXT = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
const AUDIO_EXT = ['mp3', 'wav', 'aac', 'm4a', 'ogg'];

/** File extension of a URL, lowercased, without the dot. */
export const getFileExtension = (url: string): string => {
  const clean = String(url || '').split('?')[0].split('#')[0];
  const last = clean.split('/').pop() || '';
  const parts = last.split('.');
  return parts.length > 1 ? (parts.pop() || '').toLowerCase() : '';
};

export const getAttachmentType = (url: string): AttachmentType => {
  const ext = getFileExtension(url);
  if (ext === 'pdf') return 'pdf';
  if (IMAGE_EXT.includes(ext)) return 'image';
  if (AUDIO_EXT.includes(ext)) return 'audio';
  if (VIDEO_EXT.includes(ext)) return 'video';
  return 'document';
};

/**
 * Poster URL for a video, by convention — never stored in the DB.
 *   .../flash/files/<name>.mp4  →  .../flash/files/thumbnail/<name>.jpg
 * The backend writes the poster under that derived key using the SAME stamped
 * basename as the video (st_node src/utils/flashAttachments.js).
 *
 * A poster is NOT guaranteed: videos uploaded before the convention, and web
 * uploads where the browser could not grab a frame, have no object there.
 * Callers must fall back to a play icon on load error.
 */
export const getThumbnailUrl = (url: string): string =>
  String(url || '').replace(/\/([^/]+)\.[^./]+$/, '/thumbnail/$1.jpg');

/** Human-friendly file name from a URL. */
export const getFileName = (url: string): string => {
  const last = String(url || '').split('?')[0].split('/').pop() || '';
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
};

const buildAttachment = (url: string, id: string): Attachment => {
  const clean = String(url).trim();
  const type = getAttachmentType(clean);
  return {
    id,
    type,
    url: clean,
    name: getFileName(clean) || 'Attachment',
    ...(type === 'video' ? { thumb: getThumbnailUrl(clean) } : {}),
  };
};

/**
 * Parse an `event_image` value into a list of attachments.
 * Always returns an array; never throws.
 *
 * @param eventImage raw column value (or an already-parsed array)
 * @param index      row index, used to build stable per-row attachment ids
 */
export const parseAttachments = (eventImage: any, index: number = 0): Attachment[] => {
  // Already parsed (re-render, cached query data)
  if (Array.isArray(eventImage)) {
    return eventImage
      .map((item: any, idx: number) =>
        item && typeof item === 'object' && item.url
          ? (item as Attachment)
          : buildAttachment(String(item), `${index}-${idx}`),
      )
      .filter(a => !!a.url);
  }

  if (!eventImage || typeof eventImage !== 'string') return [];

  const s = eventImage.trim();
  // The column can genuinely hold these as text.
  if (s === '' || s === 'null' || s === 'undefined' || s === '[]') return [];

  // NEW: JSON array. Strip stray whitespace inside URLs before parsing.
  if (s.startsWith('[')) {
    try {
      const parsed = JSON.parse(s.replace(/\s+/g, ''));
      if (Array.isArray(parsed)) {
        return parsed
          .filter((u: any) => typeof u === 'string' && u.trim() !== '')
          .map((u: string, idx: number) => buildAttachment(u, `${index}-${idx}`));
      }
    } catch {
      // Malformed — fall through to the salvage pass below.
    }
  }

  // OLD: a single bare URL.
  if (s.startsWith('http')) return [buildAttachment(s, String(index))];

  // Salvage: event_image was varchar(100) until the multi-attach change, so
  // early rows can hold a truncated JSON array whose first URL is still intact.
  const found = s.match(/https?:\/\/[^\s",\]]+/g);
  if (found) return found.map((u, idx) => buildAttachment(u, `${index}-${idx}`));

  return [];
};
