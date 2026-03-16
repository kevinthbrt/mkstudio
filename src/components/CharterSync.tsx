"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function CharterSync() {
  useEffect(() => {
    const accepted = localStorage.getItem("mk_charter_accepted");
    if (!accepted) return;

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .update({ charter_accepted_at: accepted })
        .eq("user_id", user.id)
        .then(() => {
          localStorage.removeItem("mk_charter_accepted");
        });
    });
  }, []);

  return null;
}
