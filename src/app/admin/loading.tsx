/** Affiché instantanément pendant le chargement d'une page, pour que le clic réponde tout de suite. */
export default function Loading() {
  return (
    <div className="flex justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
    </div>
  );
}
