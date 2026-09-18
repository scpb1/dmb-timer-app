import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { ColorWheelPicker } from '@/components/diary/ColorWheelPicker';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import type { DiaryTextStyle } from '@/types/diary';
import { DIARY_FONT_SIZES } from '@/types/diary';

interface DiaryToolbarProps {
  style: DiaryTextStyle;
  onChange: (patch: Partial<DiaryTextStyle>) => void;
}

/** Панель форматирования общего редактора дневника */
export function DiaryToolbar({ style, onChange }: DiaryToolbarProps) {
  const [colorVisible, setColorVisible] = useState(false);
  const [sizeMenuOpen, setSizeMenuOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable
          style={[styles.iconButton, style.bold && styles.iconButtonActive]}
          onPress={() => onChange({ bold: !style.bold })}
          accessibilityRole="button"
          accessibilityLabel="Жирный"
        >
          <Text style={[styles.formatGlyph, style.bold && styles.formatGlyphActive]}>B</Text>
        </Pressable>
        <Pressable
          style={[styles.iconButton, style.italic && styles.iconButtonActive]}
          onPress={() => onChange({ italic: !style.italic })}
          accessibilityRole="button"
          accessibilityLabel="Курсив"
        >
          <Text style={[styles.formatGlyph, styles.italicGlyph, style.italic && styles.formatGlyphActive]}>
            I
          </Text>
        </Pressable>
        <Pressable
          style={[styles.iconButton, style.underline && styles.iconButtonActive]}
          onPress={() => onChange({ underline: !style.underline })}
          accessibilityRole="button"
          accessibilityLabel="Подчёркнутый"
        >
          <Text style={[styles.formatGlyph, styles.underlineGlyph, style.underline && styles.formatGlyphActive]}>
            U
          </Text>
        </Pressable>

        <View style={styles.divider} />

        <View style={styles.sizeWrap}>
          <Pressable
            style={[styles.sizeTrigger, sizeMenuOpen && styles.sizeTriggerOpen]}
            onPress={() => setSizeMenuOpen((open) => !open)}
            accessibilityRole="button"
            accessibilityLabel="Размер шрифта"
          >
            <Text style={styles.sizeValue}>{style.fontSize}</Text>
            <Feather
              name={sizeMenuOpen ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={colors.light.text.secondary}
            />
          </Pressable>

          {sizeMenuOpen ? (
            <View style={styles.sizeMenu}>
              {DIARY_FONT_SIZES.map((size) => {
                const selected = size === style.fontSize;
                return (
                  <Pressable
                    key={size}
                    style={[styles.sizeMenuItem, selected && styles.sizeMenuItemSelected]}
                    onPress={() => {
                      onChange({ fontSize: size });
                      setSizeMenuOpen(false);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Размер ${size}`}
                  >
                    <Text style={[styles.sizeMenuText, selected && styles.sizeMenuTextSelected]}>
                      {size}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>

        <View style={styles.divider} />

        <Pressable
          style={styles.colorButton}
          onPress={() => setColorVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Цвет текста"
        >
          <View style={[styles.colorSwatch, { backgroundColor: style.color }]} />
        </Pressable>
      </View>

      <ColorWheelPicker
        visible={colorVisible}
        color={style.color}
        onChange={(hex) => onChange({ color: hex })}
        onClose={() => setColorVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    zIndex: 4,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.28)',
    paddingHorizontal: 6,
    paddingVertical: 6,
    gap: 4,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonActive: {
    backgroundColor: 'rgba(62, 54, 48, 0.12)',
  },
  formatGlyph: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 16,
    color: colors.light.text.primary,
  },
  formatGlyphActive: {
    color: colors.light.text.accent,
  },
  italicGlyph: {
    fontStyle: 'italic',
    fontFamily: typography.fontFamily.sans,
  },
  underlineGlyph: {
    textDecorationLine: 'underline',
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(167, 154, 138, 0.4)',
    marginHorizontal: 2,
  },
  sizeWrap: {
    position: 'relative',
    zIndex: 5,
  },
  sizeTrigger: {
    minWidth: 52,
    height: 32,
    paddingHorizontal: 8,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  sizeTriggerOpen: {
    backgroundColor: 'rgba(62, 54, 48, 0.08)',
  },
  sizeValue: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 13,
    color: colors.light.text.primary,
  },
  sizeMenu: {
    position: 'absolute',
    top: 36,
    left: 0,
    minWidth: 72,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.28)',
    backgroundColor: '#FFFDF6',
    elevation: 8,
    shadowColor: '#3E3630',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  sizeMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  sizeMenuItemSelected: {
    backgroundColor: 'rgba(62, 54, 48, 0.08)',
  },
  sizeMenuText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    color: colors.light.text.primary,
  },
  sizeMenuTextSelected: {
    fontFamily: typography.fontFamily.sansBold,
    color: colors.light.text.accent,
  },
  colorButton: {
    marginLeft: 'auto',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatch: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
});
