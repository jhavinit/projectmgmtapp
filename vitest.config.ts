/* eslint-disable @typescript-eslint/no-unsafe-call */
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        globals: true,
        environment: "node",
        include: ["**/__tests__/**/*.test.ts"],
    },
});
