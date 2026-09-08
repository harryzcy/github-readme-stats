import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    // The worker only needs the fetch globals, which node provides.
    environment: "node",
    // Each case asserts which handler a route reached.
    clearMocks: true,
    include: ["./tests/*.test.ts"],
  },
});
