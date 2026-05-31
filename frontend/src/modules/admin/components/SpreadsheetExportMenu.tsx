import { ChevronDown, Download, FileSpreadsheet } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type SpreadsheetFormat = "csv" | "xlsx";

type Props = {
  disabled?: boolean;
  exportandoFormato: SpreadsheetFormat | "pdf" | null;
  isDark: boolean;
  onSelect: (format: SpreadsheetFormat) => void;
};

export function SpreadsheetExportMenu({
  disabled = false,
  exportandoFormato,
  isDark,
  onSelect,
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const buttonClass = isDark
    ? "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100";
  const menuClass = isDark
    ? "border-slate-700 bg-slate-950 text-slate-100 shadow-black/30"
    : "border-slate-200 bg-white text-slate-700 shadow-slate-200/70";
  const itemHoverClass = isDark ? "hover:bg-slate-900" : "hover:bg-slate-50";

  const label =
    exportandoFormato === "xlsx"
      ? "Exportando Excel..."
      : exportandoFormato === "csv"
        ? "Exportando CSV..."
        : "Exportar planilha";
  const isMenuOpen = open && !disabled;

  function handleSelect(format: SpreadsheetFormat) {
    setOpen(false);
    onSelect(format);
  }

  return (
    <div ref={wrapperRef} className="relative w-full sm:w-auto">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${buttonClass}`}
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
      >
        <FileSpreadsheet className="h-4 w-4" />
        {label}
        <ChevronDown className={`h-4 w-4 transition ${isMenuOpen ? "rotate-180" : ""}`} />
      </button>

      {isMenuOpen ? (
        <div
          role="menu"
          className={`absolute right-0 z-20 mt-2 min-w-[220px] rounded-2xl border p-2 shadow-xl sm:left-0 sm:right-auto ${menuClass}`}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => handleSelect("xlsx")}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${itemHoverClass}`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>
              <span className="block font-medium">Excel</span>
              <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Planilha formatada para análise
              </span>
            </span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => handleSelect("csv")}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${itemHoverClass}`}
          >
            <Download className="h-4 w-4" />
            <span>
              <span className="block font-medium">CSV</span>
              <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Formato leve para importação e filtros
              </span>
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
