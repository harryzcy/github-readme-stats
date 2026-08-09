import axios from "axios";
import { loadConfigFromEnv } from "@stats-organization/github-readme-stats-core";
import { guardAccess } from "../src/common/access.js";

// Core issues its GitHub requests through axios. Axios would resolve to its
// fetch adapter here anyway, since neither the http nor the xhr adapter is
// available under workerd, but pinning it keeps the choice explicit rather
// than dependent on axios' adapter probing order.
axios.defaults.adapter = "fetch";

// Which query parameter carries the identifier guarded for each access type.
const ID_PARAM = {
  username: "username",
  gist: "id",
  wakatime: "username",
};

let configured = false;

/**
 * Run an upstream core card handler and write its result into the response
 * adapter, so the shared header handling in index.js still applies.
 *
 * Core has no notion of our whitelist/blacklist -- upstream keeps access
 * control in its backend rather than in the card package -- so the guard is
 * applied here, before the handler runs.
 *
 * @param {Function} handler Core card handler.
 * @param {"username"|"gist"|"wakatime"} type Access type to guard on.
 * @param {import("./adapter.js").RequestAdapter} req Request adapter.
 * @param {import("./adapter.js").ResponseAdapter} res Response adapter.
 * @param {object} env Environment variables.
 * @returns {Promise<void>}
 */
export const fromCore = async (handler, type, req, res, env) => {
  if (!configured) {
    // env is constant for the lifetime of a deployment, so load it once.
    loadConfigFromEnv(env);
    configured = true;
  }

  res.setHeader("Content-Type", "image/svg+xml");

  const { title_color, text_color, bg_color, border_color, theme } = req.query;
  const access = guardAccess({
    res,
    id: req.query[ID_PARAM[type]],
    type,
    colors: { title_color, text_color, bg_color, border_color, theme },
  });
  if (!access.isPassed) {
    return;
  }

  // The second argument is a per-user PAT, which is backed by Postgres
  // upstream. We don't have that, so core falls back to the PAT_n pool.
  const { content } = await handler(req.query, null);

  res.send(content);
};
