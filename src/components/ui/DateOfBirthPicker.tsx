import { cn } from "@/lib/utils";

interface DateOfBirthPickerProps {
  label?: string;
  value: string; // YYYY-MM-DD format
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  className?: string;
}

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const selectClass = cn(
  "bg-[#13121e] border border-[#2d2b40] text-white rounded-xl px-3 py-3 text-sm",
  "outline-none transition-all duration-200 appearance-none cursor-pointer",
  "focus:border-[#D4AF37]/60 focus:bg-[#16152a] focus:shadow-[0_0_0_3px_rgba(212,175,55,0.08)]",
);

export function DateOfBirthPicker({ label, value, onChange, required, error, className }: DateOfBirthPickerProps) {
  const parts = value ? value.split("-") : ["", "", ""];
  const year = parts[0] || "";
  const month = parts[1] || "";
  const day = parts[2] || "";

  function update(y: string, m: string, d: string) {
    if (y && m && d) {
      onChange(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
    } else {
      onChange("");
    }
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  const daysInMonth = year && month ? new Date(Number(year), Number(month), 0).getDate() : 31;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="grid grid-cols-3 gap-2">
        {/* Day */}
        <div className="relative">
          <select
            value={day}
            onChange={(e) => update(year, month, e.target.value)}
            className={cn(selectClass, "w-full", error && "border-red-500/50")}
            required={required}
          >
            <option value="" className="bg-[#13121e]">Jour</option>
            {days.map((d) => (
              <option key={d} value={String(d).padStart(2, "0")} className="bg-[#13121e]">
                {d}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-600">
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>

        {/* Month */}
        <div className="relative">
          <select
            value={month}
            onChange={(e) => update(year, e.target.value, day)}
            className={cn(selectClass, "w-full", error && "border-red-500/50")}
            required={required}
          >
            <option value="" className="bg-[#13121e]">Mois</option>
            {MONTHS.map((m, i) => (
              <option key={i} value={String(i + 1).padStart(2, "0")} className="bg-[#13121e]">
                {m}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-600">
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>

        {/* Year */}
        <div className="relative">
          <select
            value={year}
            onChange={(e) => update(e.target.value, month, day)}
            className={cn(selectClass, "w-full", error && "border-red-500/50")}
            required={required}
          >
            <option value="" className="bg-[#13121e]">Année</option>
            {years.map((y) => (
              <option key={y} value={String(y)} className="bg-[#13121e]">
                {y}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-600">
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}
