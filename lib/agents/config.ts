/**
 * Simple agent configuration
 */

// Available models
export const MODELS = {
  GPT_5_MINI: 'gpt-5-mini',
} as const;

export type Model = typeof MODELS[keyof typeof MODELS];

export interface AgentSettings {
  model?: Model | string;
  maxOutputTokens?: number;
}

// Default settings
export const DEFAULT_SETTINGS: Required<AgentSettings> = {
  model: MODELS.GPT_5_MINI,
  maxOutputTokens: 2000,
};
