import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRef } from 'react';

import type { DiaryParagraphBlock, DiaryTextStyle } from '@/types/diary';
import { applyTextChange, flattenSpans, toRnTextStyle } from '@/utils/diaryContent';

interface DiaryParagraphProps {
  block: DiaryParagraphBlock;
  typingStyle: DiaryTextStyle;
  editable?: boolean;
  onChangeSpans: (spans: DiaryParagraphBlock['spans']) => void;
  onSelectionChange: (start: number, end: number) => void;
  onFocus: () => void;
  inputRef?: (ref: TextInput | null) => void;
}

/** Абзац дневника с вложенными стилями внутри TextInput */
export function DiaryParagraph({
  block,
  typingStyle,
  editable = true,
  onChangeSpans,
  onSelectionChange,
  onFocus,
  inputRef,
}: DiaryParagraphProps) {
  const text = flattenSpans(block.spans);
  const lastTextRef = useRef(text);
  const spansRef = useRef(block.spans);
  lastTextRef.current = text;
  spansRef.current = block.spans;

  return (
    <View style={styles.wrap}>
      <TextInput
        ref={inputRef}
        multiline
        editable={editable}
        scrollEnabled={false}
        textAlignVertical="top"
        underlineColorAndroid="transparent"
        placeholder={editable ? 'Пиши здесь...' : ''}
        placeholderTextColor="rgba(62, 54, 48, 0.28)"
        onFocus={onFocus}
        onChangeText={(nextText) => {
          const nextSpans = applyTextChange(spansRef.current, lastTextRef.current, nextText, typingStyle);
          spansRef.current = nextSpans;
          lastTextRef.current = nextText;
          onChangeSpans(nextSpans);
        }}
        onSelectionChange={(event) => {
          onSelectionChange(event.nativeEvent.selection.start, event.nativeEvent.selection.end);
        }}
        style={[styles.input, toRnTextStyle(typingStyle)]}
      >
        {block.spans.map((span) => (
          <Text key={span.id} style={toRnTextStyle(span.style)}>
            {span.text}
          </Text>
        ))}
      </TextInput>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 28,
  },
  input: {
    minHeight: 28,
    padding: 0,
    margin: 0,
    textAlignVertical: 'top',
    ...Platform.select({
      android: { includeFontPadding: false },
      default: {},
    }),
  },
});
