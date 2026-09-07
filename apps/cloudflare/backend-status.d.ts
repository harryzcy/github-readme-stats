// The status endpoints are JavaScript and `apps/backend` is excluded from
// typechecking, so they ship no declarations of their own.
declare module "@stats-organization/github-readme-stats-backend/api-renamed/status/pat-info.js" {
  const handler: (
    req: import("./adapter.js").RequestAdapter,
    res: import("./adapter.js").ResponseAdapter,
  ) => Promise<void>;
  export default handler;
}

declare module "@stats-organization/github-readme-stats-backend/api-renamed/status/up.js" {
  const handler: (
    req: import("./adapter.js").RequestAdapter,
    res: import("./adapter.js").ResponseAdapter,
  ) => Promise<void>;
  export default handler;
}
