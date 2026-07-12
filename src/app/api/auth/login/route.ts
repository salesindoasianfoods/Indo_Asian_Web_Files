import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@sanity/client";

export const runtime = "nodejs";

async function getSitePassword(): Promise<string | null> {
  // Primary: read directly from env var (no Sanity fetch, works immediately on Vercel)
  const envPassword = process.env.SITE_PASSWORD?.trim();
  if (envPassword) return envPassword;

  // Fallback: fetch from Sanity sitePassword document
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim();

  if (!projectId || !dataset) return null;

  try {
    const sanityClient = createClient({
      projectId,
      dataset,
      apiVersion: "2024-01-01",
      useCdn: false,
    });
    const doc = await sanityClient.fetch<{ password: string } | null>(
      `*[_type == "sitePassword"][0]{ password }`
    );
    return doc?.password?.trim() ?? null;
  } catch (err) {
    console.error("[auth/login] Sanity fetch failed:", err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const password = typeof body.password === "string" ? body.password.trim() : "";

    if (!password) {
      return NextResponse.json({ error: "Password required" }, { status: 400 });
    }

    const sitePassword = await getSitePassword();

    if (!sitePassword) {
      console.error(
        "[auth/login] No password configured. Set SITE_PASSWORD in Vercel env vars, " +
        "or create a sitePassword document in Sanity Studio."
      );
      return NextResponse.json(
        {
          error:
            "Site password not configured. " +
            "Add SITE_PASSWORD to your Vercel environment variables.",
        },
        { status: 500 }
      );
    }

    if (password !== sitePassword) {
      return NextResponse.json(
        { error: "Incorrect password. Please try again." },
        { status: 401 }
      );
    }

    const secret = process.env.SITE_AUTH_SECRET?.trim();
    if (!secret) {
      console.error("[auth/login] SITE_AUTH_SECRET is not set in environment variables.");
      return NextResponse.json(
        { error: "Server misconfiguration: SITE_AUTH_SECRET missing from environment." },
        { status: 500 }
      );
    }

    const res = NextResponse.json({ ok: true }, { status: 200 });
    res.cookies.set("site_auth", secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (err) {
    console.error("[auth/login] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
