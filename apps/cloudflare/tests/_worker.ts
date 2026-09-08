import { vi } from "vitest";
import type { Mock } from "vitest";

import type { Env } from "../core.js";

interface CardResult {
  status: string;
  content: string;
}

/** The part of the response adapter the vendored status handlers touch. */
interface ResponseLike {
  setHeader: (key: string, value: string) => void;
  send: (body: unknown) => void;
}

type CardMock = Mock<
  (params: Record<string, string>, pat: null) => Promise<CardResult>
>;

/**
 * Core's card handlers, stubbed. The cards themselves are upstream's to test;
 * what matters here is which handler a route reaches, and with what query.
 */
export const cards: Record<
  "api" | "gist" | "pin" | "topLangs" | "wakatime",
  CardMock
> = {
  api: vi.fn(),
  gist: vi.fn(),
  pin: vi.fn(),
  topLangs: vi.fn(),
  wakatime: vi.fn(),
};

export const statusUp: Mock<(req: unknown, res: ResponseLike) => void> =
  vi.fn();
export const statusPatInfo: Mock<(req: unknown, res: ResponseLike) => void> =
  vi.fn();

// Indirected through arrows because these factories run before the mocks above
// are initialised.
vi.mock(
  "@stats-organization/github-readme-stats-core",
  async (importActual) => {
    const actual =
      await importActual<
        typeof import("@stats-organization/github-readme-stats-core")
      >();
    return {
      ...actual,
      api: (params: Record<string, string>, pat: null) =>
        cards.api(params, pat),
      gist: (params: Record<string, string>, pat: null) =>
        cards.gist(params, pat),
      pin: (params: Record<string, string>, pat: null) =>
        cards.pin(params, pat),
      topLangs: (params: Record<string, string>, pat: null) =>
        cards.topLangs(params, pat),
      wakatime: (params: Record<string, string>, pat: null) =>
        cards.wakatime(params, pat),
    };
  },
);

vi.mock(
  "@stats-organization/github-readme-stats-backend/api-renamed/status/up.js",
  () => ({
    default: (req: unknown, res: ResponseLike) => {
      statusUp(req, res);
    },
  }),
);

vi.mock(
  "@stats-organization/github-readme-stats-backend/api-renamed/status/pat-info.js",
  () => ({
    default: (req: unknown, res: ResponseLike) => {
      statusPatInfo(req, res);
    },
  }),
);

/**
 * `core.ts` loads the config once per module instance, so every case that
 * varies the environment needs a fresh copy of the worker.
 *
 * @param path Request path, including any query string.
 * @param env Worker environment bindings.
 * @returns The worker's response.
 */
export const fetchWorker = async (
  path: string,
  env: Env = {},
): Promise<Response> => {
  vi.resetModules();
  for (const card of Object.values(cards)) {
    card.mockResolvedValue({ status: "success", content: "<svg />" });
  }
  const worker = (await import("../index.js")).default;
  return worker.fetch(new Request(`https://example.com${path}`), env);
};
