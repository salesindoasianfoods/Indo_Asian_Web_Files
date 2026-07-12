import { NextRequest, NextResponse } from "next/server";

export async function POST(_req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("site_auth", "", { maxAge: 0, path: "/" });
  return res;
}
