"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "./style.scss";
import brandLogo from "../../../public/icons/indo-asian-logo-main.png";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) { setError("Please enter the password."); return; }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      let data: { ok?: boolean; error?: string } = {};
      try { data = await res.json(); } catch { /* non-JSON response */ }

      if (!res.ok) {
        setError(data.error ?? `Login failed (HTTP ${res.status}). Please try again.`);
        return;
      }

      // Hard redirect so the middleware sees the new cookie immediately
      window.location.href = "/";
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : "Please check your connection."}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page-container-main flex min-h-[100dvh] w-full items-center justify-center bg-pure-white px-4">
      <div className="login-page-container w-full">
        <section className="login-card">
          <div className="login-card__brand">
            <Link href="/">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={brandLogo.src}
                alt="Indo Asian Foods"
                style={{ width: 63, height: 63, objectFit: 'contain', borderRadius: 8 }}
              />
            </Link>
          </div>

          <div className="login-card__content">
            <h1 className="login-card__title">INDO ASIAN FOODS LTD</h1>
            <p className="login-card__description">
              The store is password protected. Use the password to enter the store.
            </p>

            <form className="login-form" onSubmit={handleSubmit}>
              <label className="login-form__label" htmlFor="store-password">
                Password
              </label>

              <input
                id="store-password"
                className={`login-form__input ${error ? "has-error" : ""}`}
                type="password"
                placeholder="Enter the password here"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                disabled={loading}
                autoComplete="current-password"
              />

              {error && (
                <p className="login-form__error">{error}</p>
              )}

              <button
                className={`login-form__submit ${loading ? "is-loading" : ""}`}
                type="submit"
                disabled={loading}
              >
                {loading ? "Verifying…" : "Enter"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
//jkjlk