import { defineConfig } from 'vitest/config';
import * as path from 'path';

export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts'],
  },
  plugins: [
    {
      name: 'fix-vitest-parentheses',
      config(config) {
        if (config.test && config.test.include) {
          const rootDir = config.root || process.cwd();
          config.test.include = config.test.include.map((p: string) => {
            if (path.isAbsolute(p)) {
              let relativePath = path.relative(rootDir, p);
              relativePath = relativePath.replace(/\\/g, '/');
              return relativePath;
            }
            return p;
          });
        }
      }
    }
  ]
});
