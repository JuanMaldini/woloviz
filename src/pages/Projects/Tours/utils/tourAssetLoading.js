const isPositiveFinite = (value) => Number.isFinite(value) && value > 0;

const parseContentLength = (response) => {
  const rawLength = response?.headers?.get?.("content-length");
  const parsed = Number.parseInt(rawLength ?? "", 10);
  return isPositiveFinite(parsed) ? parsed : 0;
};

const toUniqueStringArray = (values) => {
  const seen = new Set();
  const result = [];

  values.forEach((value) => {
    if (typeof value !== "string" || value.length === 0 || seen.has(value)) {
      return;
    }
    seen.add(value);
    result.push(value);
  });

  return result;
};

export const buildTourAssetManifest = (tourData, assetUrls) => {
  const sceneImageUrls = toUniqueStringArray(
    (tourData?.scenes || []).map((scene) => scene?.imageUrl),
  );

  const floorplanUrl =
    typeof assetUrls?.floorplan === "string" && assetUrls.floorplan.length > 0
      ? assetUrls.floorplan
      : null;

  const allUrls = toUniqueStringArray(
    floorplanUrl ? [...sceneImageUrls, floorplanUrl] : sceneImageUrls,
  );

  return {
    allUrls,
    sceneImageUrls,
    floorplanUrl,
    totalFiles: allUrls.length,
  };
};

export const preloadTourAssetsWithProgress = async ({
  urls,
  signal,
  onProgress,
}) => {
  const manifestUrls = toUniqueStringArray(urls || []);
  const totalFiles = manifestUrls.length;
  const urlMap = new Map();

  if (totalFiles === 0) {
    return {
      urlMap,
      loadedBytes: 0,
      totalBytes: 0,
      completedFiles: 0,
      totalFiles: 0,
      hasError: false,
      revokeObjectUrls: () => {},
    };
  }

  let loadedBytes = 0;
  let totalBytes = 0;
  let completedFiles = 0;
  let hasError = false;

  const report = () => {
    if (typeof onProgress !== "function") {
      return;
    }

    onProgress({
      loadedBytes,
      totalBytes,
      completedFiles,
      totalFiles,
      hasError,
    });
  };

  report();

  const readAsBlobWithProgress = async (response) => {
    if (!response.body) {
      const blob = await response.blob();
      const size = blob.size || 0;
      if (size > 0) {
        loadedBytes += size;
      }
      report();
      return blob;
    }

    const reader = response.body.getReader();
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      if (value) {
        chunks.push(value);
        loadedBytes += value.byteLength;
        report();
      }
    }

    return new Blob(chunks);
  };

  const loadSingleAsset = async (url) => {
    let hasKnownTotal = false;
    let knownTotal = 0;

    try {
      const response = await fetch(url, {
        signal,
        cache: "force-cache",
      });

      if (!response.ok) {
        throw new Error(`Failed to load asset: ${url}`);
      }

      knownTotal = parseContentLength(response);
      if (knownTotal > 0) {
        hasKnownTotal = true;
        totalBytes += knownTotal;
        report();
      }

      const blob = await readAsBlobWithProgress(response);
      const finalSize = blob.size || 0;

      if (!hasKnownTotal && finalSize > 0) {
        totalBytes += finalSize;
      }

      urlMap.set(url, URL.createObjectURL(blob));
    } catch (error) {
      hasError = true;
      urlMap.set(url, url);
    } finally {
      completedFiles += 1;
      report();
    }
  };

  await Promise.all(manifestUrls.map((url) => loadSingleAsset(url)));

  const revokeObjectUrls = () => {
    urlMap.forEach((value) => {
      if (typeof value === "string" && value.startsWith("blob:")) {
        URL.revokeObjectURL(value);
      }
    });
  };

  return {
    urlMap,
    loadedBytes,
    totalBytes,
    completedFiles,
    totalFiles,
    hasError,
    revokeObjectUrls,
  };
};
