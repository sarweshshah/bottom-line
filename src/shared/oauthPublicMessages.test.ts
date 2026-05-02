import { describe, expect, it } from "vitest";
import { mapOAuthErrorToPublicMessage } from "@shared/oauthPublicMessages.mjs";

describe("mapOAuthErrorToPublicMessage", () => {
  describe("broker mode (includeBrowserErrors omitted)", () => {
    it("maps invalid_client and server misconfiguration", () => {
      expect(mapOAuthErrorToPublicMessage("401 invalid_client")).toBe(
        "Sign-in is temporarily unavailable. Please try again later.",
      );
      expect(mapOAuthErrorToPublicMessage("server missing figma_client_id")).toBe(
        "Sign-in is temporarily unavailable. Please try again later.",
      );
    });

    it("maps OAuth callback and session errors", () => {
      expect(mapOAuthErrorToPublicMessage("invalid oauth callback")).toBe(
        "Sign-in could not be completed. Please try again.",
      );
      expect(mapOAuthErrorToPublicMessage("unknown session")).toBe(
        "Your sign-in session expired. Please start again.",
      );
    });

    it("maps refresh and token exchange errors", () => {
      expect(mapOAuthErrorToPublicMessage("refresh_token required")).toBe(
        "Your session could not be refreshed. Please sign in again.",
      );
      expect(mapOAuthErrorToPublicMessage("figma refresh error")).toBe(
        "Your session could not be refreshed. Please sign in again.",
      );
      expect(mapOAuthErrorToPublicMessage("token exchange failed")).toBe(
        "Sign-in could not be completed. Please try again.",
      );
      expect(mapOAuthErrorToPublicMessage("oauth failed")).toBe(
        "Sign-in could not be completed. Please try again.",
      );
    });

    it("does not apply browser-only matchers", () => {
      expect(
        mapOAuthErrorToPublicMessage("failed to fetch", {
          fallback: "Broker fallback.",
        }),
      ).toBe("Broker fallback.");
    });

    it("uses broker fallback when nothing matches", () => {
      expect(mapOAuthErrorToPublicMessage("weird internal xyz")).toBe(
        "Request failed. Please try again.",
      );
      expect(
        mapOAuthErrorToPublicMessage("weird internal xyz", {
          fallback: "Custom broker fallback.",
        }),
      ).toBe("Custom broker fallback.");
    });
  });

  describe("browser mode (includeBrowserErrors: true)", () => {
    it("maps fetch and origin errors before shared rules", () => {
      expect(
        mapOAuthErrorToPublicMessage("TypeError: Failed to fetch", {
          includeBrowserErrors: true,
        }),
      ).toBe(
        "Could not start sign-in right now. Please check your connection and try again.",
      );
      expect(
        mapOAuthErrorToPublicMessage(
          "NetworkError when attempting to fetch resource.",
          { includeBrowserErrors: true },
        ),
      ).toBe(
        "Could not start sign-in right now. Please check your connection and try again.",
      );
      expect(
        mapOAuthErrorToPublicMessage("origin not allowed", {
          includeBrowserErrors: true,
        }),
      ).toBe("Sign-in is blocked for this environment. Please contact support.");
    });

    it("still applies shared rules after browser checks", () => {
      expect(
        mapOAuthErrorToPublicMessage("invalid_client", { includeBrowserErrors: true }),
      ).toBe("Sign-in is temporarily unavailable. Please try again later.");
    });

    it("maps authorization timed out", () => {
      expect(
        mapOAuthErrorToPublicMessage("authorization timed out please retry", {
          includeBrowserErrors: true,
        }),
      ).toBe(
        "Sign-in timed out. Please try again and complete authorization in your browser.",
      );
    });

    it("uses browser default fallback when nothing matches", () => {
      expect(
        mapOAuthErrorToPublicMessage("opaque-plugin-error", {
          includeBrowserErrors: true,
        }),
      ).toBe("Sign in with Figma failed. Please try again.");
    });
  });
});
