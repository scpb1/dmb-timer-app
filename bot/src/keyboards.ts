import { InlineKeyboard, Keyboard } from 'grammy';

import { channelUrl } from './config';
import { BTN } from './texts';
import type { CustomHolidayRecord } from './holidays';

export function subscribeKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .url(BTN.subscribe, channelUrl)
    .row()
    .text(BTN.checkSub, 'check_sub');
}

export function mainKeyboard(): Keyboard {
  return new Keyboard()
    .text(BTN.term)
    .text(BTN.holidays)
    .row()
    .text(BTN.author)
    .text(BTN.dates)
    .resized()
    .persistent();
}

export function cancelKeyboard(): Keyboard {
  return new Keyboard().text(BTN.cancel).resized().oneTime();
}

export function demobilizationKeyboard(): Keyboard {
  return new Keyboard()
    .text(BTN.days365)
    .text(BTN.days547)
    .row()
    .text(BTN.cancel)
    .resized()
    .oneTime();
}

export function feedbackKindKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('Хочу задать вопрос', 'fb:question')
    .row()
    .text('У меня есть идея', 'fb:idea')
    .row()
    .text('Нашла ошибку', 'fb:bug');
}

export function holidaysKeyboard(customHolidays: CustomHolidayRecord[]): InlineKeyboard {
  const keyboard = new InlineKeyboard().text(BTN.addHoliday, 'holiday:add');
  for (const holiday of customHolidays.slice(0, 8)) {
    const label = holiday.name.length > 28 ? `${holiday.name.slice(0, 27)}…` : holiday.name;
    keyboard.row().text(`Удалить: ${label}`, `holiday:del:${holiday.id}`);
  }
  return keyboard;
}
