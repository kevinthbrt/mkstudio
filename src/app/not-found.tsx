import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B8941E] flex items-center justify-center mx-auto mb-6">
          <span className="text-black font-bold text-xl">MK</span>
        </div>
        <h1 className="text-6xl font-black text-white mb-2">404</h1>
        <p className="text-gray-400 mb-6">Cette page n&apos;existe pas</p>
        <Link
          href="/"
          className="bg-gradient-to-r from-[#D4AF37] via-[#F5E06B] to-[#D4AF37] text-black font-semibold px-6 py-3 rounded-lg hover:shadow-[0_4px_20px_rgba(212,175,55,0.4)] transition-all"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
