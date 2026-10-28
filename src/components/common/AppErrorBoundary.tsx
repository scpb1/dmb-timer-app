import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { logger } from '@/utils/logger';

interface AppErrorBoundaryProps {
  children: ReactNode;
  onReset: () => void;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

/** Ловит падение экрана, чтобы не ронять всё приложение */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error(`Падение экрана: ${error.message}`, info.componentStack);
  }

  private handleReset = (): void => {
    this.setState({ error: null });
    this.props.onReset();
  };

  render(): ReactNode {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <View style={styles.root} accessibilityRole="alert">
        <Text style={styles.title}>Что-то сломалось</Text>
        <Text style={styles.body}>
          Можно перезапустить экран. Записи и настройки на устройстве остаются.
        </Text>
        {this.state.error.message ? (
          <Text style={styles.detail} selectable>
            {this.state.error.message}
          </Text>
        ) : null}
        <Pressable
          style={[
            styles.button,
            {
              backgroundColor: colors.light.overlay.fill,
              borderColor: colors.light.overlay.border,
            },
          ]}
          onPress={this.handleReset}
          accessibilityRole="button"
          accessibilityLabel="Перезапустить"
        >
          <Text style={styles.buttonLabel}>Перезапустить</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: colors.dark.background.start,
  },
  title: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 24,
    color: colors.dark.text.primary,
    marginBottom: 12,
  },
  body: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
    lineHeight: 22,
    color: colors.dark.text.secondary,
    marginBottom: 16,
  },
  detail: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(245, 242, 235, 0.72)',
    marginBottom: 28,
  },
  button: {
    alignSelf: 'flex-start',
    borderRadius: 4,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
  },
  buttonLabel: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 16,
    color: colors.light.text.primary,
  },
});
