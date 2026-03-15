import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Return proper CORS response for preflight requests
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env vars are missing, fail closed — redirect to login for all protected routes
  if (!supabaseUrl || !supabaseAnonKey) {
    const pathname = request.nextUrl.pathname;
    const publicRoutes = ["/login", "/register", "/"];
    if (!publicRoutes.includes(pathname) && !pathname.startsWith("/api/cron/")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    const publicRoutes = ["/login", "/register", "/"];
    const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith("/api/cron/");
    const isAuthRoute = pathname === "/login" || pathname === "/register";

    if (!user && !isPublicRoute) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (user && isAuthRoute) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  } catch {
    // On error, redirect to login for protected routes
    const pathname = request.nextUrl.pathname;
    const publicRoutes = ["/login", "/register", "/"];
    if (!publicRoutes.includes(pathname) && !pathname.startsWith("/api/cron/")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
