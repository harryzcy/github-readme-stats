import axios from "axios";
import { loadConfigFromEnv } from "@stats-organization/github-readme-stats-core";

// Core issues its GitHub requests through axios. Axios would resolve to its
// fetch adapter here anyway, since neither the http nor the xhr adapter is
// available under workerd, but pinning it keeps the choice explicit rather
// than dependent on axios' adapter probing order.
axios.defaults.adapter = "fetch";

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
  res.send(content);
};
