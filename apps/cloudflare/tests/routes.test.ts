import { describe, expect, it } from "vitest";

import { cards, fetchWorker, statusPatInfo, statusUp } from "./_worker.js";

describe("routing", () => {
  it.each([
    ["/api", "api"],
    ["/api/gist", "gist"],
    ["/api/pin", "pin"],
    ["/api/top-langs", "topLangs"],
    ["/api/wakatime", "wakatime"],
  ] as const)("%s reaches the %s handler", async (path, handler) => {
    await fetchWorker(path);

    expect(cards[handler]).toHaveBeenCalledOnce();
    for (const [name, card] of Object.entries(cards)) {
      if (name !== handler) {
        expect(card).not.toHaveBeenCalled();
      }
    }
  });

  // Upstream's readme uses a trailing slash, so many READMEs point at "/api/".
  it.each([
    ["/api/", "api"],
    ["/api/gist/", "gist"],
    ["/api/pin/", "pin"],
    ["/api/top-langs/", "topLangs"],
    ["/api/wakatime/", "wakatime"],
  ] as const)("%s is served like its unslashed form", async (path, handler) => {
    const response = await fetchWorker(path);

    expect(response.status).toBe(200);
    expect(cards[handler]).toHaveBeenCalledOnce();
  });

  it("passes the query string through to the handler", async () => {
    await fetchWorker("/api?username=harryzcy&hide_border");

    expect(cards.api).toHaveBeenCalledWith(
      expect.objectContaining({ username: "harryzcy", hide_border: "" }),
      null,
    );
  });

  it("reaches the vendored status handlers", async () => {
    await fetchWorker("/api/status/up");
    await fetchWorker("/api/status/pat-info");

    expect(statusUp).toHaveBeenCalledOnce();
    expect(statusPatInfo).toHaveBeenCalledOnce();
  });

  it("normalises a trailing slash on the status endpoints too", async () => {
    await fetchWorker("/api/status/up/");

    expect(statusUp).toHaveBeenCalledOnce();
  });

  it("serves a landing page at the root", async () => {
    const response = await fetchWorker("/");

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "text/html;charset=UTF-8",
    );
    await expect(response.text()).resolves.toContain("GitHub Readme Stats");
  });

  it("disallows crawlers in robots.txt", async () => {
    const response = await fetchWorker("/robots.txt");

    expect(response.headers.get("Content-Type")).toBe(
      "text/plain;charset=UTF-8",
    );
    await expect(response.text()).resolves.toContain("Disallow: /");
  });

  it.each(["/nope", "/api/nope", "/api/pin/extra"])(
    "404s on %s",
    async (path) => {
      const response = await fetchWorker(path);

      expect(response.status).toBe(404);
    },
  );
});

describe("response headers", () => {
  it("defaults to a ten minute cache and asks not to be indexed", async () => {
    const response = await fetchWorker("/api");

    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(response.headers.get("Cache-Control")).toBe("max-age=600");
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
  });

  it("leaves a cache lifetime the handler chose alone", async () => {
    statusUp.mockImplementationOnce((_req, res) => {
      res.setHeader("Cache-Control", "no-store");
    });

    const response = await fetchWorker("/api/status/up");

    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
