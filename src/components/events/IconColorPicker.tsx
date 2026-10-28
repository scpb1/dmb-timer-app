import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { ColorWheelPicker } from '@/components/diary/ColorWheelPicker';
import { FORM_FIELD_HEIGHT } from '@/components/events/formFieldStyles';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';
import { normalizeHex } from '@/utils/color';

interface IconColorPickerProps {
  value?: string;
  onChange: (color: string | undefined) => void;
  /** Подпись и превью для заливки плашки (призыв / дембель). */
  fillMode?: boolean;
  label?: string;
  /** Цвет образца, если своего value нет (пресет строки или цвет иконки по умолчанию). */
  swatchFallbackColor?: string;
  /** Показать сброс, когда активен пресет без сохранённого value. */
  showReset?: boolean;
}

export function IconColorPicker({
  value,
  onChange,
  fillMode = false,
  label,
  swatchFallbackColor,
  showReset = false,
}: IconColorPickerProps) {
  const theme = useAppTheme();
  const [wheelOpen, setWheelOpen] = useState(false);
  const [hexDraft, setHexDraft] = useState('');
  const displayHex = value ?? swatchFallbackColor ?? theme.text.primary;

  const openWheel = () => {
    setHexDraft(value?.replace(/^#/, '') ?? '');
    setWheelOpen(true);
  };

  const commitHexInput = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      onChange(undefined);
      return;
    }
    const normalized = normalizeHex(trimmed.startsWith('#') ? trimmed : `#${trimmed}`);
    if (normalized) {
      onChange(normalized);
      setHexDraft(normalized.replace(/^#/, ''));
    }
  };

  const resetColor = () => {
    onChange(undefined);
    setHexDraft('');
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.text.primary }]}>
        {label ?? (fillMode ? 'Цвет заливки' : 'Цвет иконки')}
      </Text>
      <View style={styles.row}>
        <Pressable
          style={[styles.swatch, { borderColor: theme.overlay.border, backgroundColor: displayHex }]}
          onPress={openWheel}
          accessibilityRole="button"
          accessibilityLabel="Открыть выбор цвета"
        />
        <TextInput
          value={hexDraft || (value ? value.replace(/^#/, '') : '')}
          onChangeText={(text) => {
            const cleaned = text.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
            setHexDraft(cleaned);
            if (cleaned.length === 6) {
              commitHexInput(cleaned);
            }
          }}
          onBlur={() => {
            if (hexDraft.length === 6) {
              commitHexInput(hexDraft);
            }
          }}
          placeholder="RRGGBB"
          placeholderTextColor={theme.input.placeholder}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={6}
          style={[
            styles.hexInput,
            {
              color: theme.text.primary,
              borderColor: theme.overlay.border,
              backgroundColor: theme.overlay.fill,
            },
          ]}
        />
        {value || showReset ? (
          <Pressable
            onPress={resetColor}
            style={[
              styles.resetButton,
              {
                borderColor: theme.overlay.border,
                backgroundColor: theme.overlay.fill,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Сбросить цвет"
          >
            <Feather name="x" size={18} color={theme.text.secondary} />
          </Pressable>
        ) : null}
      </View>

      <ColorWheelPicker
        visible={wheelOpen}
        color={displayHex}
        onClose={() => setWheelOpen(false)}
        onChange={(hex) => {
          onChange(hex);
          setHexDraft(hex.replace(/^#/, ''));
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  swatch: {
    width: FORM_FIELD_HEIGHT,
    height: FORM_FIELD_HEIGHT,
    borderRadius: 4,
    borderWidth: 1,
  },
  hexInput: {
    flex: 1,
    height: FORM_FIELD_HEIGHT,
    fontFamily: typography.fontFamily.sans,
    fontSize: 15,
    letterSpacing: 1,
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 0,
    paddingHorizontal: 12,
    textAlignVertical: 'center',
  },
  resetButton: {
    width: FORM_FIELD_HEIGHT,
    height: FORM_FIELD_HEIGHT,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
