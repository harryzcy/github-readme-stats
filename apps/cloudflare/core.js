import {
  getConfig,
  loadConfigFromEnv,
  renderError,
} from "@stats-organization/github-readme-stats-core";
import axios from "axios";

// Axios picks fetch here anyway -- http and xhr are unavailable under
// workerd -- so this only makes the choice explicit.
axios.defaults.adapter = "fetch";

// axios >=1.20 pins `cache: "default"` on every Request, which workerd
// rejects. "no-cache" needs a compatibility date of 2025-08-07 or later.
axios.defaults.fetchOptions = { cache: "no-cache" };

// Core hardcodes the successor project's issue tracker in error cards, with
// no option to change it. No-ops if upstream ever changes the string.
// Kept as a bare repo reference: the full URL overflows the fixed-width card.
const CORE_ISSUE_URL = "https://tinyurl.com/github-stats";
const ISSUE_REF = "harryzcy/github-readme-stats";

// Which query parameter carries the guarded identifier, per access type.
const ID_PARAM = {
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
 * @param {object} env Environment variables.
 * @returns {void}
 */
export const ensureConfig = (env) => {
  if (!configured) {
    // env is constant for the lifetime of a deployment, so load it once.
    loadConfigFromEnv(env);
    configured = true;
  }
};

/**
 * @param {string=} value Comma-separated list.
 * @returns {string[]} Trimmed, non-empty entries.
 */
const parseList = (value) => {
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
 * @param {"username"|"gist"|"wakatime"} type Access type.
 * @param {import("./adapter.js").RequestAdapter} req Request adapter.
 * @param {object} env Environment variables.
 * @returns {string|null} An error card, or null when access is allowed.
 */
const guardAccess = (type, req, env) => {
  const { title_color, text_color, bg_color, border_color, theme } = req.query;
  const renderOptions = {
    title_color,
    text_color,
    bg_color,
    border_color,
    theme,
    show_repo_link: false,
  };

  const id = req.query[ID_PARAM[type]];
  const { whitelist, gistWhitelist } = getConfig();
  const allowed = type === "gist" ? gistWhitelist : whitelist;

  if (Array.isArray(allowed) && !allowed.includes(id)) {
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
 * adapter, so the shared header handling in index.js still applies.
 *
 * @param {Function} handler Core card handler.
 * @param {"username"|"gist"|"wakatime"} type Access type to guard on.
 * @param {import("./adapter.js").RequestAdapter} req Request adapter.
 * @param {import("./adapter.js").ResponseAdapter} res Response adapter.
 * @param {object} env Environment variables.
 * @returns {Promise<void>}
 */
export const fromCore = async (handler, type, req, res, env) => {
  ensureConfig(env);

  res.setHeader("Content-Type", "image/svg+xml");

  const refused = guardAccess(type, req, env);
  if (refused) {
    res.send(refused.replace(CORE_ISSUE_URL, ISSUE_REF));
    return;
  }

  // The second argument is a per-user PAT, which is backed by Postgres
  // upstream. We don't have that, so core falls back to the PAT_n pool.
  const { content } = await handler(req.query, null);

  res.send(content.replace(CORE_ISSUE_URL, ISSUE_REF));
};
