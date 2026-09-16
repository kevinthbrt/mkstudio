"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { landingNav } from "@/content/landing";
import { Logo } from "@/components/landing/Logo";

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#ECEAE3] bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo size={38} />
          <span className="text-base font-bold tracking-tight text-[#14131A]">MK Studio</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {landingNav.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[#55524A] transition-colors hover:text-[#14131A]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="text-sm font-medium text-[#55524A] transition-colors hover:text-[#14131A]"
          >
            {landingNav.login}
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-[#14131A] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2A2823]"
          >
            {landingNav.cta}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#ECEAE3] text-[#14131A] md:hidden"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-[#ECEAE3] bg-white md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-5 py-2">
            {landingNav.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-[#F3F1EB] py-3 text-sm font-medium text-[#55524A]"
              >
                {link.label}
              </a>
            ))}
            <div className="flex gap-3 py-4">
              <Link
                href="/login"
                className="flex-1 rounded-xl border border-[#ECEAE3] py-2.5 text-center text-sm font-semibold text-[#14131A]"
              >
                {landingNav.login}
              </Link>
              <Link
                href="/register"
                className="flex-1 rounded-xl bg-[#14131A] py-2.5 text-center text-sm font-semibold text-white"
              >
                {landingNav.cta}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
