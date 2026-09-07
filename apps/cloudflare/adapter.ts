/** Anything upstream's handlers hand to `send`. */
type ResponseBody = string | number | boolean | object | null;

export class RequestAdapter {
  readonly request: Request;
  readonly params: Record<string, string>;

  /**
   * @param request Cloudflare Workers request.
   */
  constructor(request: Request) {
    this.request = request;

    // Matches how upstream's express/vercel deployment parses the query
    // string, so core handlers see identical input: percent-decoded values,
    // and a valueless parameter as "" rather than a boolean.
    this.params = Object.fromEntries(new URL(request.url).searchParams);
  }

  /**
   * The parsed query string, under the name core's handlers read it from.
   */
  get query(): Record<string, string> {
    return this.params;
  }
}

export class ResponseAdapter {
  readonly headers: Record<string, string> = {};
  body = "";

  /**
   * @param key Header key.
   * @param value Header value.
   */
  setHeader(key: string, value: string): void {
    this.headers[key] = value;
  }

  /**
   * Mirrors the express-like `send` upstream's router provides: objects are
   * serialised as JSON, anything else is coerced to a string.
   *
   * @param body Response body.
   */
  send(body: ResponseBody): void {
    if (typeof body === "object" && body !== null) {
      this.headers["Content-Type"] = "application/json";
      this.body = JSON.stringify(body);
      return;
    }

    this.body = typeof body === "string" ? body : String(body);
  }

  /**
   * @returns Cloudflare Workers response.
   */
  toResponse(): Response {
    return new Response(this.body, {
      headers: this.headers,
    });
  }
}
