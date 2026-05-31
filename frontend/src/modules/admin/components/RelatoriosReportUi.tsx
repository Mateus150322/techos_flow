import type { OrdemStatus } from "@/modules/ordensServico/ordensServico.service";
import type { GargaloOperacional } from "../relatorios.utils";

export function ResumoCard({
  label,
  value,
  cardBg,
  titleText,
  mutedText,
}: {
  label: string;
  value: number;
  cardBg: string;
  titleText: string;
  mutedText: string;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${cardBg}`}>
      <p className={`text-sm ${mutedText}`}>{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${titleText}`}>{value}</p>
    </div>
  );
}

export function GargaloCard({
  gargalo,
  isDark,
  titleText,
  mutedText,
}: {
  gargalo: GargaloOperacional;
  isDark: boolean;
  titleText: string;
  mutedText: string;
}) {
  const toneClass = getGargaloClasses(gargalo.nivel, isDark);

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className={`text-sm font-semibold ${titleText}`}>{gargalo.label}</p>
          <p className={`mt-1 text-sm ${mutedText}`}>{gargalo.descricao}</p>
        </div>
        <p className={`text-2xl font-bold ${titleText}`}>{gargalo.quantidade}</p>
      </div>
    </div>
  );
}

export function PriorityPill({ prioridade }: { prioridade: string }) {
  const classes =
    prioridade === "Alta"
      ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
      : prioridade === "Média"
        ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${classes}`}>{prioridade}</span>
  );
}

export function ReportCellRenderer({
  columnKey,
  value,
  rowKey,
  isOperationalView,
  isDark,
  titleText,
  mutedText,
  expanded,
  onToggleContext,
}: {
  columnKey: string;
  value: string;
  rowKey: string;
  isOperationalView: boolean;
  isDark: boolean;
  titleText: string;
  mutedText: string;
  expanded: boolean;
  onToggleContext: () => void;
}) {
  if (!isOperationalView) {
    return <>{value}</>;
  }

  if (columnKey === "contexto" || columnKey === "observacoes") {
    return (
      <OperationalContextCellV2
        value={value}
        isDark={isDark}
        titleText={titleText}
        mutedText={mutedText}
        expanded={expanded}
        onToggle={onToggleContext}
        contextId={`contexto-${rowKey}`}
      />
    );
  }

  if (columnKey === "idade") {
    return <QueueAgeBadge value={value} isDark={isDark} />;
  }

  if (columnKey === "local" || columnKey === "origem") {
    return <OperationalMetaCell value={value} titleText={titleText} mutedText={mutedText} />;
  }

  if (columnKey === "servico" || columnKey === "equipamento") {
    return (
      <p className={`max-w-[15rem] text-sm leading-5 ${value === "-" ? mutedText : titleText}`}>
        {value === "-" ? "Não informado" : value}
      </p>
    );
  }

  if (columnKey === "responsavel") {
    const semResponsavel = value.toLowerCase().includes("sem respons");

    return (
      <span
        className={
          semResponsavel
            ? isDark
              ? "font-medium text-amber-300"
              : "font-medium text-amber-700"
            : titleText
        }
      >
        {semResponsavel ? "Sem responsável" : value}
      </span>
    );
  }

  if (columnKey === "clienteLocal" && value === "-") {
    return <span className={mutedText}>Não informado</span>;
  }

  if (columnKey === "status") {
    return <span className={titleText}>{value}</span>;
  }

  return <>{value}</>;
}

export function MobileOperationalReportCard({
  row,
  rowKey,
  isDark,
  titleText,
  mutedText,
  expanded,
  contextExpanded,
  onToggleDetails,
  onToggleContext,
}: {
  row: Record<string, string>;
  rowKey: string;
  isDark: boolean;
  titleText: string;
  mutedText: string;
  expanded: boolean;
  contextExpanded: boolean;
  onToggleDetails: () => void;
  onToggleContext: () => void;
}) {
  return (
    <article
      className={`rounded-3xl border p-4 shadow-sm ${
        isDark ? "border-slate-800 bg-slate-950/70" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={`text-lg font-semibold ${titleText}`}>{row.numero || "OS sem número"}</p>
          <p className={`mt-1 text-sm ${mutedText}`}>{row.tipo || "Tipo não informado"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PriorityPill prioridade={row.prioridade || "Baixa"} />
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              isDark ? "bg-slate-900 text-slate-200" : "bg-slate-100 text-slate-700"
            }`}
          >
            {row.status || "Status não informado"}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <MobileInfoBlock
          label="Unidade / Local"
          value={row.local}
          titleText={titleText}
          mutedText={mutedText}
        />
        <MobileInfoBlock label="Origem" value={row.origem} titleText={titleText} mutedText={mutedText} />
        <MobileInfoBlock
          label="Responsável"
          value={row.responsavel}
          titleText={titleText}
          mutedText={mutedText}
        />
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${mutedText}`}>Tempo em fila</p>
          <div className="mt-2">
            <QueueAgeBadge value={row.idade || "-"} isDark={isDark} />
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-main)]/55 p-4">
        <div className="grid gap-3">
          <MobileInfoBlock
            label="Serviço solicitado"
            value={row.servico}
            titleText={titleText}
            mutedText={mutedText}
          />
          <MobileInfoBlock
            label="Equipamento"
            value={row.equipamento}
            titleText={titleText}
            mutedText={mutedText}
          />
        </div>

        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${mutedText}`}>
            Resumo operacional
          </p>
          <div className="mt-2">
            <OperationalContextCellV2
              value={row.contexto ?? "-"}
              isDark={isDark}
              titleText={titleText}
              mutedText={mutedText}
              expanded={contextExpanded}
              onToggle={onToggleContext}
              contextId={`contexto-mobile-${rowKey}`}
            />
          </div>
        </div>
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={onToggleDetails}
          aria-expanded={expanded}
          aria-controls={`detalhe-mobile-${rowKey}`}
          className={`w-full rounded-2xl border px-4 py-3 text-sm font-medium transition ${
            isDark
              ? "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
              : "border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100"
          }`}
        >
          {expanded ? "Ocultar detalhes completos" : "Ver detalhes completos"}
        </button>
      </div>

      {expanded ? (
        <div id={`detalhe-mobile-${rowKey}`} className="mt-4">
          <OperationalExpandedRow
            row={row}
            isDark={isDark}
            titleText={titleText}
            mutedText={mutedText}
          />
        </div>
      ) : null}
    </article>
  );
}

export function OperationalExpandedRow({
  row,
  isDark,
  titleText,
  mutedText,
}: {
  row: Record<string, string>;
  isDark: boolean;
  titleText: string;
  mutedText: string;
}) {
  const fields = [
    { label: "Unidade / Local", value: row.local },
    { label: "Origem da solicitação", value: row.origem },
    { label: "Serviço solicitado", value: row.servico },
    { label: "Equipamento", value: row.equipamento },
    { label: "Responsável técnico", value: row.responsavel },
    { label: "Tempo em fila", value: row.idade },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className={`text-base font-semibold ${titleText}`}>Detalhamento operacional da OS</p>
          <p className={`mt-1 text-sm ${mutedText}`}>
            Resumo estruturado da ordem para leitura rápida e tomada de decisão.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              isDark ? "bg-slate-900 text-slate-200" : "bg-white text-slate-700"
            }`}
          >
            {row.status || "Status não informado"}
          </span>
          <PriorityPill prioridade={row.prioridade || "Baixa"} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {fields.map((field) => (
          <div
            key={field.label}
            className={`rounded-2xl border p-4 ${
              isDark ? "border-slate-800 bg-slate-950/80" : "border-slate-200 bg-white"
            }`}
          >
            <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${mutedText}`}>
              {field.label}
            </p>
            <p className={`mt-2 text-sm leading-6 ${field.value && field.value !== "-" ? titleText : mutedText}`}>
              {field.value && field.value !== "-" ? field.value : "Não informado"}
            </p>
          </div>
        ))}
      </div>

      <div
        className={`rounded-2xl border p-4 ${
          isDark ? "border-slate-800 bg-slate-950/80" : "border-slate-200 bg-white"
        }`}
      >
        <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${mutedText}`}>
          Resumo operacional
        </p>
        <div className="mt-3">
          <OperationalContextCellV2
            value={row.contexto ?? "-"}
            isDark={isDark}
            titleText={titleText}
            mutedText={mutedText}
            expanded
            onToggle={() => undefined}
            contextId={`contexto-expandido-${row.numero ?? "linha"}`}
            allowToggle={false}
          />
        </div>
      </div>
    </div>
  );
}

