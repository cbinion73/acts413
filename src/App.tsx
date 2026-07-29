import { FormEvent, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { hasSupabaseConfig, supabase } from "./lib/supabase";

type Mode = "sign-in" | "sign-up";

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<Mode>("sign-up");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    void supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setBusy(true);

    if (!supabase) {
      setMessage("Connect the Supabase environment variables before using account access.");
      setBusy(false);
      return;
    }

    const result = mode === "sign-in"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              marketing_consent: marketingConsent,
              marketing_consent_version: "2026-07-28-v1",
            },
          },
        });

    if (result.error) {
      setMessage(result.error.message);
    } else if (mode === "sign-up") {
      setMessage("Account created. Check your email if verification is required, then sign in.");
      setMode("sign-in");
    } else {
      setMessage("Welcome back.");
    }

    setBusy(false);
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setMessage("You are signed out.");
  }

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <p className="eyebrow">ACTS 4:13</p>
        <h1>Keep your eyes on Jesus.</h1>
        <p className="hero-copy">
          Peter began to sink when he saw the storm around him. We have storms around us too. Where will we look? Where will we turn? Jesus is our rescue. Create a free account for guided reflections and simple practices that help you keep your eyes on Him. Join ordinary people being rescued, formed, and sent.
        </p>
        <div className="hero-note">
          <span className="note-mark">✦</span>
          <span>Create a free account. Keep your eyes on Jesus.</span>
        </div>
      </section>

      <section className="account-panel" aria-labelledby="account-heading">
        {user ? (
          <div className="signed-in-state">
            <p className="eyebrow">YOUR ROOM</p>
            <h2 id="account-heading">Welcome in.</h2>
            <p className="muted">Signed in as {user.email}.</p>
            <div className="private-card">
              <span className="card-kicker">PRIVATE BY DEFAULT</span>
              <p>Your saved reflections, practices, and downloads will live here.</p>
            </div>
            <button className="button secondary" onClick={() => void signOut()} type="button">
              Sign out
            </button>
          </div>
        ) : (
          <>
            <div className="account-heading-row">
              <div>
                <p className="eyebrow">FREE ACCOUNT</p>
                <h2 id="account-heading">Start here.</h2>
              </div>
              <span className="status-dot" aria-label="Private account access" />
            </div>

            <p className="account-intro">
              Create a free account to save your reflections, follow guided journeys, and return to your next faithful step whenever you’re ready.
            </p>

            {!hasSupabaseConfig && (
              <div className="setup-warning" role="status">
                Account access is ready, but the local Supabase environment variables are not connected yet.
              </div>
            )}

            <div className="mode-toggle" role="group" aria-label="Account action">
              <button className={mode === "sign-in" ? "active" : ""} onClick={() => setMode("sign-in")} type="button">
                Sign in
              </button>
              <button className={mode === "sign-up" ? "active" : ""} onClick={() => setMode("sign-up")} type="button">
                Create account
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label htmlFor="email">Email</label>
              <input id="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
              <label htmlFor="password">Password</label>
              <input id="password" minLength={8} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
              {mode === "sign-up" && (
                <label className="consent-row" htmlFor="marketing-consent">
                  <input
                    checked={marketingConsent}
                    id="marketing-consent"
                    onChange={(event) => setMarketingConsent(event.target.checked)}
                    type="checkbox"
                  />
                  <span>Yes, send me occasional ACTS413 emails about new reflections, guided journeys, and releases.</span>
                </label>
              )}
              <button className="button primary" disabled={busy} type="submit">
                {busy ? "Working…" : mode === "sign-in" ? "Return to your room" : "Take the next step"}
              </button>
            </form>

            {message && <p className="form-message" role="status">{message}</p>}
            <p className="privacy-note">Your account is free. Marketing email is optional, and you can unsubscribe at any time. A full privacy notice will be available before launch.</p>
          </>
        )}
      </section>
    </main>
  );
}
