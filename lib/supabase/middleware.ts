import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./types";

const PUBLIC_PATHS = ["/", "/login", "/signup"];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/join/")) return true;
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) return true;
  return false;
}

// Runs on every matched request: refreshes the Supabase session cookie (required by
// @supabase/ssr so server components see a valid session instead of a stale/expired one),
// then applies auth + role gating. Mutate `supabaseResponse`, not a fresh NextResponse, so the
// refreshed cookies actually ride along on the response that reaches the browser.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const home = profile?.role === "teacher" ? "/teacher" : "/student";
    return NextResponse.redirect(new URL(home, request.url));
  }

  if (user && (pathname.startsWith("/teacher") || pathname.startsWith("/student"))) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "student" && pathname.startsWith("/teacher")) {
      return NextResponse.redirect(new URL("/student", request.url));
    }
    if (profile?.role === "teacher" && pathname.startsWith("/student")) {
      return NextResponse.redirect(new URL("/teacher", request.url));
    }
  }

  return supabaseResponse;
}
