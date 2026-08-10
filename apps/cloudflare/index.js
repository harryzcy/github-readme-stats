import {
  api,
  gist,
  pin,
  topLangs,
  wakatime,
} from "@stats-organization/github-readme-stats-core";
import { RequestAdapter, ResponseAdapter } from "./adapter.js";
import { ensureConfig, fromCore } from "./core.js";
import statusPatInfoHandler from "@stats-organization/github-readme-stats-backend/api-renamed/status/pat-info.js";
import statusUpHandler from "@stats-organization/github-readme-stats-backend/api-renamed/status/up.js";

export default {
  async fetch(request, env) {
    env.IS_CLOUDFLARE = "true"; // used to detect if running on Cloudflare
    ensureConfig(env);

    const req = new RequestAdapter(request);
    const res = new ResponseAdapter();

    const { pathname } = new URL(request.url);
    if (pathname === "/") {
      return new Response(
        `<!DOCTYPE html>
          <head>
            <title>GitHub Readme Stats</title>
            <meta name="description" content="⚡ Dynamically generated stats for your github readmes" />
            <link rel="canonical" href="https://github-readme-stats.zcy.dev/" />
          </head>
          <body>
            <h1>GitHub Readme Stats</h1>
            <p>⚡ Dynamically generated stats for your github readmes</p>
            <p>
              <span style="visibility: hidden;">⚡ </span>
              <span>Hosted on Cloudflare from permanent fork: </span>
              <a href="https://github.com/harryzcy/github-readme-stats">harryzcy/github-readme-stats</a>
            </p>
          </body>
        </html>`,
        {
          headers: {
            "Content-Type": "text/html;charset=UTF-8",
            "Cache-Control": "max-age=600", // 10 min
          },
        },
      );
    }

    if (pathname === "/robots.txt") {
      return new Response("User-agent: *\nDisallow: /\nAllow: /$", {
        headers: {
          "Content-Type": "text/plain;charset=UTF-8",
          "Cache-Control": "max-age=600", // 10 min
        },
      });
    }

    if (pathname === "/api") {
      await fromCore(api, "username", req, res, env);
    } else if (pathname === "/api/gist") {
      await fromCore(gist, "gist", req, res, env);
    } else if (pathname === "/api/pin") {
      await fromCore(pin, "username", req, res, env);
    } else if (pathname === "/api/top-langs") {
      await fromCore(topLangs, "username", req, res, env);
    } else if (pathname === "/api/wakatime") {
      await fromCore(wakatime, "wakatime", req, res, env);
    } else if (pathname === "/api/status/pat-info") {
      await statusPatInfoHandler(req, res);
    } else if (pathname === "/api/status/up") {
      await statusUpHandler(req, res);
    } else {
      return new Response("not found", { status: 404 });
    }

    // The status endpoints pick their own cache lifetime; only fall back to
    // the default for handlers that didn't set one.
    if (!res.headers["Cache-Control"]) {
      res.setHeader("Cache-Control", "max-age=600"); // 10 min
    }

    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    return res.toResponse();
  },
};
