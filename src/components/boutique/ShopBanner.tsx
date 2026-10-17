"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { isShopLive, timeLeftLabel, type ShopStatus } from "@/lib/merch";
import { formatDate } from "@/lib/utils";

/**
 * Bandeau affiché en haut de toutes les pages adhérent tant qu'une vente
 * éphémère est en cours : la boutique ne dure pas, elle doit se voir.
 */
export function ShopBanner({ shop }: { shop: ShopStatus | null }) {
  const pathname = usePathname();
  if (!isShopLive(shop) || pathname.startsWith("/dashboard/boutique")) return null;

  return (
    <Link
      href="/dashboard/boutique"
      className="shop-banner group relative mx-4 mt-4 flex items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 text-[#0a0a0a] shadow-[0_8px_30px_rgba(212,175,55,0.25)] lg:mx-8 lg:mt-6 lg:px-5"
    >
      <span className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-black/15">
        <ShoppingBag size={18} />
        <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-80" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
        </span>
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="block truncate text-[10px] font-bold uppercase tracking-[0.16em] opacity-70">
          Boutique éphémère · {timeLeftLabel(shop.sale.closes_at)}
        </span>
        <span className="block truncate text-sm font-bold">
          {shop.sale.title}
          <span className="hidden font-medium sm:inline"> · commandes jusqu&apos;au {formatDate(shop.sale.closes_at)}</span>
        </span>
      </span>
      <span className="relative hidden items-center gap-1.5 rounded-xl bg-black/85 px-3 py-2 text-xs font-bold text-[#E8C84A] transition-transform group-hover:translate-x-0.5 sm:flex">
        Commander
        <ArrowRight size={14} />
      </span>
      <ArrowRight size={18} className="relative flex-shrink-0 sm:hidden" />
    </Link>
  );
}