export function OperationalStatusPill({
  status,
  isDark,
  children,
}: {
  status: OrdemStatus;
  isDark: boolean;
  children: string;
}) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(status, isDark)}`}>
      {children}
    </span>
  );
}

function getStatusClasses(status: OrdemStatus, isDark: boolean) {
  if (status === "aberta") {
    return isDark ? "bg-sky-950 text-sky-300" : "bg-sky-50 text-sky-700";
  }

  if (status === "em_execucao") {
    return isDark ? "bg-amber-950 text-amber-300" : "bg-amber-50 text-amber-700";
  }

  if (status === "finalizada") {
    return isDark ? "bg-emerald-950 text-emerald-300" : "bg-emerald-50 text-emerald-700";
  }

  if (status === "nao_executada") {
    return isDark ? "bg-rose-950 text-rose-300" : "bg-rose-50 text-rose-700";
  }

  return isDark ? "bg-slate-900 text-slate-200" : "bg-slate-100 text-slate-700";
}

function OperationalMetaCell({
  value,
  titleText,
  mutedText,
}: {
  value: string;
  titleText: string;
  mutedText: string;
}) {
  if (!value || value === "-" || value === "Não informado") {
    return <span className={mutedText}>Não informado</span>;
  }

  const parts = value
    .split("/")
    .map((item) => item.trim())
    .filter(Boolean);

  if (parts.length <= 1) {
    return <p className={`max-w-[14rem] text-sm leading-5 ${titleText}`}>{value}</p>;
  }

  return (
    <div className="max-w-[14rem] space-y-1">
      <p className={`text-sm font-medium leading-5 ${titleText}`}>{parts[0]}</p>
      <p className={`text-xs leading-5 ${mutedText}`}>{parts.slice(1).join(" / ")}</p>
    </div>
  );
}

function MobileInfoBlock({
  label,
  value,
  titleText,
  mutedText,
}: {
  label: string;
  value?: string;
  titleText: string;
  mutedText: string;
}) {
  const hasValue = Boolean(value && value !== "-");

  return (
    <div>
      <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${mutedText}`}>{label}</p>
      <p className={`mt-1 text-sm leading-6 ${hasValue ? titleText : mutedText}`}>
        {hasValue ? value : "Não informado"}
      </p>
    </div>
  );
}

