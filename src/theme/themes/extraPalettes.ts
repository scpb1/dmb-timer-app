import { buildPaletteColorTokens } from '@/theme/buildFourColorTheme';
import { defineTheme, type ColorThemeId } from '@/theme/tokens';

type PaletteRow = {
  id: ColorThemeId;
  name: string;
  stripes: string[];
};

/** Палитры с макета: hex сверху вниз (4 или 5 полос). */
const EXTRA_PALETTE_ROWS: PaletteRow[] = [
  { id: 'orchid', name: 'Орхидея', stripes: ['#4D3A4D', '#BE5CA9', '#D59CC5', '#EADADA'] },
  { id: 'ruby', name: 'Рубин', stripes: ['#2B2024', '#A80139', '#FD0053', '#FFFFFF'] },
  { id: 'sprite', name: 'Спрайт', stripes: ['#7A56D0', '#4FC0E8', '#5BE7C4', '#F6F7FB'] },
  { id: 'ciel', name: 'Циан', stripes: ['#DAEAF7', '#0C8ABC', '#124E96', '#FF008E'] },
  { id: 'sprout', name: 'Росток', stripes: ['#FFF5F4', '#B1D430', '#1A8B9D', '#000000'] },
  { id: 'flint', name: 'Кремень', stripes: ['#1A273A', '#3E4A62', '#C24D2C', '#D9D9D7'] },
  { id: 'pasture', name: 'Луг', stripes: ['#FAFFA3', '#C6E772', '#66D47E', '#073835'] },
  { id: 'nectar', name: 'Нектар', stripes: ['#FFEED0', '#F4C180', '#00A79D', '#007064'] },
  { id: 'violetMist', name: 'Ирис', stripes: ['#9765C8', '#099A97', '#15CDA9', '#F0E4E4'] },
  { id: 'caramel', name: 'Карамель', stripes: ['#E2DED3', '#857671', '#4E413B', '#FF6D24'] },
  { id: 'pool', name: 'Бассейн', stripes: ['#4A89AC', '#ACE5F6', '#E3FCF9', '#FAEE5A'] },
  { id: 'tropical', name: 'Тропик', stripes: ['#ED743F', '#FFAF50', '#423465', '#824C97'] },
  { id: 'lichen', name: 'Лишайник', stripes: ['#3F3F3F', '#437A5B', '#B4CD93', '#FBF5B7'] },
  {
    id: 'trema',
    name: 'Трема',
    stripes: ['#F6FFFA', '#E6E6DB', '#A0BBB2', '#DA7D91', '#8B4C41'],
  },
  {
    id: 'dustRose',
    name: 'Пыльная роза',
    stripes: ['#FFDBDA', '#DB7F8E', '#D5C5C8', '#9DA3A4', '#604D53'],
  },
  {
    id: 'hanami',
    name: 'Ханами',
    stripes: ['#443025', '#7F5836', '#AA7F66', '#EC9C9D', '#F2CFCF'],
  },
  {
    id: 'amalfi',
    name: 'Амальфи',
    stripes: ['#933B5B', '#B5728A', '#AABAAE', '#E3D6BF', '#9F9679'],
  },
];

export const EXTRA_PALETTE_THEMES = EXTRA_PALETTE_ROWS.map((row) => {
  const built = buildPaletteColorTokens(...row.stripes);
  return defineTheme({
    id: row.id,
    name: row.name,
    scheme: built.scheme,
    colors: built.colors,
  });
});
