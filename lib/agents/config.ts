/**
 * Simple agent configuration
 */

// Available models
export const MODELS = {
  GPT_4O_MINI: 'gpt-4o-mini',
  GPT_4O: 'gpt-4o',
} as const;

export type Model = typeof MODELS[keyof typeof MODELS];

export interface AgentSettings {
  model?: Model | string;
  temperature?: number;
  maxOutputTokens?: number;
}

// Default settings
export const DEFAULT_SETTINGS: Required<AgentSettings> = {
  model: MODELS.GPT_4O_MINI,
  temperature: 0.3,
  maxOutputTokens: 2000,
};
