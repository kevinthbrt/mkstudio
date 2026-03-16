import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  const origin = requestUrl.origin;

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );
    const { data: sessionData } = await supabase.auth.exchangeCodeForSession(code);

    // Detect password recovery flow and redirect to reset-password page
    const isRecovery = sessionData.session?.user?.recovery_sent_at &&
      Date.now() - new Date(sessionData.session.user.recovery_sent_at).getTime() < 600_000;
    if (isRecovery && next === "/dashboard") {
      return NextResponse.redirect(`${origin}/reset-password`);
    }

    // Ensure profile exists (fallback if the DB trigger didn't fire)
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!existingProfile) {
        await supabase.from("profiles").insert({
          user_id: user.id,
          first_name: user.user_metadata?.first_name || "",
          last_name: user.user_metadata?.last_name || "",
          email: user.email || "",
          role: user.user_metadata?.role || "member",
        });
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
