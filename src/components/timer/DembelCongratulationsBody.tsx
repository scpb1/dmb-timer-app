import { StyleSheet, Text, View } from 'react-native';

import { pluralize } from '@/utils/inflection';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';

interface DembelCongratulationsBodyProps {
  userName: string;
  timerVisitCount: number;
}

function userNameClause(userName: string): string {
  const trimmed = userName.trim();
  if (!trimmed) {
    return 'и тебя с тем';
  }
  return `и тебя, ${trimmed}, с тем`;
}

export function DembelCongratulationsBody({
  userName,
  timerVisitCount,
}: DembelCongratulationsBodyProps) {
  const theme = useAppTheme();
  const visitWord = pluralize(timerVisitCount, 'раз', 'раза', 'раз');
  const primaryText = { color: theme.text.primary };
  const secondaryText = { color: theme.text.secondary };

  return (
    <View style={styles.root}>
      <Text style={[styles.paragraph, primaryText]}>
        Поздравляем твоего любимого с завершением службы, {userNameClause(userName)}, что ты
        дожила до этого дня. На таймере заветные 0 ддд. Камуфляжная полоса в вашей жизни
        закончилась. Наступила белая, и впереди только{' '}
        <Text style={styles.emphasis}>счастливое совместное будущее</Text>.
      </Text>

      <Text style={[styles.paragraph, primaryText]}>
        Ты больше не услышишь «после отбоя напишу», «я в наряде», «у меня две минуты».
      </Text>

      <Text style={[styles.paragraph, primaryText]}>
        Тебя теперь ждут слова «я заберу тебя в шесть», «что купить домой?», «буду дома
        пораньше, соскучился».
      </Text>

      <Text style={[styles.paragraph, primaryText]}>
        Ты тоже прошла службу: не в строю, зато здесь – в таймере, в дневнике, в ожидании. Ты
        была для своего солдата <Text style={styles.emphasis}>надёжным тылом</Text>. Он вырос,
        стал мужественнее и теперь готов защищать тебя и превратить твою жизнь в сказку.
      </Text>

      <Text style={[styles.paragraph, primaryText]}>
        Это не только его дембель. Это <Text style={styles.emphasis}>ваш</Text> дембель. Ты это
        заслужила. Твой подарок – ваша скорая встреча. Ещё чуть-чуть и ты обнимешь его так
        крепко, чтобы он понял:{' '}
        <Text style={styles.emphasis}>ты его больше никуда не отпустишь</Text>.
      </Text>

      <Text style={[styles.cheers, primaryText]}>Поздравляем!</Text>

      <Text style={[styles.visitLine, secondaryText]}>
        За время ожидания ты заходила в таймер {timerVisitCount} {visitWord}.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 16,
  },
  paragraph: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 15,
    lineHeight: 22,
  },
  emphasis: {
    fontFamily: typography.fontFamily.sansBold,
  },
  cheers: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 22,
    lineHeight: 28,
    textAlign: 'center',
    marginTop: 8,
  },
  visitLine: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
