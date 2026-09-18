import { formatCount } from '@/utils/inflection';

export function formatDuration(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${formatCount(hours, 'hour')} ${formatCount(minutes, 'minute')}`;
  }

  if (hours > 0) {
    return formatCount(hours, 'hour');
  }

  if (minutes > 0) {
    return formatCount(minutes, 'minute');
  }

  return formatCount(0, 'minute');
}

export function formatDurationShort(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return minutes > 0 ? `${hours} ч ${minutes} мин` : `${hours} ч`;
  }

  if (minutes > 0) {
    return `${minutes} мин`;
  }

  const secs = seconds % 60;
  return `${secs} сек`;
}

export function formatCallDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (minutes > 0 && secs > 0) {
    return `${minutes} мин ${secs} сек`;
  }

  if (minutes > 0) {
    return `${minutes} мин`;
  }

  return `${secs} сек`;
}

export function formatMeetingDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours} ч ${minutes} мин`;
  }

  if (hours > 0) {
    return `${hours} ч`;
  }

  return `${minutes} мин`;
}

export function clampDurationPart(value: number, max: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }
  return Math.min(Math.floor(value), max);
}

export function parseDurationPart(text: string, max: number): number {
  const parsed = Number(text.replace(/\D/g, ''));
  return clampDurationPart(Number.isFinite(parsed) ? parsed : 0, max);
}
