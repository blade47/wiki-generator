/**
 * Recon Agent Schema
 */

import { z } from 'zod';

export const reconSchema = z.object({
  overview: z
    .string()
    .describe('Repository overview in 1-2 paragraphs. Focus on what the project does and who it\'s for.'),

  techStack: z.object({
    languages: z
      .array(z.string())
      .describe('Programming languages used (e.g., TypeScript, Python, Go)'),
    frameworks: z
      .array(z.string())
      .describe('Frameworks and libraries (e.g., React, Next.js, Express)'),
    tools: z
      .array(z.string())
      .describe('Build tools and utilities (e.g., Webpack, Vite, Docker)'),
  }),

  architecture: z.object({
    pattern: z
      .string()
      .describe('Main architecture pattern (e.g., MVC, Microservices, Monorepo, Serverless)'),
    description: z
      .string()
      .describe('Brief description of how the architecture works'),
  }),

  structure: z
    .array(
      z.object({
        directory: z.string().describe('Directory path (e.g., src/, lib/, components/)'),
        purpose: z.string().describe('What this directory contains and its role'),
      })
    )
    .describe('Key directories in the repository'),

  entryPoints: z
    .array(z.string())
    .describe('Main entry points or files users would start with (e.g., index.ts, main.py, App.tsx)'),

  testing: z
    .string()
    .optional()
    .describe('Testing approach if detected (framework, coverage, strategy)'),

  deployment: z
    .string()
    .optional()
    .describe('Deployment approach if detected (platform, CI/CD, configuration)'),
});
