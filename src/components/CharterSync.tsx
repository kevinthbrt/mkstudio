"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function CharterSync() {
  useEffect(() => {
    const accepted = localStorage.getItem("mk_charter_accepted");
    if (!accepted) return;

    const dateOfBirth = localStorage.getItem("mk_date_of_birth");

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const updates: Record<string, string> = { charter_accepted_at: accepted };
      if (dateOfBirth) updates.date_of_birth = dateOfBirth;

      supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user.id)
        .then(() => {
          localStorage.removeItem("mk_charter_accepted");
          localStorage.removeItem("mk_date_of_birth");
        });
    });
  }, []);

  return null;
}
