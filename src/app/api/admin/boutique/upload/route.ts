import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// Vercel refuse les requêtes de plus de 4,5 Mo.
const MAX_BYTES = 4 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

/**
 * Envoi d'une photo d'article de la boutique.
 * Supabase ne permet plus de créer de règles de stockage en SQL : l'envoi
 * passe donc par le serveur (clé service_role), après vérification que
 * l'appelant est admin.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const saleId = form?.get("saleId");

  if (!(file instanceof File) || typeof saleId !== "string" || !/^[0-9a-f-]{36}$/i.test(saleId)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }
  const extension = EXTENSIONS[file.type];
  if (!extension) {
    return NextResponse.json({ error: "Format non pris en charge (JPG, PNG, WebP)." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image trop lourde : 4 Mo maximum." }, { status: 400 });
  }

  const path = `${saleId}/${crypto.randomUUID()}.${extension}`;
  const adminClient = createAdminClient();
  const { error } = await adminClient.storage
    .from("merch")
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type });

  if (error) {
    console.error("[boutique/upload] storage error:", error.message);
    return NextResponse.json({ error: "L'image n'a pas pu être envoyée." }, { status: 500 });
  }

  const { data } = adminClient.storage.from("merch").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
