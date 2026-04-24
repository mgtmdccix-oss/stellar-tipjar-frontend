/**
 * Deep link handler for Stellar Tip Jar.
 *
 * Resolves incoming URLs (from mobile apps, emails, QR codes, share sheets)
 * to internal Next.js routes, with validation and analytics tracking.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type DeepLinkRoute =
  | { type: "creator"; username: string; path: string }
  | { type: "tip"; tipId: string; path: string }
  | { type: "explore"; path: string }
  | { type: "tips"; path: string }
  | { type: "widgets"; path: string }
  | { type: "home"; path: string }
  | { type: "unknown"; path: string };

export interface DeepLinkAnalyticsEvent {
  path: string;
  type: DeepLinkRoute["type"];
  source: string;
  timestamp: number;
}

// ─── Validation ───────────────────────────────────────────────────────────────

const USERNAME_RE = /^[a-zA-Z0-9_-]{1,39}$/;
const TIP_ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;

function isValidUsername(username: string): boolean {
  return USERNAME_RE.test(username);
}

function isValidTipId(tipId: string): boolean {
  return TIP_ID_RE.test(tipId);
}

// ─── Analytics ────────────────────────────────────────────────────────────────

type AnalyticsCallback = (event: DeepLinkAnalyticsEvent) => void;
const analyticsListeners = new Set<AnalyticsCallback>();

export function onDeepLinkAnalytics(cb: AnalyticsCallback): () => void {
  analyticsListeners.add(cb);
  return () => analyticsListeners.delete(cb);
}

function trackDeepLink(event: DeepLinkAnalyticsEvent): void {
  analyticsListeners.forEach((cb) => cb(event));

  // Console log in dev for easy debugging
  if (process.env.NODE_ENV === "development") {
    console.debug("[DeepLink]", event);
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────

/**
 * Parse and validate a deep link URL, returning the resolved internal route.
 *
 * @param url - Full URL string (e.g. "https://stellartipjar.app/creator/alice?ref=email")
 * @param source - Where the link came from ("email" | "share" | "qr" | "app" | etc.)
 * @returns Resolved DeepLinkRoute
 */
export function handleDeepLink(url: string, source = "unknown"): DeepLinkRoute {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    // Relative path — wrap with a dummy base
    try {
      parsed = new URL(url, "https://stellartipjar.app");
    } catch {
      const fallback: DeepLinkRoute = { type: "unknown", path: "/" };
      trackDeepLink({ path: url, type: "unknown", source, timestamp: Date.now() });
      return fallback;
    }
  }

  const path = parsed.pathname.replace(/\/$/, "") || "/";
  const segments = path.split("/").filter(Boolean);

  let route: DeepLinkRoute;

  if (segments[0] === "creator" && segments[1]) {
    const username = decodeURIComponent(segments[1]);
    if (isValidUsername(username)) {
      route = { type: "creator", username, path: `/creator/${username}` };
    } else {
      route = { type: "unknown", path: "/" };
    }
  } else if (segments[0] === "tip" && segments[1]) {
    const tipId = decodeURIComponent(segments[1]);
    if (isValidTipId(tipId)) {
      route = { type: "tip", tipId, path: `/tip/${tipId}` };
    } else {
      route = { type: "unknown", path: "/" };
    }
  } else if (path === "/explore") {
    route = { type: "explore", path: "/explore" };
  } else if (path === "/tips") {
    route = { type: "tips", path: "/tips" };
  } else if (path === "/widgets") {
    route = { type: "widgets", path: "/widgets" };
  } else if (path === "/" || path === "") {
    route = { type: "home", path: "/" };
  } else {
    route = { type: "unknown", path: "/" };
  }

  trackDeepLink({ path, type: route.type, source, timestamp: Date.now() });
  return route;
}

/**
 * Build a shareable deep link URL for a given internal path.
 * Appends a utm_source parameter for analytics attribution.
 */
export function buildShareUrl(
  path: string,
  source: "share_sheet" | "copy_link" | "qr" | "email" = "share_sheet",
  baseUrl = "https://stellartipjar.app",
): string {
  const url = new URL(path, baseUrl);
  url.searchParams.set("utm_source", source);
  url.searchParams.set("utm_medium", "deep_link");
  return url.toString();
}

/**
 * Attempt to use the Web Share API, falling back to clipboard copy.
 * Returns true if the native share sheet was used.
 */
export async function shareDeepLink(
  path: string,
  title: string,
  text: string,
): Promise<boolean> {
  const url = buildShareUrl(path, "share_sheet");

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch {
      // User cancelled or share failed — fall through to clipboard
    }
  }

  if (typeof navigator !== "undefined" && navigator.clipboard) {
    await navigator.clipboard.writeText(buildShareUrl(path, "copy_link"));
  }

  return false;
}
