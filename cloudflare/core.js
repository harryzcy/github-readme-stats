import axios from "axios";
import { loadConfigFromEnv } from "@stats-organization/github-readme-stats-core";

// Axios picks fetch here anyway -- http and xhr are unavailable under
// workerd -- so this only makes the choice explicit.
axios.defaults.adapter = "fetch";

// Core hardcodes the successor project's issue tracker in error cards, with
// no option to change it. No-ops if upstream ever changes the string.
const CORE_ISSUE_URL = "https://tinyurl.com/github-stats";
const ISSUE_URL = "https://github.com/harryzcy/github-readme-stats";

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
 * Run an upstream core card handler and write its result into the response
 * adapter, so the shared header handling in index.js still applies.
 *
 * @param {Function} handler Core card handler.
 * @param {import("./adapter.js").RequestAdapter} req Request adapter.
 * @param {import("./adapter.js").ResponseAdapter} res Response adapter.
 * @param {object} env Environment variables.
 * @returns {Promise<void>}
 */
export const fromCore = async (handler, req, res, env) => {
  ensureConfig(env);

  // The second argument is a per-user PAT, which is backed by Postgres
  // upstream. We don't have that, so core falls back to the PAT_n pool.
  const { content } = await handler(req.query, null);

  res.setHeader("Content-Type", "image/svg+xml");
  res.send(content.replace(CORE_ISSUE_URL, ISSUE_URL));
};
