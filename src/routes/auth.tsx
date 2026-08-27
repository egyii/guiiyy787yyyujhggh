import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArenaShell } from "@/components/arena-shell";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In or Create Account — QuizPulse" },
      {
        name: "description",
        content:
          "Create a QuizPulse account with email verification to bank XP, track streaks and join the global leaderboard.",
      },
      { property: "og:title", content: "Sign In or Create Account — QuizPulse" },
      { property: "og:description", content: "Join the arena and start banking XP." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useSession();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/stats", replace: true });
  }, [loading, user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    if (mode === "signup") {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { username: username || email.split("@")[0] },
        },
      });
      if (signUpError) setError(signUpError.message);
      else
        setMessage(
          "Check your inbox — we sent a verification link. Confirm it, then sign in to save XP.",
        );
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) setError(signInError.message);
      else navigate({ to: "/stats" });
    }
    setBusy(false);
  }

  async function google() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("Google sign-in failed. Try email instead.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/stats" });
  }

  const inputClass =
    "w-full rounded-2xl bg-secondary/60 px-4 py-3.5 text-[15px] outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40";

  return (
    <ArenaShell>
      <div className="mx-auto w-full max-w-md space-y-6">
        <header className="reveal space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-[15px] text-muted-foreground">
            {mode === "signup"
              ? "Verify your email to save XP and climb the leaderboard."
              : "Sign in to keep your streak going."}
          </p>
        </header>

        <div className="flex rounded-full bg-secondary/60 p-1">
          {(["signup", "signin"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`press flex-1 rounded-full py-2 text-sm font-medium ${
                mode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              {m === "signup" ? "Sign up" : "Sign in"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="card-soft space-y-3 rounded-[24px] p-6">
          {mode === "signup" && (
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Display name"
              autoComplete="nickname"
              className={inputClass}
            />
          )}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            autoComplete="email"
            className={inputClass}
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (6+ characters)"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className={inputClass}
          />

          {error && <p className="text-sm text-destructive">{error}</p>}
          {message && <p className="text-sm text-accent">{message}</p>}

          <button
            type="submit"
            disabled={busy}
            className="press w-full rounded-full bg-primary py-3.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {busy ? "Working…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>

          <div className="flex items-center gap-3 py-1 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            onClick={google}
            className="press w-full rounded-full bg-secondary py-3.5 text-sm font-medium"
          >
            Continue with Google
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          {mode === "signup"
            ? "Already have an account? Switch to Sign in above."
            : "New here? Switch to Sign up above."}
        </p>
      </div>
    </ArenaShell>
  );
}
