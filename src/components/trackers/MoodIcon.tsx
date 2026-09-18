import type { ComponentProps } from 'react';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { getMoodMeta, type TrackerMood } from '@/types/trackers';

type FeatherIconName = ComponentProps<typeof Feather>['name'];
type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

interface MoodIconProps {
  moodId: TrackerMood;
  size?: number;
}

export function MoodIcon({ moodId, size = 16 }: MoodIconProps) {
  const meta = getMoodMeta(moodId);
  if (!meta) {
    return null;
  }

  if (meta.iconSet === 'material') {
    return (
      <MaterialCommunityIcons
        name={meta.icon as MaterialIconName}
        size={size}
        color={meta.color}
      />
    );
  }

  return <Feather name={meta.icon as FeatherIconName} size={size} color={meta.color} />;
}
