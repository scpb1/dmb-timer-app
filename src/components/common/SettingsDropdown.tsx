import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

export interface DropdownOption<T extends string | number> {
  value: T;
  label: string;
}

interface SettingsDropdownProps<T extends string | number> {
  label: string;
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
}

export function SettingsDropdown<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: SettingsDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const theme = colors.light;
  const selected = options.find((option) => option.value === value);

  const handleSelect = (next: T) => {
    onChange(next);
    setIsOpen(false);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={[styles.trigger, isOpen && styles.triggerOpen]}
        onPress={() => setIsOpen((prev) => !prev)}
      >
        <Text style={styles.triggerText}>{selected?.label ?? '—'}</Text>
        <Feather
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={theme.text.secondary}
        />
      </Pressable>

      {isOpen ? (
        <View style={styles.menu}>
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <Pressable
                key={String(option.value)}
                style={[styles.menuItem, isSelected && styles.menuItemSelected]}
                onPress={() => handleSelect(option.value)}
              >
                <Text
                  style={[styles.menuItemText, isSelected && styles.menuItemTextSelected]}
                >
                  {option.label}
                </Text>
                {isSelected ? (
                  <Feather name="check" size={18} color={theme.text.accent} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 20,
  },
  label: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    color: colors.light.text.secondary,
    marginBottom: 8,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.25)',
  },
  triggerOpen: {
    borderColor: colors.light.text.accent,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  triggerText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 17,
    color: colors.light.text.primary,
  },
  menu: {
    marginTop: 4,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.25)',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(167, 154, 138, 0.15)',
  },
  menuItemSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  menuItemText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
    color: colors.light.text.primary,
  },
  menuItemTextSelected: {
    color: colors.light.text.accent,
  },
});
