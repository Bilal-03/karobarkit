import { z } from 'zod';

import { validationFromSchema } from '@/domain/calculations/utilities/shared';
import type { ValidationResult } from '@/domain/calculations/types';

export const MAX_WORD_COUNTER_TEXT_LENGTH = 200_000;
export const wordCounterInputSchema = z.object({
  text: z
    .string()
    .max(
      MAX_WORD_COUNTER_TEXT_LENGTH,
      `Use at most ${MAX_WORD_COUNTER_TEXT_LENGTH.toLocaleString()} characters.`,
    ),
});

export type WordCounterInput = z.infer<typeof wordCounterInputSchema>;

export interface WordCounterResult {
  words: number;
  characters: number;
  charactersWithoutSpaces: number;
  lines: number;
  paragraphs: number;
}

export function validateWordCounterInput(input: WordCounterInput): ValidationResult<WordCounterInput> {
  return validationFromSchema(wordCounterInputSchema, input);
}

function countWords(text: string) {
  if (!text.trim()) return 0;
  if ('Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' });
    let count = 0;
    for (const segment of segmenter.segment(text)) if (segment.isWordLike) count += 1;
    return count;
  }
  return text.match(/[\p{L}\p{N}]+/gu)?.length ?? 0;
}

export function calculateWordCounter(input: WordCounterInput): WordCounterResult {
  const validation = validateWordCounterInput(input);
  if (!validation.success) throw new Error(validation.errors[0]?.message ?? 'Invalid text.');
  const text = validation.data.text;
  return {
    words: countWords(text),
    characters: Array.from(text).length,
    charactersWithoutSpaces: Array.from(text.replace(/\s/gu, '')).length,
    lines: text === '' ? 0 : text.split(/\r\n|\r|\n/u).length,
    paragraphs: text.trim() === '' ? 0 : text.trim().split(/\n\s*\n/u).length,
  };
}
