import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { openReadOnlyDatabase } from '@/services/database';
import { logger } from '@/utils/logger';
import { loadHomeWidgetModels } from '@/utils/timerWidget';
import { nativeThemeColors } from '@/utils/widgetStudio';
import { HolidayWidget } from '@/widgets/HolidayWidget';
import { StatsWidget } from '@/widgets/StatsWidget';
import { TimerWidget } from '@/widgets/TimerWidget';

const EMPTY_COLORS = nativeThemeColors(null);

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      try {
        await openReadOnlyDatabase();
        const models = await loadHomeWidgetModels();
        const name = props.widgetInfo.widgetName;
        if (name === 'HolidayWidget') {
          props.renderWidget(<HolidayWidget {...models.holiday} />);
          break;
        }
        if (name === 'StatsWidget') {
          props.renderWidget(<StatsWidget {...models.stats} />);
          break;
        }
        props.renderWidget(<TimerWidget {...models.timer} />);
      } catch (error) {
        logger.error('Не удалось обновить виджет', error);
        props.renderWidget(
          <TimerWidget
            kind="circular"
            primary="—"
            label="нет дат"
            secondary={null}
            graphicSvg=""
            {...EMPTY_COLORS}
          />,
        );
      }
      break;
    }
    default:
      break;
  }
}
