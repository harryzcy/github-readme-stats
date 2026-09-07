import {
  getConfig,
  loadConfigFromEnv,
  renderError,
} from "@stats-organization/github-readme-stats-core";
import axios from "axios";

import type { RequestAdapter, ResponseAdapter } from "./adapter.js";

/** Worker environment bindings: wrangler.toml `[vars]`, plus the secrets. */
export interface Env {
  [binding: string]: string | undefined;
  BLACKLIST?: string;
  IS_CLOUDFLARE?: string;
}

type AccessType = "username" | "gist" | "wakatime";

interface CardResult {
  status: string;
  content: string;
}

// Handlers destructure different query parameters, so `never` is the only
// parameter type they share. The result is the part we depend on.
type CardHandler = (params: never, pat: null) => Promise<CardResult>;

// Axios picks fetch here anyway -- http and xhr are unavailable under
// workerd -- so this only makes the choice explicit.
axios.defaults.adapter = "fetch";

// Cloudflare only supports the "no-store" and "no-cache" cache modes.
// https://developers.cloudflare.com/workers/runtime-apis/fetch/
axios.defaults.fetchOptions = { cache: "no-cache" };

// Core hardcodes the successor project's issue tracker in error cards, with
// no option to change it. No-ops if upstream ever changes the string.
// Kept as a bare repo reference: the full URL overflows the fixed-width card.
const CORE_ISSUE_URL = "https://tinyurl.com/github-stats";
const ISSUE_REF = "harryzcy/github-readme-stats";

// Which query parameter carries the guarded identifier, per access type.
const ID_PARAM: Record<AccessType, string> = {
  username: "username",
  gist: "id",
  wakatime: "username",
};

let configured = false;

/**
 * Make core's config -- the PAT pool in particular -- available to any handler
 * that needs it. Core loads it from `process.env` at import time, which is
 * empty here, so it has to be reloaded from the Worker's env bindings.
 *
 * @param env Environment variables.
 */
export const ensureConfig = (env: Env): void => {
  if (!configured) {
    // env is constant for the lifetime of a deployment, so load it once.
    loadConfigFromEnv(env);
    configured = true;
  }
};

/**
 * @param value Comma-separated list.
 * @returns Trimmed, non-empty entries.
 */
const parseList = (value: string | undefined): Array<string> => {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
};

/**
 * Refuse a request when the identifier is not whitelisted, or is blacklisted.
 *
 * Core has no access control -- upstream keeps it in its backend, since which
 * identifiers an instance serves is deployment policy rather than card logic
 * -- so it lives here. Whitelists come from core's config (`WHITELIST` and
 * `GIST_WHITELIST`); the blacklist comes from `BLACKLIST`.
 *
 * @param type Access type.
 * @param req Request adapter.
 * @param env Environment variables.
 * @returns An error card, or null when access is allowed.
 */
const guardAccess = (
  type: AccessType,
  req: RequestAdapter,
  env: Env,
): string | null => {
  const { title_color, text_color, bg_color, border_color, theme } = req.query;

  // Core's render options are exact-optional: omit rather than pass undefined.
  const renderOptions = {
    ...(title_color !== undefined && { title_color }),
    ...(text_color !== undefined && { text_color }),
    ...(bg_color !== undefined && { bg_color }),
    ...(border_color !== undefined && { border_color }),
    ...(theme !== undefined && { theme }),
    show_repo_link: false,
  };

  const id = req.query[ID_PARAM[type]];
  const { whitelist, gistWhitelist } = getConfig();
  const allowed = type === "gist" ? gistWhitelist : whitelist;

  if (Array.isArray(allowed) && (id === undefined || !allowed.includes(id))) {
    return renderError({
      message:
        type === "gist"
          ? "This gist ID is not whitelisted"
          : "This username is not whitelisted",
      secondaryMessage: "Please deploy your own instance",
      renderOptions,
    });
  }

  // A whitelist already restricts access, so the blacklist only applies when
  // there isn't one. Gist IDs and wakatime users are not blacklisted.
  if (
    type === "username" &&
    allowed === undefined &&
    id !== undefined &&
    parseList(env.BLACKLIST).includes(id)
  ) {
    return renderError({
      message: "This username is blacklisted",
      secondaryMessage: "Please deploy your own instance",
      renderOptions,
    });
  }

  return null;
};

/**
 * Run an upstream core card handler and write its result into the response
 * adapter, so the shared header handling in index.ts still applies.
 *
 * @param handler Core card handler.
 * @param type Access type to guard on.
 * @param req Request adapter.
 * @param res Response adapter.
 * @param env Environment variables.
 */
export const fromCore = async (
  handler: CardHandler,
  type: AccessType,
  req: RequestAdapter,
  res: ResponseAdapter,
  env: Env,
): Promise<void> => {
  ensureConfig(env);

  res.setHeader("Content-Type", "image/svg+xml");

  const refused = guardAccess(type, req, env);
  if (refused) {
    res.send(refused.replace(CORE_ISSUE_URL, ISSUE_REF));
    return;
  }

  // The second argument is a per-user PAT, which is backed by Postgres
  // upstream. We don't have that, so core falls back to the PAT_n pool.
  const { content } = await handler(req.query as never, null);

  res.send(content.replace(CORE_ISSUE_URL, ISSUE_REF));
};
