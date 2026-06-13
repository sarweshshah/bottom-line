import { useState, useCallback, type MouseEvent } from "react";
import {
  Eye,
  EyeOff,
  ExternalLink,
  CheckCircle2,
  Loader2,
  Link,
  ShieldCheck,
  Info,
  Check,
  X,
  LogOut,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  MessageSquare,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { FieldError } from "@ui/components/common/FieldError";
import { UserAvatar } from "@ui/components/common/UserAvatar";
import { useAuthStore } from "@ui/store/authStore";
import { parseFileKey, isValidFigmaUrl } from "@ui/lib/parseFileUrl";
import {
  isFigmaOAuthConfigured,
  beginOAuthSession,
  pollOAuthUntilComplete,
} from "@ui/lib/figmaOAuth";
import { openExternalUrl } from "@ui/lib/openExternal";
import {
  FIGMA_PAT_HELP_URL,
  FIGMA_PAT_REQUIRED_SCOPES,
} from "@shared/figmaPat";
import pluginLogo from "@ui/assets/plugin-logo.png";

const PAT_TRANSPARENCY_ITEMS = [
  { allow: true, label: "Read comment threads" },
  { allow: true, label: "Read user profiles" },
  { allow: true, label: "Navigate to comments" },
  { allow: false, label: "Modify your designs" },
  { allow: false, label: "Store token externally" },
  { allow: false, label: "Share data with others" },
] as const;

const PAT_INFO_TOOLTIP_CLASSNAME = [
  "pointer-events-none absolute left-1/2 top-full z-50 mt-1 w-max max-w-[min(260px,calc(100vw-2.5rem))] -translate-x-1/2",
  "scale-95 opacity-0 transition duration-150",
  "rounded-lg border border-white/[0.18] bg-figma-text py-2 pl-2.5 pr-3.5 text-left font-normal text-figma-bg shadow-[0_4px_20px_rgba(0,0,0,0.22)] [html.figma-dark_&]:border-black/[0.14]",
  "group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100",
  "group-focus-within:pointer-events-auto group-focus-within:scale-100 group-focus-within:opacity-100",
].join(" ");

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Smart Threads",
    desc: "See all comment threads organized by status",
  },
  {
    icon: Sparkles,
    title: "AI Summaries",
    desc: "Get instant summaries of long discussions",
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    desc: "Track resolved vs open comments at a glance",
  },
];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === current
              ? "w-6 bg-accent"
              : i < current
                ? "w-1.5 bg-accent/50"
                : "w-1.5 bg-figma-border"
          }`}
        />
      ))}
    </div>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="onboarding-step-enter flex flex-col items-center text-center h-full">
      <div className="flex-1 flex flex-col items-center justify-center px-5">
        <div className="onboarding-logo-glow mb-6 rounded-2xl">
          <img
            src={pluginLogo}
            alt="Bottom Line"
            className="h-20 w-20 rounded-2xl object-cover"
          />
        </div>

        <h1 className="text-xl font-bold text-figma-text mb-2">
          Welcome to Bottom Line
        </h1>
        <p className="text-sm text-figma-text-secondary mb-8 max-w-[260px] leading-relaxed">
          AI-powered comment intelligence for your Figma design files.
        </p>

        <div className="w-full max-w-[260px] space-y-3 mb-8">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex items-start gap-3 text-left p-2.5 rounded-lg bg-figma-bg-secondary/60 border border-figma-border/50"
            >
              <div className="mt-0.5 p-1.5 rounded-lg bg-accent/10">
                <Icon size={14} className="text-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-figma-text">{title}</p>
                <p className="text-[11px] text-figma-text-tertiary leading-snug mt-0.5">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full px-5 py-4">
        <StepIndicator current={0} total={3} />
        <button
          type="button"
          onClick={onNext}
          className="w-full mt-3 py-2.5 rounded-lg text-sm font-medium transition-colors bg-accent-bg text-white hover:bg-accent-hover active:bg-accent-hover flex items-center justify-center gap-2"
        >
          Get Started
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

function ConnectStep({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const oauthAvailable = isFigmaOAuthConfigured();
  const {
    validateAndSetToken,
    applyOAuthSession,
    isValidating,
    validationError,
    user,
    authMethod,
  } = useAuthStore();

  const [pat, setPat] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [showPatAdvanced, setShowPatAdvanced] = useState(!oauthAvailable);
  const [oauthBusy, setOauthBusy] = useState(false);

  const handleTokenChange = useCallback(
    async (value: string) => {
      setPat(value);
      if (!value.trim()) return;
      try {
        await validateAndSetToken(value.trim());
      } catch {
        /* validationError in store */
      }
    },
    [validateAndSetToken],
  );

  const handleSignInWithFigma = useCallback(async () => {
    useAuthStore.setState({ validationError: null });
    setOauthBusy(true);
    try {
      const { sessionId, authorizeUrl } = await beginOAuthSession();
      openExternalUrl(authorizeUrl);
      const result = await pollOAuthUntilComplete(sessionId);
      await applyOAuthSession({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        expires_in: result.expires_in,
      });
      setPat("");
    } catch (e) {
      useAuthStore.setState({
        validationError:
          e instanceof Error ? e.message : "Sign in with Figma failed.",
      });
    } finally {
      setOauthBusy(false);
    }
  }, [applyOAuthSession]);

  return (
    <div className="onboarding-step-enter flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-accent/10">
            <ShieldCheck size={18} className="text-accent" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-figma-text">
              Connect to Figma
            </h2>
            <p className="text-xs text-figma-text-tertiary">
              Step 1 of 2 &middot; Sign in to access your comments
            </p>
          </div>
        </div>

        {oauthAvailable && !user && (
          <div className="mb-3">
            <button
              type="button"
              disabled={oauthBusy || isValidating}
              onClick={() => void handleSignInWithFigma()}
              className="w-full py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-figma-bg-secondary border border-figma-border text-figma-text hover:bg-figma-bg-tertiary hover:border-figma-border-strong"
            >
              {oauthBusy ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Waiting for browser…
                </span>
              ) : (
                "Sign in with Figma"
              )}
            </button>
            <p className="text-[10px] text-figma-text-tertiary mt-1.5 text-center">
              Opens your browser to sign in. Return here when the tab says you
              can close it.
            </p>
          </div>
        )}

        {oauthAvailable && (
          <button
            type="button"
            onClick={() => setShowPatAdvanced((v) => !v)}
            className="flex items-center gap-1 text-xs text-accent hover:underline mb-2"
          >
            {showPatAdvanced ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
            Use a personal access token instead
          </button>
        )}

        {showPatAdvanced && (
          <>
            <h3 className="text-xs font-medium text-figma-text-secondary mb-2 flex items-center gap-1.5 flex-wrap">
              Personal access token
              <span className="relative inline-flex group">
                <button
                  type="button"
                  className="rounded p-0.5 text-figma-icon-tertiary hover:text-figma-icon-secondary focus:outline-none focus-visible:ring-1 focus-visible:ring-accent-ring"
                  aria-label="What your token is used for"
                  aria-describedby="pat-token-transparency"
                >
                  <Info size={13} strokeWidth={2} aria-hidden />
                </button>
                <div
                  id="pat-token-transparency"
                  className={PAT_INFO_TOOLTIP_CLASSNAME}
                  role="tooltip"
                >
                  <ul className="space-y-0.5 text-[10px] leading-tight text-figma-bg">
                    {PAT_TRANSPARENCY_ITEMS.map(({ allow, label }) => (
                      <li key={label} className="flex items-start gap-1.5">
                        {allow ? (
                          <Check
                            size={10}
                            strokeWidth={2.5}
                            className="mt-[2px] shrink-0 text-status-resolved"
                            aria-hidden
                          />
                        ) : (
                          <X
                            size={10}
                            strokeWidth={2.5}
                            className="mt-[2px] shrink-0 text-danger"
                            aria-hidden
                          />
                        )}
                        <span className="min-w-0">{label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </span>
            </h3>

            <div className="text-xs text-figma-text-secondary mb-3 space-y-1.5">
              <p className="font-medium text-figma-text-secondary">
                How to get your token:
              </p>
              <p className="text-figma-text-tertiary">
                Follow Figma&apos;s guide to create a token named &quot;Bottom
                Line&quot; and enable these permissions:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-figma-text-tertiary">
                {FIGMA_PAT_REQUIRED_SCOPES.map((scope) => (
                  <li key={scope}>
                    <code className="font-mono text-xs">{scope}</code>
                  </li>
                ))}
              </ul>
              <p className="text-figma-text-tertiary">
                Copy the token and paste it below.
              </p>
              <a
                href={FIGMA_PAT_HELP_URL}
                className="inline-flex items-center gap-1 text-accent hover:underline text-xs mt-1"
                onClick={(e: MouseEvent<HTMLAnchorElement>) => {
                  e.preventDefault();
                  openExternalUrl(FIGMA_PAT_HELP_URL);
                }}
              >
                How to generate a personal access token
                <ExternalLink size={10} />
              </a>
            </div>

            <div className="flex flex-col gap-2">
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  value={pat}
                  onChange={(e) => void handleTokenChange(e.target.value)}
                  placeholder="figd_xxxxxxxxxxxxxxxx"
                  className="w-full bg-figma-bg-secondary border border-figma-border rounded-lg px-3 py-2 pr-9 text-xs text-figma-text placeholder:text-figma-text-disabled focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-figma-icon-tertiary hover:text-figma-icon-secondary"
                >
                  {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {isValidating && authMethod !== "oauth" && (
                <div className="flex items-center gap-1.5 text-xs text-figma-text-secondary">
                  <Loader2 size={12} className="animate-spin" />
                  Validating token...
                </div>
              )}
              {user && authMethod === "pat" && (
                <div className="flex items-center gap-1.5 text-xs text-status-resolved">
                  <CheckCircle2 size={12} />
                  Connected as {user.handle}
                </div>
              )}
            </div>
          </>
        )}

        {user && (
          <div className="mt-3 bg-figma-bg-secondary border border-figma-border rounded-lg p-3">
            <div className="flex items-center gap-3">
              <UserAvatar
                handle={user.handle}
                imgUrl={user.img_url}
                colorKey={user.id}
                size={40}
                className="border border-figma-border"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-figma-text truncate">
                  {user.handle}
                </p>
                <p className="text-xs text-figma-text-tertiary mt-0.5 truncate">
                  {authMethod === "oauth"
                    ? "Signed in with Figma"
                    : "Using personal access token"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void useAuthStore.getState().logout()}
                className="p-2 rounded-lg text-figma-icon-tertiary hover:bg-danger-bg hover:text-danger transition-colors shrink-0"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>

            {authMethod === "oauth" && oauthAvailable && (
              <button
                type="button"
                disabled={oauthBusy || isValidating}
                onClick={() => void handleSignInWithFigma()}
                className="w-full mt-3 py-2 rounded-lg text-xs font-medium bg-figma-bg border border-figma-border text-figma-text hover:bg-figma-bg-tertiary disabled:opacity-40"
              >
                {oauthBusy ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Loader2 size={12} className="animate-spin" />
                    Waiting for browser…
                  </span>
                ) : (
                  "Sign in again with Figma"
                )}
              </button>
            )}
          </div>
        )}

        {validationError && (
          <div className="mt-2">
            <FieldError>{validationError}</FieldError>
          </div>
        )}
      </div>

      <div className="px-5 py-4 border-t border-figma-border">
        <StepIndicator current={1} total={3} />
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 rounded-lg text-sm font-medium transition-colors bg-figma-bg-secondary border border-figma-border text-figma-text hover:bg-figma-bg-tertiary"
          >
            <ArrowLeft size={14} />
          </button>
          <button
            type="button"
            disabled={!user}
            onClick={onNext}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-accent-bg text-white hover:bg-accent-hover active:bg-accent-hover flex items-center justify-center gap-2"
          >
            Continue
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function LinkFileStep({
  onBack,
  onFinish,
}: {
  onBack: () => void;
  onFinish: () => void;
}) {
  const { user, setFileInfo, completeSetup, isValidating } = useAuthStore();

  const [fileUrl, setFileUrl] = useState("");
  const [fileKey, setFileKey] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);

  const handleUrlChange = useCallback((value: string) => {
    setFileUrl(value);
    setUrlError(null);

    if (!value.trim()) {
      setFileKey(null);
      return;
    }

    if (!isValidFigmaUrl(value)) {
      setUrlError("Please enter a valid Figma file URL.");
      setFileKey(null);
      return;
    }

    const key = parseFileKey(value);
    setFileKey(key);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!user || !fileKey) return;
    await setFileInfo(fileUrl, fileKey);
    completeSetup();
    onFinish();
  }, [user, fileKey, fileUrl, setFileInfo, completeSetup, onFinish]);

  const canSubmit = !!user && !!fileKey && !isValidating;

  return (
    <div className="onboarding-step-enter flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-accent/10">
            <Link size={18} className="text-accent" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-figma-text">
              Link Your File
            </h2>
            <p className="text-xs text-figma-text-tertiary">
              Step 2 of 2 &middot; Choose which file to analyze
            </p>
          </div>
        </div>

        <p className="text-xs text-figma-text-secondary mb-4 leading-relaxed">
          Paste the URL of the Figma file you want to analyze comments for.
          You can change this later in Settings.
        </p>

        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={fileUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://www.figma.com/design/abc123/..."
            className="w-full bg-figma-bg-secondary border border-figma-border rounded-lg px-3 py-2.5 text-xs text-figma-text placeholder:text-figma-text-disabled focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-ring"
          />
          {urlError && <FieldError>{urlError}</FieldError>}
          {fileKey && !urlError && (
            <div className="flex items-center gap-1.5 text-xs text-status-resolved">
              <CheckCircle2 size={12} />
              File key detected
            </div>
          )}
        </div>

        {fileKey && !urlError && (
          <div className="mt-6 p-4 rounded-lg onboarding-hero-gradient border border-figma-border/50 text-center">
            <CheckCircle2
              size={28}
              className="text-accent mx-auto mb-2"
            />
            <p className="text-sm font-medium text-figma-text mb-1">
              You&apos;re all set!
            </p>
            <p className="text-xs text-figma-text-tertiary">
              Hit the button below to start exploring your comments.
            </p>
          </div>
        )}
      </div>

      <div className="px-5 py-4 border-t border-figma-border">
        <StepIndicator current={2} total={3} />
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 rounded-lg text-sm font-medium transition-colors bg-figma-bg-secondary border border-figma-border text-figma-text hover:bg-figma-bg-tertiary"
          >
            <ArrowLeft size={14} />
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => void handleSubmit()}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-accent-bg text-white hover:bg-accent-hover active:bg-accent-hover flex items-center justify-center gap-2"
          >
            Launch Bottom Line
            <Sparkles size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function SetupScreen() {
  const [step, setStep] = useState(0);

  return (
    <div className="flex flex-col h-full bg-figma-bg onboarding-hero-gradient">
      {step === 0 && <WelcomeStep onNext={() => setStep(1)} />}
      {step === 1 && (
        <ConnectStep
          onNext={() => setStep(2)}
          onBack={() => setStep(0)}
        />
      )}
      {step === 2 && (
        <LinkFileStep
          onBack={() => setStep(1)}
          onFinish={() => {}}
        />
      )}
    </div>
  );
}
