import { describe, expect, it } from "vitest";

import { RequestAdapter, ResponseAdapter } from "../adapter.js";

describe("RequestAdapter", () => {
  /**
   * @param queryString Query string, without the leading "?".
   * @returns The parsed query, as core's handlers receive it.
   */
  const query = (queryString: string): Record<string, string> =>
    new RequestAdapter(new Request(`https://example.com/api?${queryString}`))
      .query;

  it("reads a valueless parameter as an empty string", () => {
    // Express and vercel both parse it this way; core relies on it.
    expect(query("hide_border")).toEqual({ hide_border: "" });
  });

  it("percent-decodes values", () => {
    expect(query("custom_title=Hello%20World")).toEqual({
      custom_title: "Hello World",
    });
  });

  it("keeps the last of a repeated parameter", () => {
    expect(query("theme=dark&theme=radical")).toEqual({ theme: "radical" });
  });

  it("is empty when there is no query string", () => {
    expect(query("")).toEqual({});
  });
});

describe("ResponseAdapter", () => {
  it("serialises an object as JSON", () => {
    const res = new ResponseAdapter();
    res.send({ up: true });

    expect(res.body).toBe('{"up":true}');
    expect(res.headers["Content-Type"]).toBe("application/json");
  });

  it("passes a string through untouched", () => {
    const res = new ResponseAdapter();
    res.send("<svg />");

    expect(res.body).toBe("<svg />");
    expect(res.headers["Content-Type"]).toBeUndefined();
  });

  it("coerces anything else to a string", () => {
    const res = new ResponseAdapter();
    res.send(true);

    expect(res.body).toBe("true");
  });

  it("carries its headers onto the response", async () => {
    const res = new ResponseAdapter();
    res.setHeader("Cache-Control", "max-age=600");
    res.send("body");
    const response = res.toResponse();

    expect(response.headers.get("Cache-Control")).toBe("max-age=600");
    await expect(response.text()).resolves.toBe("body");
  });
});
