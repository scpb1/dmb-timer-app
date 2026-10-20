import { useEffect, useMemo, useState } from 'react';
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
import { parseDateKey } from '@/utils/meetingTime';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

const WEEKDAY_HEADERS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const DAY_SIZE = 36;

export type DiaryDayMarks = Record<string, { personal?: boolean; letter?: boolean }>;

interface TrackerCalendarProps {
  entryCounts?: Record<string, number>;
  kindMarks?: DiaryDayMarks;
  selectedDate?: string | null;
  onDayPress: (date: Date) => void;
  onTodayPress?: (date: Date) => void;
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

function entryDotCount(count: number): number {
  if (count <= 0) {
    return 0;
  }
  return count >= 3 ? 3 : count;
}

export function TrackerCalendar({
  entryCounts,
  kindMarks,
  selectedDate,
  onDayPress,
  onTodayPress,
  allowFutureDays = false,
}: TrackerCalendarProps) {
  const [visibleMonth, setVisibleMonth] = useState(() => startOfDay(new Date()));
  const rows = useMemo(() => chunkRows(buildMonthGrid(visibleMonth)), [visibleMonth]);
  const showingCurrentMonth = isSameMonth(visibleMonth, new Date());

  useEffect(() => {
    if (!selectedDate) {
      return;
    }

    const next = startOfDay(parseDateKey(selectedDate));
    setVisibleMonth((current) => (isSameMonth(current, next) ? current : next));
  }, [selectedDate]);

  const goToToday = () => {
    const today = startOfDay(new Date());
    setVisibleMonth(today);
    onTodayPress?.(today);
  };

  const monthLabel = format(visibleMonth, 'LLLL yyyy', { locale: ru });
  const capitalizedMonthLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.navButton}
          onPress={() => setVisibleMonth((current) => subMonths(current, 1))}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Предыдущий месяц"
        >
          <Feather name="chevron-left" size={22} color={colors.light.text.primary} />
        </Pressable>

        <View style={styles.monthBlock}>
          <Text style={styles.monthLabel}>{capitalizedMonthLabel}</Text>
          {showingCurrentMonth ? null : (
            <Pressable
              onPress={goToToday}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Сегодня"
            >
              <Text style={styles.todayButton}>Сегодня</Text>
            </Pressable>
          )}
        </View>

        <Pressable
          style={styles.navButton}
          onPress={() => setVisibleMonth((current) => addMonths(current, 1))}
          hitSlop={8}
          accessibilityRole="button"
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
              const selected = selectedDate === dateKey;
              const today = isToday(date);
              const inCurrentMonth = isSameMonth(date, visibleMonth);
              const kindDots = kindMarks?.[dateKey];
              const trackerDots = entryDotCount(entryCounts?.[dateKey] ?? 0);

              return (
                <Pressable
                  key={dateKey}
                  style={styles.dayCell}
                  disabled={!selectable}
                  onPress={() => onDayPress(date)}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !selectable, selected }}
                  accessibilityLabel={format(date, 'd MMMM', { locale: ru })}
                >
                  <View
                    style={[
                      styles.dayCircle,
                      selected && styles.dayCircleSelected,
                      today && !selected && styles.dayCircleToday,
                      !selectable && styles.dayCircleDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        !inCurrentMonth && styles.dayTextMuted,
                        selected && styles.dayTextSelected,
                        !selectable && styles.dayTextDisabled,
                        today && !selected && styles.dayTextToday,
                      ]}
                    >
                      {format(date, 'd')}
                    </Text>
                  </View>
                  {kindMarks ? (
                    <View style={styles.dotsRow}>
                      <View
                        style={[
                          styles.dot,
                          kindDots?.personal ? styles.dotPersonal : styles.dotHidden,
                        ]}
                      />
                      <View
                        style={[
                          styles.dot,
                          kindDots?.letter ? styles.dotLetter : styles.dotHidden,
                        ]}
                      />
                    </View>
                  ) : (
                    <View style={styles.dotsRow}>
                      {Array.from({ length: trackerDots }, (_, index) => (
                        <View key={index} style={[styles.dot, styles.dotTracker]} />
                      ))}
                    </View>
                  )}
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
    borderRadius: 4,
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
  monthBlock: {
    alignItems: 'center',
    gap: 2,
  },
  monthLabel: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 16,
    color: colors.light.text.primary,
  },
  todayButton: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 13,
    color: colors.light.text.accent,
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
    height: DAY_SIZE + 14,
  },
  dayCircle: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    borderRadius: DAY_SIZE / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    backgroundColor: colors.light.text.primary,
    borderRadius: DAY_SIZE / 2,
  },
  dayCircleToday: {
    borderWidth: 1,
    borderColor: colors.light.text.accent,
    borderRadius: DAY_SIZE / 2,
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
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: 6,
    marginTop: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 4,
  },
  dotPersonal: {
    backgroundColor: colors.light.text.primary,
  },
  dotLetter: {
    backgroundColor: colors.light.text.accent,
  },
  dotTracker: {
    backgroundColor: colors.light.text.accent,
  },
  dotHidden: {
    backgroundColor: 'transparent',
  },
});
