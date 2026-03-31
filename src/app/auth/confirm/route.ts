import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { sendWelcomeEmail } from "@/lib/email";
import { notifyAdmin } from "@/lib/notifyAdmin";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as
    | "recovery"
    | "email"
    | "signup"
    | "invite"
    | "magiclink"
    | null;
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  const origin = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin;

  if (token_hash && type) {
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

    const { error } = await supabase.auth.verifyOtp({ token_hash, type });

    if (!error) {
      // For password recovery, redirect to reset-password page
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/reset-password`);
      }

      // Send welcome email and admin notification on signup confirmation
      if (type === "signup") {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, email")
            .eq("user_id", user.id)
            .single();

          if (profile) {
            sendWelcomeEmail(profile.email, profile.first_name).catch(() => {});
            notifyAdmin(
              "Nouvel adhérent inscrit",
              `${profile.first_name} (${profile.email}) vient de créer un compte.`,
              "/admin/members"
            );
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If verification fails, redirect to login with error
  return NextResponse.redirect(
    `${origin}/login?error=Le lien est invalide ou a expiré`
  );
}
