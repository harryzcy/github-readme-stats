export class RequestAdapter {
  params = {};

  /**
   * @param {Request} request Cloudflare Workers request
   */
  constructor(request) {
    this.request = request;

    // Matches how upstream's express/vercel deployment parses the query
    // string, so core handlers see identical input: percent-decoded values,
    // and a valueless parameter as "" rather than a boolean.
    this.params = Object.fromEntries(new URL(request.url).searchParams);
  }

  /**
   * @returns {string} request method
   * @readonly
   */
  get query() {
    return this.params;
  }
}

export class ResponseAdapter {
  headers = {};
  body = "";

  /**
   * @param {string} key header key
   * @param {string} value header value
   * @returns {void}
   */
  setHeader(key, value) {
    this.headers[key] = value;
  }

  /**
   * Mirrors the express-like `send` upstream's router provides: objects are
   * serialised as JSON, anything else is coerced to a string.
   *
   * @param {any} body response body
   * @returns {void}
   */
  send(body) {
    if (typeof body === "object" && body !== null) {
      this.headers["Content-Type"] = "application/json";
      this.body = JSON.stringify(body);
      return;
    }

    this.body = typeof body === "string" ? body : String(body);
  }

  /**
   * @returns {Response} Cloudflare Workers response
   */
  toResponse() {
    return new Response(this.body, {
      headers: this.headers,
    });
  }
}
