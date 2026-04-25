/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the OAuth broker (no trailing slash), e.g. http://localhost:3847 */
  readonly VITE_FIGMA_OAUTH_BACKEND_URL: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
