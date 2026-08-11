/**
 * OpenNext Worker の前段。本番 workers.dev は静的キャッシュより先に 301 する。
 * トップ `/` だけ middleware を通らず HTML が返るため、ここでホスト判定する。
 *
 * 旧 WordPress 画像（/wp-content/...）は public/wp-content に取り込み、
 * OpenNext ASSETS から配信する（Workers から Xserver IP 直 fetch は CF 1003 で不可）。
 */
import openNextWorker from "../.open-next/worker.js";

const PRODUCTION_WORKERS_HOST = "20260807-40kaigonavi.sonozono.workers.dev";
const CANONICAL_SITE_URL = "https://sonocafe.xyz";

function redirectProductionWorkersDev(request) {
  const host = request.headers.get("host")?.split(":")[0];
  if (host !== PRODUCTION_WORKERS_HOST) {
    return null;
  }

  const url = new URL(request.url);
  return Response.redirect(
    `${CANONICAL_SITE_URL}${url.pathname}${url.search}`,
    301,
  );
}

const inner = openNextWorker.default ?? openNextWorker;

export default {
  async fetch(request, env, ctx) {
    const redirect = redirectProductionWorkersDev(request);
    if (redirect) {
      return redirect;
    }
    return inner.fetch(request, env, ctx);
  },
};

export {
  DOQueueHandler,
  DOShardedTagCache,
  BucketCachePurge,
} from "../.open-next/worker.js";
