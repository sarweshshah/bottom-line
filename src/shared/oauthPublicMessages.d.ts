declare module "@shared/oauthPublicMessages.mjs" {
  export interface MapOAuthErrorOptions {
    fallback?: string;
    includeBrowserErrors?: boolean;
  }
  export function mapOAuthErrorToPublicMessage(
    message: unknown,
    options?: MapOAuthErrorOptions,
  ): string;
}
