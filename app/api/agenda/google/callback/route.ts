import { NextRequest, NextResponse } from "next/server";
import { completarGoogleOAuth } from "@/src/modules/agenda/actions";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");
  const base = process.env.APP_URL ?? "http://localhost:3047";
  const dest = `${base}/conta/integracoes`;

  if (error) {
    return NextResponse.redirect(`${dest}?google=erro&msg=${encodeURIComponent(error)}`);
  }
  if (!code || !state) {
    return NextResponse.redirect(`${dest}?google=erro&msg=callback_incompleto`);
  }

  try {
    await completarGoogleOAuth(code, state);
    return NextResponse.redirect(`${dest}?google=ok`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "falha";
    return NextResponse.redirect(`${dest}?google=erro&msg=${encodeURIComponent(msg)}`);
  }
}
