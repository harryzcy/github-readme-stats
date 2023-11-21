import { RequestAdapter, ResponseAdapter } from "./adapter.js";
import { handler as gistHandler } from "../api/gist.js";
import { handler as indexHandler } from "../api/index.js";
import { handler as pinHandler } from "../api/pin.js";
import { handler as topLangsHandler } from "../api/top-langs.js";
import wakatimeHandler from "../api/wakatime.js";
import { handler as statusPatInfoHandler } from "../api/status/pat-info.js";
import { handler as statusUpHandler } from "../api/status/up.js";

export default {
  async fetch(request, env) {
    env.IS_CLOUDFLARE = "true"; // used to detect if running on Cloudflare

    const req = new RequestAdapter(request);
    const res = new ResponseAdapter();

    const { pathname } = new URL(request.url);
    if (pathname === "/") {
      return new Response(
        '<a href="https://github.com/harryzcy/github-readme-stats"><h1>GitHub Readme Stats</h1></a>',
      );
    }

    if (pathname === "/api") {
      await indexHandler(req, res, env);
    } else if (pathname === "/api/gist") {
      await gistHandler(req, res, env);
    } else if (pathname === "/api/pin") {
      await pinHandler(req, res, env);
    } else if (pathname === "/api/top-langs") {
      await topLangsHandler(req, res, env);
    } else if (pathname === "/api/wakatime") {
      await wakatimeHandler(req, res, env);
    } else if (pathname === "/api/status/pat-info") {
      await statusPatInfoHandler(req, res, env);
    } else if (pathname === "/api/status/up") {
      await statusUpHandler(req, res, env);
    } else {
      return new Response("not found", { status: 404 });
    }

    return res.toResponse();
  },
};
