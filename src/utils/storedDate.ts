import { isValid, parseISO } from 'date-fns';

/** ISO из config или дневника. Битая строка — как незаполненная дата. */
export function parseStoredDate(raw: string | null | undefined): Date | null {
  if (!raw) {
    return null;
  }

  const parsed = parseISO(raw);
  return isValid(parsed) ? parsed : null;
}
