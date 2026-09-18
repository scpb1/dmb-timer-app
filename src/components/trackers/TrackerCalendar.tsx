import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  addMonths,
  format,
  isSameMonth,
  isToday,
  startOfDay,
  subMonths,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { Feather } from '@expo/vector-icons';

import { isDateSelectable } from '@/utils/trackerCalculations';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

const WEEKDAY_HEADERS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const DAY_SIZE = 36;

interface TrackerCalendarProps {
  markedDates: Set<string>;
  selectedDate?: string | null;
  onDayPress: (date: Date) => void;
  allowFutureDays?: boolean;
}

function buildMonthGrid(monthDate: Date): Array<Date | null> {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;

  const cells: Array<Date | null> = [];

  for (let index = 0; index < startOffset; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function chunkRows(cells: Array<Date | null>): Array<Array<Date | null>> {
  const rows: Array<Array<Date | null>> = [];
  for (let index = 0; index < cells.length; index += 7) {
    rows.push(cells.slice(index, index + 7));
  }
  return rows;
}

export function TrackerCalendar({
  markedDates,
  selectedDate,
  onDayPress,
  allowFutureDays = false,
}: TrackerCalendarProps) {
  const [visibleMonth, setVisibleMonth] = useState(() => startOfDay(new Date()));
  const rows = useMemo(() => chunkRows(buildMonthGrid(visibleMonth)), [visibleMonth]);

  const monthLabel = format(visibleMonth, 'LLLL yyyy', { locale: ru });
  const capitalizedMonthLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.navButton}
          onPress={() => setVisibleMonth((current) => subMonths(current, 1))}
          hitSlop={8}
          accessibilityLabel="Предыдущий месяц"
        >
          <Feather name="chevron-left" size={22} color={colors.light.text.primary} />
        </Pressable>

        <Text style={styles.monthLabel}>{capitalizedMonthLabel}</Text>

        <Pressable
          style={styles.navButton}
          onPress={() => setVisibleMonth((current) => addMonths(current, 1))}
          hitSlop={8}
          accessibilityLabel="Следующий месяц"
        >
          <Feather name="chevron-right" size={22} color={colors.light.text.primary} />
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_HEADERS.map((label) => (
          <View key={label} style={styles.weekdayCell}>
            <Text style={styles.weekdayLabel}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {rows.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.weekRow}>
            {row.map((date, cellIndex) => {
              if (!date) {
                return <View key={`empty-${rowIndex}-${cellIndex}`} style={styles.dayCell} />;
              }

              const dateKey = format(date, 'yyyy-MM-dd');
              const selectable = isDateSelectable(date, allowFutureDays);
              const marked = markedDates.has(dateKey);
              const selected = selectedDate === dateKey;
              const today = isToday(date);
              const inCurrentMonth = isSameMonth(date, visibleMonth);

              return (
                <Pressable
                  key={dateKey}
                  style={styles.dayCell}
                  disabled={!selectable}
                  onPress={() => onDayPress(date)}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !selectable, selected }}
                >
                  <View
                    style={[
                      styles.dayCircle,
                      marked && selectable && styles.dayCircleMarked,
                      selected && styles.dayCircleSelected,
                      today && !selected && styles.dayCircleToday,
                      !selectable && styles.dayCircleDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        !inCurrentMonth && styles.dayTextMuted,
                        marked && selectable && styles.dayTextMarked,
                        selected && styles.dayTextSelected,
                        !selectable && styles.dayTextDisabled,
                        today && !selected && styles.dayTextToday,
                      ]}
                    >
                      {format(date, 'd')}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.25)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 16,
    color: colors.light.text.primary,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayLabel: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 12,
    color: colors.light.text.secondary,
  },
  grid: {
    gap: 4,
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: DAY_SIZE + 8,
  },
  dayCircle: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    borderRadius: DAY_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleMarked: {
    backgroundColor: 'rgba(229, 57, 53, 0.22)',
  },
  dayCircleSelected: {
    backgroundColor: colors.light.text.primary,
  },
  dayCircleToday: {
    borderWidth: 1,
    borderColor: colors.light.text.accent,
  },
  dayCircleDisabled: {
    opacity: 0.35,
  },
  dayText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    color: colors.light.text.primary,
  },
  dayTextMuted: {
    color: colors.light.text.secondary,
  },
  dayTextMarked: {
    fontFamily: typography.fontFamily.sansBold,
    color: colors.light.text.accent,
  },
  dayTextSelected: {
    fontFamily: typography.fontFamily.sansBold,
    color: colors.light.background.start,
  },
  dayTextDisabled: {
    color: colors.light.text.secondary,
  },
  dayTextToday: {
    fontFamily: typography.fontFamily.sansBold,
  },
});
