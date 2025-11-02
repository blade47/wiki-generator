import type { NextConfig } from "next";
import { withWorkflow } from 'workflow/next';

const nextConfig: NextConfig = {
  // Exclude native modules from webpack bundling
  serverExternalPackages: [
    'tree-sitter',
    'tree-sitter-javascript',
    'tree-sitter-typescript',
    'tree-sitter-python',
    'tree-sitter-go',
    'tree-sitter-rust',
  ],

  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't bundle native modules on server
      config.externals = config.externals || [];
      config.externals.push({
        'tree-sitter': 'commonjs tree-sitter',
        'tree-sitter-javascript': 'commonjs tree-sitter-javascript',
        'tree-sitter-typescript': 'commonjs tree-sitter-typescript',
        'tree-sitter-python': 'commonjs tree-sitter-python',
        'tree-sitter-go': 'commonjs tree-sitter-go',
        'tree-sitter-rust': 'commonjs tree-sitter-rust',
      });
    }
    return config;
  },
};

export default withWorkflow(nextConfig);
