export interface SiteUrlContext {
  site?: URL;
  url: URL;
}

// Prefer configured site URL and fall back to current request URL origin.
export function getSiteBaseURL(context: SiteUrlContext): URL {
  if (context.site) {
    return context.site;
  }
  return new URL(context.url.origin);
}

export function toPageURL(pathname: string, context: SiteUrlContext): URL {
  return new URL(pathname, getSiteBaseURL(context));
}

export function toAssetURL(pathOrUrl: string, context: SiteUrlContext): URL {
  return new URL(pathOrUrl, getSiteBaseURL(context));
}
