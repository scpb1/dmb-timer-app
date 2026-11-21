const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic']);
const AUDIO_EXTENSIONS = new Set(['m4a', 'mp3', 'aac']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'mov']);

function extensionFromUri(uri: string): string {
  const tail = uri.split('/').pop() ?? uri;
  const withoutQuery = tail.split('?')[0] ?? '';
  const dot = withoutQuery.lastIndexOf('.');
  if (dot < 0 || dot === withoutQuery.length - 1) {
    return '';
  }
  return withoutQuery.slice(dot + 1).toLowerCase();
}

/** Расширение картинки из белого списка. Чужое становится jpg. */
export function imageExtension(uri: string): string {
  const extension = extensionFromUri(uri);
  return IMAGE_EXTENSIONS.has(extension) ? extension : 'jpg';
}

/** Расширение аудио из белого списка. Чужое становится m4a. */
export function audioExtension(uri: string): string {
  const extension = extensionFromUri(uri);
  return AUDIO_EXTENSIONS.has(extension) ? extension : 'm4a';
}

/** Расширение видео встречи. Чужое становится mp4. */
export function videoExtension(uri: string): string {
  const extension = extensionFromUri(uri);
  return VIDEO_EXTENSIONS.has(extension) ? extension : 'mp4';
}
