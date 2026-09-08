import { describe, expect, it } from "vitest";

import { cards, fetchWorker } from "./_worker.js";

/**
 * @param response A worker response.
 * @returns The rendered card body.
 */
const card = (response: Response): Promise<string> => response.text();

describe("username access", () => {
  it("serves the card when no list is configured", async () => {
    await fetchWorker("/api?username=harryzcy");

    expect(cards.api).toHaveBeenCalledOnce();
  });

  it("serves a whitelisted username", async () => {
    await fetchWorker("/api?username=harryzcy", {
      WHITELIST: "harryzcy,other",
    });

    expect(cards.api).toHaveBeenCalledOnce();
  });

  it("refuses a username that is not whitelisted", async () => {
    const response = await fetchWorker("/api?username=stranger", {
      WHITELIST: "harryzcy",
    });

    await expect(card(response)).resolves.toContain(
      "This username is not whitelisted",
    );
    expect(cards.api).not.toHaveBeenCalled();
  });

  it("refuses a missing username when a whitelist is configured", async () => {
    const response = await fetchWorker("/api", { WHITELIST: "harryzcy" });

    await expect(card(response)).resolves.toContain(
      "This username is not whitelisted",
    );
    expect(cards.api).not.toHaveBeenCalled();
  });

  // Core splits the whitelist on "," without dropping empties, so a trailing
  // comma puts "" on the list. A missing username must still be refused.
  it("refuses a missing username against a trailing comma in the list", async () => {
    const response = await fetchWorker("/api", { WHITELIST: "harryzcy," });

    await expect(card(response)).resolves.toContain(
      "This username is not whitelisted",
    );
    expect(cards.api).not.toHaveBeenCalled();
  });

  it("refuses a blacklisted username", async () => {
    const response = await fetchWorker("/api?username=renovate-bot", {
      BLACKLIST: "renovate-bot,sw-yx",
    });

    await expect(card(response)).resolves.toContain(
      "This username is blacklisted",
    );
    expect(cards.api).not.toHaveBeenCalled();
  });

  it("ignores the blacklist once a whitelist narrows access", async () => {
    await fetchWorker("/api?username=renovate-bot", {
      WHITELIST: "renovate-bot",
      BLACKLIST: "renovate-bot",
    });

    expect(cards.api).toHaveBeenCalledOnce();
  });

  it("guards pin and top-langs the same way", async () => {
    await fetchWorker("/api/pin?username=stranger", { WHITELIST: "harryzcy" });
    await fetchWorker("/api/top-langs?username=stranger", {
      WHITELIST: "harryzcy",
    });

    expect(cards.pin).not.toHaveBeenCalled();
    expect(cards.topLangs).not.toHaveBeenCalled();
  });
});

describe("gist access", () => {
  it("guards on the id parameter, not the username", async () => {
    const response = await fetchWorker("/api/gist?id=abc123", {
      GIST_WHITELIST: "def456",
    });

    await expect(card(response)).resolves.toContain(
      "This gist ID is not whitelisted",
    );
    expect(cards.gist).not.toHaveBeenCalled();
  });

  it("serves a whitelisted gist", async () => {
    await fetchWorker("/api/gist?id=abc123", { GIST_WHITELIST: "abc123" });

    expect(cards.gist).toHaveBeenCalledOnce();
  });

  it("is unaffected by the username blacklist", async () => {
    await fetchWorker("/api/gist?id=abc123&username=renovate-bot", {
      BLACKLIST: "renovate-bot",
    });

    expect(cards.gist).toHaveBeenCalledOnce();
  });
});

describe("error cards", () => {
  it("rewrites core's issue tracker to this fork", async () => {
    cards.api.mockResolvedValueOnce({
      status: "error",
      content: "<svg>https://tinyurl.com/github-stats</svg>",
    });

    const response = await fetchWorker("/api?username=harryzcy");

    await expect(card(response)).resolves.toBe(
      "<svg>harryzcy/github-readme-stats</svg>",
    );
  });
});
