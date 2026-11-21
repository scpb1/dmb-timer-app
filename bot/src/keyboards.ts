import { InlineKeyboard, Keyboard } from 'grammy';

import { channelUrl } from './config';
import { BTN } from './texts';

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
    .text('👍🏻 Зашло', 'fb:liked')
    .text('👎🏻 Бесит', 'fb:annoys')
    .row()
    .text('🐞 Баг', 'fb:bug')
    .text('💡 Идея', 'fb:idea');
}

export function digestModeKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('Каждый день', 'digest:daily')
    .text('Раз в неделю', 'digest:weekly')
    .row()
    .text('Раз в месяц', 'digest:monthly')
    .text('Никогда', 'digest:never')
    .row()
    .text('Свой промежуток', 'digest:custom');
}

type ListHourKind = 'digest_hour' | 'events_hour';

const LIST_HOUR_PRESETS = [9, 10, 12, 13, 18, 20] as const;

export function listHourKeyboard(kind: ListHourKind): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  for (let index = 0; index < LIST_HOUR_PRESETS.length; index += 1) {
    const hour = LIST_HOUR_PRESETS[index];
    const label = `${String(hour).padStart(2, '0')}:00`;
    if (index > 0 && index % 3 === 0) {
      keyboard.row();
    }
    keyboard.text(label, `${kind}:${hour}`);
  }
  return keyboard;
}

export function listsSettingsKeyboard(): InlineKeyboard {
  const keyboard = digestModeKeyboard();
  keyboard
    .row()
    .text('Час сводки дембелей', 'lists_settings:dmb_hour')
    .text('Час событий', 'lists_settings:events_hour');
  return keyboard;
}

export function eventsKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text(BTN.addEvent, 'event:add')
    .row()
    .text(BTN.otherEvents, 'event:catalog')
    .row()
    .text(BTN.deleteEvent, 'event:delete');
}

export function eventBackKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text(BTN.back, 'event:back');
}

export function eventCatalogKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text(BTN.addAllEvents, 'event:add_all').row().text(BTN.back, 'event:back');
}

export function unknownEventKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text(BTN.addEvent, 'event:add').row().text(BTN.back, 'event:back');
}

export function settingsKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text(BTN.addNames, 'settings:names')
    .row()
    .text(BTN.changeDates, 'settings:dates')
    .row()
    .text(BTN.deleteAllData, 'settings:delete_data');
}

export function settingsDeleteConfirmKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text(BTN.deleteAllDataConfirm, 'settings:delete_confirm')
    .row()
    .text(BTN.cancel, 'settings:back');
}

export function settingsBackKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text(BTN.back, 'settings:back');
}
