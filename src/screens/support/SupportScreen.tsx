import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/common/ScreenHeader';
import { SupportCardTile } from '@/components/support/SupportCardTile';
import { SupportFilter } from '@/components/support/SupportFilter';
import { SupportFlipCard } from '@/components/support/SupportFlipCard';
import { SUPPORT_CARDS } from '@/data/supportCards';
import type { SupportCard, SupportCardFilter } from '@/types/support';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';
import { filterSupportCards, getSupportCardById } from '@/utils/supportCards';

export function SupportScreen() {
  const theme = useAppTheme();
  const [filter, setFilter] = useState<SupportCardFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const cards = useMemo(() => filterSupportCards(SUPPORT_CARDS, filter), [filter]);
  const selected = selectedId ? (getSupportCardById(selectedId) ?? null) : null;

  const renderItem = ({ item, index }: { item: SupportCard; index: number }) => {
    const isLeft = index % 2 === 0;
    return (
      <View style={[styles.tileWrap, isLeft ? styles.tileLeft : styles.tileRight]}>
        <SupportCardTile card={item} onPress={() => setSelectedId(item.id)} />
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <ScreenHeader title="Опора" />
          <Text style={[styles.lead, { color: theme.text.secondary }]}>
            Выбери, что сейчас ближе. Сначала коротко, с оборота – что с этим делать.
          </Text>
          <View style={styles.filter}>
            <SupportFilter value={filter} onChange={setFilter} />
          </View>
        </View>

        <FlatList
          data={cards}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>

      <SupportFlipCard
        card={selected}
        visible={selected !== null}
        onClose={() => setSelectedId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingBottom: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 10,
  },
  lead: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    lineHeight: 20,
  },
  filter: {
    marginTop: 4,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 96,
  },
  tileWrap: {
    width: '50%',
    paddingBottom: 10,
  },
  tileLeft: {
    paddingRight: 5,
  },
  tileRight: {
    paddingLeft: 5,
  },
});
