import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FORM_FIELD_HEIGHT } from '@/components/events/formFieldStyles';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';
import type { CardHighlightMode } from '@/types/events';
import { CARD_HIGHLIGHT_MODE_OPTIONS } from '@/utils/cardHighlight';

interface CardHighlightModePickerProps {
  value: CardHighlightMode;
  onChange: (value: CardHighlightMode) => void;
}

export function CardHighlightModePicker({ value, onChange }: CardHighlightModePickerProps) {
  const theme = useAppTheme();

  return (
    <>
      <Text style={[styles.fieldLabel, { color: theme.text.primary }]}>Оформление</Text>
      <View style={styles.row}>
        {CARD_HIGHLIGHT_MODE_OPTIONS.map((option) => {
          const isActive = value === option.value;
          return (
            <Pressable
              key={option.value}
              style={[
                styles.button,
                {
                  borderColor: theme.overlay.border,
                  backgroundColor: theme.overlay.fill,
                },
                isActive && {
                  borderColor: theme.text.primary,
                  backgroundColor: theme.overlay.muted,
                },
              ]}
              onPress={() => onChange(option.value)}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: theme.text.secondary },
                  isActive && { color: theme.text.primary, fontWeight: '600' },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    height: FORM_FIELD_HEIGHT,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 15,
  },
});
