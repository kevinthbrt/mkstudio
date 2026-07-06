import { createAdminClient } from "@/lib/supabase/admin";
import { verifyUnsubscribeToken } from "@/lib/unsubscribeToken";
import { NextRequest, NextResponse } from "next/server";

function page(title: string, message: string) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${title}</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:80px auto;padding:32px;background:#111111;border:1px solid #1f1f1f;border-radius:16px;text-align:center;">
    <div style="color:#D4AF37;font-size:20px;font-weight:700;margin-bottom:16px;">MK Studio</div>
    <p style="color:#d1d5db;font-size:15px;line-height:1.6;">${message}</p>
  </div>
</body>
</html>`;
}

export async function GET(request: NextRequest) {
  const profileId = request.nextUrl.searchParams.get("profile");
  const token = request.nextUrl.searchParams.get("token");

  if (!profileId || !token || !verifyUnsubscribeToken(profileId, token)) {
    return new NextResponse(page("Lien invalide", "Ce lien de désinscription est invalide ou a expiré."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const adminClient = createAdminClient();
  await adminClient.from("profiles").update({ marketing_opt_in: false }).eq("id", profileId);

  return new NextResponse(
    page("Désinscription confirmée", "Vous ne recevrez plus d'emails marketing (nouveautés, promotions) de MK Studio. Vous continuerez à recevoir les emails liés à vos réservations et achats."),
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
