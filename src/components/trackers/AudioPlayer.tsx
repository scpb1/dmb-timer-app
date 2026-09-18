import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Audio } from 'expo-av';
import { Feather } from '@expo/vector-icons';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface AudioPlayerProps {
  uri: string;
  fileName?: string;
}

export function AudioPlayer({ uri, fileName }: AudioPlayerProps) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => () => {
    soundRef.current?.unloadAsync().catch(() => undefined);
  }, []);

  const togglePlayback = async () => {
    try {
      if (isPlaying && soundRef.current) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
        return;
      }

      setIsLoading(true);

      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync({ uri });
        soundRef.current = sound;
        sound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) {
            return;
          }
          setIsPlaying(status.isPlaying);
          if (status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      }

      await soundRef.current.playAsync();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Pressable style={styles.container} onPress={togglePlayback} disabled={isLoading}>
      <Feather
        name={isPlaying ? 'pause' : 'play'}
        size={18}
        color={colors.light.text.primary}
      />
      <View style={styles.textBlock}>
        <Text style={styles.title}>Аудиозапись</Text>
        {fileName ? <Text style={styles.subtitle} numberOfLines={1}>{fileName}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.25)',
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 14,
    color: colors.light.text.primary,
  },
  subtitle: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 12,
    color: colors.light.text.secondary,
  },
});
