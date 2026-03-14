import { redirect } from "next/navigation";

// Les achats sont désormais enregistrés par un admin à la salle.
export default function ShopPage() {
  redirect("/dashboard");
}
