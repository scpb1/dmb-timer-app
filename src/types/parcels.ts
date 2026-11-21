export const PARCEL_KINDS = ['parcel', 'handover'] as const;
export type ParcelKind = (typeof PARCEL_KINDS)[number];

export const PARCEL_STATUSES = ['packing', 'sent', 'received'] as const;
export type ParcelStatus = (typeof PARCEL_STATUSES)[number];

export const PARCEL_REMINDER_INTERVALS = [14, 21, 30, 45] as const;
export type ParcelReminderInterval = (typeof PARCEL_REMINDER_INTERVALS)[number];

export const PARCEL_TITLE_MAX_LENGTH = 60;
export const PARCEL_CONTENTS_MAX_LENGTH = 200;
export const PARCEL_NOTE_MAX_LENGTH = 400;
export const PARCEL_REMINDER_HOUR = 10;

export interface ParcelEntry {
  id: string;
  kind: ParcelKind;
  status: ParcelStatus;
  title?: string;
  contents: string;
  packingDate: string;
  sentDate?: string;
  receivedDate?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParcelSettings {
  reminderEnabled: boolean;
  reminderIntervalDays: ParcelReminderInterval;
}

export interface ParcelsStorage {
  entries: ParcelEntry[];
  settings: ParcelSettings;
}

export interface ParcelFormData {
  kind: ParcelKind;
  status: ParcelStatus;
  title: string;
  contents: string;
  packingDate: Date | null;
  sentDate: Date | null;
  receivedDate: Date | null;
  note: string;
}

export type ParcelKindFilter = 'all' | ParcelKind;
export type ParcelStatusFilter = 'all' | ParcelStatus;

export const DEFAULT_PARCEL_SETTINGS: ParcelSettings = {
  reminderEnabled: true,
  reminderIntervalDays: 21,
};

export const DEFAULT_PARCELS_STORAGE: ParcelsStorage = {
  entries: [],
  settings: { ...DEFAULT_PARCEL_SETTINGS },
};

export function isParcelKind(value: unknown): value is ParcelKind {
  return value === 'parcel' || value === 'handover';
}

export function isParcelStatus(value: unknown): value is ParcelStatus {
  return value === 'packing' || value === 'sent' || value === 'received';
}

export function isParcelReminderInterval(value: unknown): value is ParcelReminderInterval {
  return PARCEL_REMINDER_INTERVALS.some((interval) => interval === value);
}
