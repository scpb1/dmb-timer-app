import { audioExtension, imageExtension, videoExtension } from '@/utils/mediaExtension';

describe('mediaExtension', () => {
  it('оставляет картинки из белого списка и заменяет остальное на jpg', () => {
    expect(imageExtension('file:///tmp/photo.HEIC')).toBe('heic');
    expect(imageExtension('file:///tmp/photo.jpeg?token=1')).toBe('jpeg');
    expect(imageExtension('file:///tmp/photo.png')).toBe('png');
    expect(imageExtension('file:///tmp/photo.webp')).toBe('webp');
    expect(imageExtension('file:///tmp/photo.jpg')).toBe('jpg');
    expect(imageExtension('file:///tmp/photo.svg')).toBe('jpg');
    expect(imageExtension('file:///tmp/photo.jpg.svg')).toBe('jpg');
    expect(imageExtension('file:///tmp/no-extension')).toBe('jpg');
  });

  it('оставляет аудио из белого списка и заменяет остальное на m4a', () => {
    expect(audioExtension('file:///tmp/call.MP3')).toBe('mp3');
    expect(audioExtension('file:///tmp/call.aac')).toBe('aac');
    expect(audioExtension('file:///tmp/call.m4a?x=1')).toBe('m4a');
    expect(audioExtension('file:///tmp/call.wav')).toBe('m4a');
    expect(audioExtension('file:///tmp/call')).toBe('m4a');
  });

  it('оставляет видео mp4 и mov', () => {
    expect(videoExtension('file:///tmp/clip.MOV')).toBe('mov');
    expect(videoExtension('file:///tmp/clip.mp4')).toBe('mp4');
    expect(videoExtension('file:///tmp/clip.webm')).toBe('mp4');
  });
});
