import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import type { Agent, AgentConfig, Message } from './types';
import { DEFAULT_SETTINGS } from '../config';

/**
 * Create a type-safe agent
 *
 * @example
 * ```typescript
 * export const reconAgent = defineAgent({
 *   name: 'recon',
 *   schema: reconSchema,
 *   systemMessage: SYSTEM_MESSAGE,
 *   buildUserMessage: buildContext,
 *   settings: {
 *     temperature: 0.5,
 *     maxOutputTokens: 3000,
 *   }
 * });
 * ```
 */
export function defineAgent<TInput, TOutput>(
  config: AgentConfig<TInput, TOutput>
): Agent<TInput, TOutput> {
  // Merge with defaults
  const settings = {
    ...DEFAULT_SETTINGS,
    ...config.settings,
  };

  return {
    name: config.name,
    schema: config.schema,
    systemMessage: config.systemMessage,
    buildUserMessage: config.buildUserMessage,
    settings,

    async execute(input: TInput): Promise<TOutput> {
      const messages: Message[] = [
        { role: 'system', content: config.systemMessage },
        { role: 'user', content: config.buildUserMessage(input) },
      ];

      try {
        const result = await generateObject({
          model: openai(settings.model),
          messages,
          schema: config.schema,
          temperature: settings.temperature,
          maxTokens: settings.maxOutputTokens,
        });
        return result.object as TOutput;
      } catch (error) {
        console.error(`[${config.name}] Agent execution failed:`, error);
        if (error instanceof Error) {
          console.error(`[${config.name}] Error details:`, error.message);
        }
        throw error;
      }
    },
  };
}
