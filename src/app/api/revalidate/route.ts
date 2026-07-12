import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.SANITY_REVALIDATE_SECRET;
    const providedSecret = req.headers.get("x-sanity-secret") ?? new URL(req.url).searchParams.get("secret");

    if (!secret || providedSecret !== secret) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    revalidatePath("/");
    return NextResponse.json({ ok: true, revalidated: true, now: Date.now() });
  } catch (error) {
    console.error("[api/revalidate] Failed to revalidate:", error);
    return NextResponse.json({ ok: false, error: "Revalidation failed" }, { status: 500 });
  }
}
