/** Figma Help Center — generate and manage personal access tokens */
export const FIGMA_PAT_HELP_URL =
  "https://help.figma.com/hc/en-us/articles/8085703771159-Manage-personal-access-tokens";

/** Scopes required for Bottom Line (read comments, file context, current user) */
export const FIGMA_PAT_REQUIRED_SCOPES = [
  "current_user:read",
  "file_comments:read",
  "file_content:read",
] as const;