function OperationalContextCellV2({
  value,
  isDark,
  titleText,
  mutedText,
  expanded,
  onToggle,
  contextId,
  allowToggle = true,
}: {
  value: string;
  isDark: boolean;
  titleText: string;
  mutedText: string;
  expanded: boolean;
  onToggle: () => void;
  contextId: string;
  allowToggle?: boolean;
}) {
  if (!value || value === "-") {
    return <span className={mutedText}>Sem contexto resumido</span>;
  }

  if (value === "Registro inicial de demonstracao." || value === "Registro inicial de demonstração.") {
    return <span className={mutedText}>Registro inicial de demonstração</span>;
  }

  if (value.startsWith("Nao executada:") || value.startsWith("Não executada:")) {
    return (
      <div className="max-w-[24rem] space-y-2">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
            isDark ? "bg-red-950 text-red-300" : "bg-red-50 text-red-700"
          }`}
        >
          Não executada
        </span>
        <p className={`text-sm leading-5 ${titleText}`}>
          {value.replace("Nao executada:", "").replace("Não executada:", "").trim()}
        </p>
      </div>
    );
  }

  const parts = value
    .split(/•|â€¢|Ã¢â‚¬Â¢/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (parts.length <= 1) {
    const canExpandText = value.length > 72;

    return (
      <div className="max-w-[24rem] space-y-2">
        <p
          id={contextId}
          className={`text-sm leading-5 ${titleText}`}
          style={
            expanded || !canExpandText
              ? undefined
              : {
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }
          }
        >
          {value}
        </p>
        {allowToggle && canExpandText ? (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-controls={contextId}
            className={`text-xs font-medium underline-offset-2 transition hover:underline ${
              isDark ? "text-sky-300" : "text-sky-700"
            }`}
          >
            {expanded ? "Ver menos" : "Ver mais"}
          </button>
        ) : null}
      </div>
    );
  }

  const [headline, ...tags] = parts;
  const visibleTags = expanded ? tags : tags.slice(0, 2);
  const hiddenTags = Math.max(tags.length - visibleTags.length, 0);
  const canExpandTags = tags.length > 2;

  return (
    <div className="max-w-[24rem] space-y-2">
      <p
        id={contextId}
        className={`text-sm font-medium leading-5 ${titleText}`}
        style={
          expanded
            ? undefined
            : {
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
        }
      >
        {headline}
      </p>
      <div className="flex flex-wrap gap-2">
        {visibleTags.map((tag) => (
          <span
            key={tag}
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              isDark ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700"
            }`}
          >
            {tag}
          </span>
        ))}
        {!expanded && hiddenTags > 0 ? (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              isDark ? "bg-slate-900 text-slate-400" : "bg-slate-200 text-slate-600"
            }`}
          >
            +{hiddenTags}
          </span>
        ) : null}
      </div>
      {allowToggle && canExpandTags ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={contextId}
          className={`text-xs font-medium underline-offset-2 transition hover:underline ${
            isDark ? "text-sky-300" : "text-sky-700"
          }`}
        >
          {expanded ? "Ver menos" : "Ver mais"}
        </button>
      ) : null}
    </div>
  );
}

function QueueAgeBadge({ value, isDark }: { value: string; isDark: boolean }) {
  const numericDays = Number.parseInt(value.split("d")[0] ?? "0", 10);
  const tone =
    numericDays >= 3
      ? isDark
        ? "bg-red-950 text-red-300"
        : "bg-red-50 text-red-700"
      : numericDays >= 1
        ? isDark
          ? "bg-amber-950 text-amber-300"
          : "bg-amber-50 text-amber-700"
        : isDark
          ? "bg-emerald-950 text-emerald-300"
          : "bg-emerald-50 text-emerald-700";

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{value}</span>;
}

function getGargaloClasses(nivel: GargaloOperacional["nivel"], isDark: boolean) {
  if (nivel === "critico") {
    return isDark ? "border-red-900 bg-red-950/60" : "border-red-200 bg-red-50";
  }

  if (nivel === "atencao") {
    return isDark ? "border-amber-900 bg-amber-950/60" : "border-amber-200 bg-amber-50";
  }

  return isDark ? "border-emerald-900 bg-emerald-950/60" : "border-emerald-200 bg-emerald-50";
}
