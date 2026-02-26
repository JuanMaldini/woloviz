/**
 * tourPreloadManager — singleton module-level cache for tour assets.
 *
 * Blob URLs are stored in a JS Map for the lifetime of the browser tab.
 * They survive route changes, so revisiting a tour is instant.
 *
 * Public API
 * ----------
 * getUrlMap(tourId)                  → Map<url, blobUrl> | null
 * storeUrlMap(tourId, urlMap)        → void
 * startBackgroundQueue()             → void  (non-blocking)
 * cancelBackgroundQueue()            → void
 */

import {
  buildTourAssetManifest,
  preloadTourAssetsWithProgress,
} from "./tourAssetLoading";
import { TOUR_PRELOAD_CONFIG } from "./tourPreloadConfig";

// ─── Cache ────────────────────────────────────────────────────────────────────

/** Map<tourId, Map<originalUrl, blobUrl>> — lives for the entire tab session. */
const _urlMapCache = new Map();

/**
 * Returns the cached urlMap for a tour if it is fully loaded, otherwise null.
 * @param {string} tourId
 * @returns {Map<string, string> | null}
 */
export const getUrlMap = (tourId) => _urlMapCache.get(tourId) ?? null;

/**
 * Persists a urlMap produced by a component-level preload into the shared cache.
 * Call this after a successful preload so the blobs are available on re-entry.
 * @param {string} tourId
 * @param {Map<string, string>} urlMap
 */
export const storeUrlMap = (tourId, urlMap) => {
  _urlMapCache.set(tourId, urlMap);
  console.log(
    `[TourPreload] ✅ storeUrlMap — "${tourId}" saved to cache (${urlMap.size} entries)`,
  );
};

// ─── Background queue ─────────────────────────────────────────────────────────

let _queueController = null;
let _queueRunning = false;

/**
 * Starts background preloading of all tours declared in TOUR_PRELOAD_CONFIG,
 * in order. Tours already in cache are silently skipped.
 *
 * Safe to call multiple times — a running queue is never duplicated.
 * Non-blocking: returns immediately and runs in the background.
 */
export const startBackgroundQueue = () => {
  if (_queueRunning) {
    console.log(
      "[TourPreload] ⏭ startBackgroundQueue — queue already running, skipped",
    );
    return;
  }

  console.log(
    "[TourPreload] 🚀 startBackgroundQueue — starting background queue",
  );
  _queueController = new AbortController();
  _queueRunning = true;

  _runQueue(_queueController.signal).finally(() => {
    _queueRunning = false;
    console.log("[TourPreload] 🏁 background queue finished");
  });
};

/**
 * Aborts any in-progress background queue.
 * Partially downloaded blobs are discarded; the next call to startBackgroundQueue
 * will restart from the first uncached tour.
 */
export const cancelBackgroundQueue = () => {
  console.log("[TourPreload] 🛑 cancelBackgroundQueue — aborting queue");
  _queueController?.abort();
  _queueRunning = false;
};

// ─── Internal ─────────────────────────────────────────────────────────────────

const _runQueue = async (signal) => {
  for (const config of TOUR_PRELOAD_CONFIG) {
    if (signal.aborted) break;

    // Skip tours already fully cached.
    if (_urlMapCache.has(config.id)) {
      console.log(
        `[TourPreload] ⚡ "${config.id}" already in cache — skipping`,
      );
      continue;
    }

    console.log(`[TourPreload] 📥 "${config.id}" — starting preload`);

    try {
      const tourData = await config.getData();
      if (signal.aborted) break;

      const floorplanUrl = config.getFloorplanUrl?.() ?? null;
      const assetUrls = floorplanUrl ? { floorplan: floorplanUrl } : {};
      const manifest = buildTourAssetManifest(tourData, assetUrls);

      if (manifest.allUrls.length === 0) continue;

      console.log(
        `[TourPreload] 📋 "${config.id}" — manifest: ${manifest.allUrls.length} files`,
      );

      const [firstUrl, ...restUrls] = manifest.allUrls;

      // Phase 1 — first scene image (highest priority in case user navigates here).
      console.log(
        `[TourPreload] 🖼 "${config.id}" — phase 1: loading first scene`,
      );
      const phase1 = await preloadTourAssetsWithProgress({
        urls: [firstUrl],
        signal,
      });

      if (signal.aborted) {
        phase1.revokeObjectUrls();
        break;
      }

      console.log(`[TourPreload] ✔ "${config.id}" — phase 1 done`);

      const combined = new Map(phase1.urlMap);

      // Phase 2 — remaining assets (floorplan + other scenes).
      if (restUrls.length > 0) {
        console.log(
          `[TourPreload] 🗂 "${config.id}" — phase 2: loading ${restUrls.length} remaining file(s)`,
        );
        const phase2 = await preloadTourAssetsWithProgress({
          urls: restUrls,
          signal,
        });

        if (signal.aborted) {
          phase2.revokeObjectUrls();
          break;
        }

        console.log(`[TourPreload] ✔ "${config.id}" — phase 2 done`);

        phase2.urlMap.forEach((blobUrl, originalUrl) => {
          combined.set(originalUrl, blobUrl);
        });
      }

      _urlMapCache.set(config.id, combined);
      console.log(
        `[TourPreload] 💾 "${config.id}" — fully cached (${combined.size} blob URLs)`,
      );
    } catch (err) {
      // Silently skip — a network error on one tour should not block the rest.
      console.warn(
        `[TourPreload] ⚠ "${config.id}" — error during preload:`,
        err,
      );
    }
  }
};
