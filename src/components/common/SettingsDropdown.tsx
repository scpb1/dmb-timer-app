import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useAppTheme } from '@/theme';
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
  const theme = useAppTheme();
  const selected = options.find((option) => option.value === value);

  const handleSelect = (next: T) => {
    onChange(next);
    setIsOpen(false);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.text.secondary }]}>{label}</Text>
      <Pressable
        style={[
          styles.trigger,
          {
            backgroundColor: theme.overlay.fill,
            borderColor: theme.overlay.border,
          },
          isOpen && { borderColor: theme.text.accent },
        ]}
        onPress={() => setIsOpen((prev) => !prev)}
      >
        <Text style={[styles.triggerText, { color: theme.text.primary }]}>
          {selected?.label ?? '—'}
        </Text>
        <Feather
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={theme.text.secondary}
        />
      </Pressable>

      {isOpen ? (
        <View
          style={[
            styles.menu,
            { borderColor: theme.overlay.border, backgroundColor: theme.overlay.fill },
          ]}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <Pressable
                key={String(option.value)}
                style={[styles.menuItem, isSelected && styles.menuItemSelected]}
                onPress={() => handleSelect(option.value)}
              >
                <Text
                  style={[
                    styles.menuItemText,
                    { color: theme.text.primary },
                    isSelected && { color: theme.text.accent },
                  ]}
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
    marginBottom: 8,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 4,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
  },
  triggerText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 17,
  },
  menu: {
    marginTop: 4,
    borderRadius: 4,
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
  },
});
