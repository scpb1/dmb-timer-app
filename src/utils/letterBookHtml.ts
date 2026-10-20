import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

import { APP_NAME } from '@/constants';
import type { DiaryDocument, DiaryTextSpan } from '@/types/diary';
import { DEFAULT_DIARY_TEXT_COLOR, DEFAULT_DIARY_TEXT_STYLE } from '@/types/diary';
import type { LetterBookVariantId } from '@/types/letterBook';
import { getLetterBookVariant } from '@/types/letterBook';
import type { ServiceSummary } from '@/utils/serviceSummary';
import { serviceSummaryHeroCaption } from '@/utils/serviceSummary';
import type { TrackerStatItem } from '@/utils/trackerCalculations';

export interface LetterBookLetter {
  date: string;
  dateLabel: string;
  weekdayLabel: string;
  monthKey: string;
  monthLabel: string;
  themeTitle: string;
  document: DiaryDocument;
}

export interface LetterBookPayload {
  userName: string;
  partnerName: string;
  summary: ServiceSummary | null;
  letters: LetterBookLetter[];
  images: Record<string, string>;
  includePhotos: boolean;
}

/** Ширина фото в книге: достаточно крупно, не на всю полосу */
export const LETTER_BOOK_PHOTO_WIDTH_PERCENT = 68;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function capitalize(value: string): string {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatLetterDate(dateKey: string): {
  dateLabel: string;
  weekdayLabel: string;
  monthKey: string;
  monthLabel: string;
} {
  const date = parseISO(dateKey);
  return {
    dateLabel: format(date, 'd MMMM yyyy', { locale: ru }),
    weekdayLabel: capitalize(format(date, 'EEEE', { locale: ru })),
    monthKey: format(date, 'yyyy-MM'),
    monthLabel: capitalize(format(date, 'LLLL yyyy', { locale: ru })),
  };
}

function spanToHtml(span: DiaryTextSpan): string {
  const style = span.style ?? DEFAULT_DIARY_TEXT_STYLE;
  const fontSize = Number(style.fontSize) > 0 ? Number(style.fontSize) : DEFAULT_DIARY_TEXT_STYLE.fontSize;
  const color = style.color || DEFAULT_DIARY_TEXT_COLOR;
  const css = [
    `color:${escapeHtml(color)}`,
    `font-size:${fontSize}px`,
    `line-height:${Math.round(fontSize * 1.45)}px`,
    `font-weight:${style.bold ? 700 : 400}`,
    'font-style:normal',
    `text-decoration:${style.underline ? 'underline' : 'none'}`,
  ].join(';');
  const text = escapeHtml(span.text).replace(/\n/g, '<br/>');
  return `<span style="${css}">${text}</span>`;
}

function renderLetterBody(
  document: DiaryDocument,
  images: Record<string, string>,
  includePhotos: boolean,
): string {
  const html = document.blocks
    .map((block) => {
      if (block.type === 'image') {
        if (!includePhotos) {
          return '';
        }
        const src = images[block.uri];
        if (!src) {
          return '';
        }
        const ratio = block.aspectRatio > 0 ? block.aspectRatio : 4 / 3;
        return `<figure class="photo"><img src="${src}" alt="" style="aspect-ratio:${ratio};" /></figure>`;
      }

      const spans = block.spans.map(spanToHtml).join('');
      if (!spans.replace(/<[^>]+>/g, '').trim()) {
        return '';
      }
      return `<p class="letter-p">${spans}</p>`;
    })
    .join('');

  return `<div class="letter-body">${html}</div>`;
}

function renderStatCards(items: TrackerStatItem[], extraClass = ''): string {
  return `<div class="stat-grid ${extraClass}">${items
    .map(
      (item) =>
        `<div class="stat-card">
          <div class="stat-label">${escapeHtml(item.label)}</div>
          <div class="stat-value">${escapeHtml(item.value)}</div>
          ${item.subValue ? `<div class="stat-sub">${escapeHtml(item.subValue)}</div>` : ''}
        </div>`,
    )
    .join('')}</div>`;
}

function renderSummarySections(summary: ServiceSummary, headingTag: 'h2' | 'h3' = 'h2'): string {
  return `
    <section class="stats-block">
      <${headingTag}>Служба</${headingTag}>
      ${renderStatCards([
        {
          label: 'Срок службы',
          value: String(summary.totalDays),
          subValue: serviceSummaryHeroCaption(summary.totalDays),
        },
        {
          label: 'Призыв',
          value: summary.enlistmentLabel || '—',
        },
        {
          label: 'Дембель',
          value: summary.demobilizationLabel || '—',
        },
        {
          label: 'Период',
          value: summary.dateRangeLabel || '—',
        },
      ])}
    </section>
    <section class="stats-block">
      <${headingTag}>Звонки</${headingTag}>
      ${renderStatCards(summary.callStats)}
    </section>
    <section class="stats-block">
      <${headingTag}>Встречи</${headingTag}>
      ${renderStatCards(summary.meetingStats)}
    </section>
    <section class="stats-block">
      <${headingTag}>Дневник</${headingTag}>
      ${renderStatCards(summary.diaryStats)}
    </section>
  `;
}

function namesLine(payload: LetterBookPayload): string {
  const from = payload.userName || 'Я';
  const to = payload.partnerName || 'тебе';
  return `${escapeHtml(from)} → ${escapeHtml(to)}`;
}

function colophon(): string {
  return `<p class="colophon">Собрано в приложении «${APP_NAME}»</p>`;
}

function wrapHtml(title: string, css: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>${css}</style>
</head>
<body>${body}</body>
</html>`;
}

function classicCss(): string {
  return `
    @page { size: A5; margin: 16mm 15mm 18mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: Georgia, "Times New Roman", serif;
      color: #3B2A22;
      background: #F7F1E3;
      font-size: 12.5px;
      line-height: 1.55;
    }
    .cover, .contents, .letter, .afterword { page-break-after: always; }
    .afterword { page-break-after: auto; }
    .cover { text-align: center; padding-top: 28mm; }
    .ornament { color: #8B3A3A; letter-spacing: 0.45em; font-size: 11px; margin: 18px 0; }
    .kicker { font-size: 11px; letter-spacing: 0.28em; text-transform: uppercase; color: #8B3A3A; }
    h1 { font-weight: normal; font-size: 34px; margin: 12px 0 8px; }
    .cover-sub { font-style: italic; font-size: 16px; margin: 0 0 24px; }
    .cover-names { font-size: 14px; margin-top: 36px; }
    .cover-dates { font-size: 12px; color: #6B5348; margin-top: 10px; }
    .hero-number { font-size: 54px; line-height: 1; margin: 28px 0 6px; color: #8B3A3A; }
    .contents h2, .afterword h2, .letter h2 { font-weight: normal; font-size: 22px; color: #8B3A3A; }
    .toc { list-style: none; padding: 0; margin: 0; }
    .toc li { display: flex; justify-content: space-between; gap: 12px; padding: 7px 0; border-bottom: 1px dotted #C9B8A4; font-size: 12px; }
    .toc .theme { flex: 1; }
    .toc .date { color: #6B5348; white-space: nowrap; }
    .letter-date { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #8B3A3A; }
    .letter h2 { margin: 6px 0 16px; }
    .letter-p { margin: 0 0 10px; }
    .letter-body { text-align: left; }
    .photo {
      display: block;
      width: ${LETTER_BOOK_PHOTO_WIDTH_PERCENT}%;
      margin: 16px auto;
      text-align: center;
    }
    .photo img { width: 100%; height: auto; display: block; margin: 0 auto; object-fit: cover; }
    .stat-grid { display: flex; flex-wrap: wrap; gap: 8px; margin: 8px 0 18px; }
    .stat-card { width: calc(50% - 4px); border: 1px solid #D8C7B2; padding: 10px 10px 8px; background: rgba(255,255,255,0.35); }
    .stat-label { font-size: 10px; color: #6B5348; letter-spacing: 0.06em; text-transform: uppercase; }
    .stat-value { font-size: 16px; margin-top: 4px; }
    .stat-sub { font-size: 10px; color: #6B5348; margin-top: 2px; }
    .colophon { text-align: center; color: #8A7468; font-size: 10px; margin-top: 28px; }
  `;
}

function journalCss(): string {
  return `
    @page { size: A5; margin: 14mm 13mm 16mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: "Palatino Linotype", Palatino, Georgia, serif;
      color: #2F3A32;
      background: #EFE6D6;
      font-size: 12.5px;
      line-height: 1.5;
    }
    .foreword { page-break-after: always; }
    .month + .month { page-break-before: always; }
    .kicker { font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; color: #4E6A57; }
    h1 { font-size: 30px; font-weight: normal; margin: 8px 0 6px; }
    .foreword-names { font-style: italic; margin-bottom: 8px; }
    .log-hero { display: flex; align-items: baseline; gap: 10px; margin: 18px 0 8px; }
    .log-hero .num { font-size: 58px; line-height: 0.9; color: #3D4A3E; }
    .log-hero .cap { font-size: 13px; color: #5C6E60; }
    .dates { color: #5C6E60; margin-bottom: 18px; }
    .month-title { font-size: 20px; color: #3D4A3E; border-bottom: 2px solid #3D4A3E; padding-bottom: 6px; margin: 0 0 16px; }
    .entry { display: flex; gap: 12px; margin: 0 0 18px; page-break-inside: avoid; border-bottom: 1px solid rgba(61,74,62,0.18); padding-bottom: 14px; }
    .rail { width: 54px; flex-shrink: 0; text-align: center; }
    .rail .day { font-size: 26px; line-height: 1; color: #3D4A3E; }
    .rail .wd { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #6A7C6C; margin-top: 4px; }
    .entry-body { flex: 1; }
    .theme { font-style: italic; font-size: 14px; margin: 0 0 8px; color: #24352A; }
    .letter-p { margin: 0 0 8px; }
    .letter-body { text-align: left; }
    .photo {
      display: block;
      width: ${LETTER_BOOK_PHOTO_WIDTH_PERCENT}%;
      margin: 14px auto;
      text-align: center;
    }
    .photo img { width: 100%; height: auto; display: block; margin: 0 auto; object-fit: cover; }
    .stat-grid { display: flex; flex-wrap: wrap; gap: 8px; margin: 8px 0 16px; }
    .stat-card { width: calc(50% - 4px); background: rgba(255,255,255,0.42); padding: 9px 10px; border-left: 3px solid #4E6A57; }
    .stat-label { font-size: 10px; color: #5C6E60; }
    .stat-value { font-size: 16px; margin-top: 3px; }
    .stat-sub { font-size: 10px; color: #5C6E60; }
    .colophon { text-align: center; color: #6A7C6C; font-size: 10px; margin-top: 24px; }
  `;
}

function albumCss(): string {
  return `
    @page { size: A5; margin: 12mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      color: #F4EFE6;
      background: #1C1916;
      font-size: 12px;
      line-height: 1.45;
    }
    .splash, .stats-page { page-break-after: always; }
    .splash { text-align: center; padding-top: 22mm; }
    .kicker { letter-spacing: 0.34em; text-transform: uppercase; font-size: 10px; color: #E8C9A0; }
    h1 { font-size: 42px; font-weight: 500; margin: 14px 0 8px; letter-spacing: -0.03em; }
    .splash-names { color: #E8C9A0; margin-top: 18px; font-size: 14px; }
    .giant { font-size: 92px; line-height: 0.85; margin: 28px 0 8px; color: #E8C9A0; font-weight: 600; }
    .giant-cap { font-size: 13px; color: rgba(244,239,230,0.72); }
    .dates { margin-top: 22px; color: rgba(244,239,230,0.7); }
    h2 { font-size: 16px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #E8C9A0; margin: 0 0 10px; }
    .stat-grid { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 18px; }
    .stat-card {
      width: calc(50% - 4px);
      background: #25211C;
      border: 1px solid rgba(232,201,160,0.28);
      border-radius: 6px;
      padding: 12px 11px;
    }
    .stat-label { font-size: 10px; color: rgba(244,239,230,0.55); text-transform: uppercase; letter-spacing: 0.06em; }
    .stat-value { font-size: 18px; margin-top: 6px; color: #F4EFE6; }
    .stat-sub { font-size: 10px; color: #E8C9A0; margin-top: 3px; }
    .postcard {
      background: #F7F1E6;
      color: #2B241E;
      border-radius: 8px;
      padding: 16px 16px 14px;
      margin: 0 0 14px;
      page-break-inside: avoid;
    }
    .postcard .meta { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #A07A4C; }
    .postcard h3 { font-size: 16px; margin: 6px 0 10px; font-weight: 600; }
    .letter-p { margin: 0 0 8px; }
    .letter-body { text-align: left; }
    .photo {
      display: block;
      width: ${LETTER_BOOK_PHOTO_WIDTH_PERCENT}%;
      margin: 12px auto;
      text-align: center;
    }
    .photo img {
      width: 100%;
      height: auto;
      display: block;
      margin: 0 auto;
      object-fit: cover;
      border: 6px solid #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    }
    .colophon { text-align: center; color: rgba(244,239,230,0.45); font-size: 10px; margin-top: 18px; }
  `;
}

function buildClassic(payload: LetterBookPayload): string {
  const variant = getLetterBookVariant('classic');
  const summary = payload.summary;
  const cover = `
    <section class="cover">
      <div class="kicker">Дневник девушки солдата</div>
      <div class="ornament">◆ ◆ ◆</div>
      <h1>${escapeHtml(variant.title)}</h1>
      <p class="cover-sub">Письма, которые ждали своего читателя</p>
      ${summary ? `<div class="hero-number">${summary.totalDays}</div><div>${escapeHtml(serviceSummaryHeroCaption(summary.totalDays))}</div>` : ''}
      <div class="cover-names">${namesLine(payload)}</div>
      ${summary?.dateRangeLabel ? `<div class="cover-dates">${escapeHtml(summary.dateRangeLabel)}</div>` : ''}
    </section>
  `;

  const contents = `
    <section class="contents">
      <h2>Содержание</h2>
      <ol class="toc">
        ${payload.letters
          .map(
            (letter) =>
              `<li><span class="theme">${escapeHtml(letter.themeTitle)}</span><span class="date">${escapeHtml(letter.dateLabel)}</span></li>`,
          )
          .join('')}
      </ol>
    </section>
  `;

  const letters = payload.letters
    .map(
      (letter) => `
      <article class="letter">
        <div class="letter-date">${escapeHtml(letter.dateLabel)}</div>
        <h2>${escapeHtml(letter.themeTitle)}</h2>
        ${renderLetterBody(letter.document, payload.images, payload.includePhotos)}
      </article>
    `,
    )
    .join('');

  const afterword = summary
    ? `<section class="afterword">
        <h2>Послесловие. Итоги</h2>
        <p>Те же цифры, что в итогах на дембель: служба, звонки, встречи и дневник.</p>
        ${renderSummarySections(summary)}
        ${colophon()}
      </section>`
    : `<section class="afterword">${colophon()}</section>`;

  return wrapHtml(variant.title, classicCss(), cover + contents + letters + afterword);
}

function groupByMonth(
  letters: LetterBookLetter[],
): Array<{ monthLabel: string; letters: LetterBookLetter[] }> {
  const groups: Array<{ monthKey: string; monthLabel: string; letters: LetterBookLetter[] }> = [];
  for (const letter of letters) {
    const last = groups[groups.length - 1];
    if (last && last.monthKey === letter.monthKey) {
      last.letters.push(letter);
    } else {
      groups.push({
        monthKey: letter.monthKey,
        monthLabel: letter.monthLabel,
        letters: [letter],
      });
    }
  }
  return groups;
}

function buildJournal(payload: LetterBookPayload): string {
  const variant = getLetterBookVariant('journal');
  const summary = payload.summary;
  const foreword = `
    <section class="foreword">
      <div class="kicker">${escapeHtml(variant.subtitle)}</div>
      <h1>${escapeHtml(variant.title)}</h1>
      <p class="foreword-names">${namesLine(payload)}</p>
      ${
        summary
          ? `<div class="log-hero"><div class="num">${summary.totalDays}</div><div class="cap">${escapeHtml(serviceSummaryHeroCaption(summary.totalDays))}</div></div>
             <div class="dates">${escapeHtml(summary.dateRangeLabel)}</div>
             ${renderSummarySections(summary, 'h3')}`
          : ''
      }
    </section>
  `;

  const months = groupByMonth(payload.letters)
    .map(
      (group) => `
      <section class="month">
        <h2 class="month-title">${escapeHtml(group.monthLabel)}</h2>
        ${group.letters
          .map(
            (letter) => `
          <article class="entry">
            <div class="rail">
              <div class="day">${escapeHtml(String(Number(letter.date.slice(8))))}</div>
              <div class="wd">${escapeHtml(letter.weekdayLabel)}</div>
            </div>
            <div class="entry-body">
              <div class="theme">${escapeHtml(letter.themeTitle)}</div>
              ${renderLetterBody(letter.document, payload.images, payload.includePhotos)}
            </div>
          </article>
        `,
          )
          .join('')}
      </section>
    `,
    )
    .join('');

  return wrapHtml(variant.title, journalCss(), foreword + months + colophon());
}

function buildAlbum(payload: LetterBookPayload): string {
  const variant = getLetterBookVariant('album');
  const summary = payload.summary;
  const splash = `
    <section class="splash">
      <div class="kicker">Книга ожидания</div>
      <h1>${escapeHtml(variant.title)}</h1>
      ${
        summary
          ? `<div class="giant">${summary.totalDays}</div><div class="giant-cap">${escapeHtml(serviceSummaryHeroCaption(summary.totalDays))}</div>`
          : ''
      }
      <div class="splash-names">${namesLine(payload)}</div>
      ${summary?.dateRangeLabel ? `<div class="dates">${escapeHtml(summary.dateRangeLabel)}</div>` : ''}
    </section>
  `;

  const statsPage = summary
    ? `<section class="stats-page">
        <h2>Итоги</h2>
        ${renderSummarySections(summary, 'h3')}
      </section>`
    : '';

  const cards = payload.letters
    .map(
      (letter) => `
      <article class="postcard">
        <div class="meta">${escapeHtml(letter.dateLabel)}</div>
        <h3>${escapeHtml(letter.themeTitle)}</h3>
        ${renderLetterBody(letter.document, payload.images, payload.includePhotos)}
      </article>
    `,
    )
    .join('');

  return wrapHtml(variant.title, albumCss(), splash + statsPage + cards + colophon());
}

export function buildLetterBookHtml(
  variantId: LetterBookVariantId,
  payload: LetterBookPayload,
): string {
  if (variantId === 'journal') {
    return buildJournal(payload);
  }
  if (variantId === 'album') {
    return buildAlbum(payload);
  }
  return buildClassic(payload);
}
