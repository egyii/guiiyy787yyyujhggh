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
          "Check your inbox — we sent a verification link. Confirm it, then sign in to bank XP.",
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

  return (
    <ArenaShell>
      <div className="mx-auto w-full max-w-md space-y-6">
        <header className="space-y-2 text-center">
          <h1 className="font-display text-3xl font-extrabold">
            {mode === "signup" ? "Join the Arena" : "Welcome back"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "signup"
              ? "Verify your email to bank XP and climb the ranks."
              : "Sign in to keep your streak alive."}
          </p>
        </header>

        <div className="flex rounded-2xl bg-surface p-1 ring-1 ring-border">
          {(["signup", "signin"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 rounded-xl py-2 text-xs font-bold tracking-widest uppercase ${
                mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {m === "signup" ? "Sign up" : "Sign in"}
            </button>
          ))}
        </div>

        <form
          onSubmit={submit}
          className="space-y-3 rounded-[24px] bg-surface p-5 ring-1 ring-border"
        >
          {mode === "signup" && (
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Player name"
              className="w-full rounded-xl bg-secondary/60 px-4 py-3 text-sm ring-1 ring-border outline-none focus:ring-primary"
            />
          )}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full rounded-xl bg-secondary/60 px-4 py-3 text-sm ring-1 ring-border outline-none focus:ring-primary"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-xl bg-secondary/60 px-4 py-3 text-sm ring-1 ring-border outline-none focus:ring-primary"
          />

          {error && <p className="text-xs font-medium text-destructive">{error}</p>}
          {message && <p className="text-xs font-medium text-accent">{message}</p>}

          <button
            type="submit"
            disabled={busy}
            className="press w-full rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            {busy ? "Working..." : mode === "signup" ? "Create account" : "Sign in"}
          </button>

          <button
            type="button"
            onClick={google}
            className="press w-full rounded-2xl bg-secondary py-3 text-sm font-bold text-secondary-foreground ring-1 ring-border"
          >
            Continue with Google
          </button>
        </form>
      </div>
    </ArenaShell>
  );
}
