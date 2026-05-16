import type { ReactNode } from "react";
import { Search } from "lucide-react";

import { ResumoMetricaCard } from "./ResumoMetricaCard";
import { TabelaOrdensSection } from "./TabelaOrdensSection";
import type { OrdemServico } from "../ordensServico.service";

type MetricaPainel = {
  titulo: string;
  valor: number;
  icone: ReactNode;
};

type SecaoPainel = {
  titulo: string;
  descricao: string;
  ordens: OrdemServico[];
};

type ConsultaOrdensPainelProps = {
  titulo: string;
  descricao: string;
  metricas: MetricaPainel[];
  secoes: SecaoPainel[];
  busca: string;
  onBuscaChange: (value: string) => void;
  placeholderBusca?: string;
  loading: boolean;
  erro?: string;
  inputClass?: string;
  onVer: (id: string) => void;
  formatarData: (data?: string | null) => string;
  nomeResponsavel: (os: OrdemServico) => string;
  rodape?: ReactNode;
  controlesExtras?: ReactNode;
};

export function ConsultaOrdensPainel({
  titulo,
  descricao,
  metricas,
  secoes,
  busca,
  onBuscaChange,
  placeholderBusca = "Buscar por numero, cliente, tipo, status ou responsavel...",
  loading,
  erro,
  inputClass = "app-input px-4 py-3 pl-11",
  onVer,
  formatarData,
  nomeResponsavel,
  rodape,
  controlesExtras,
}: ConsultaOrdensPainelProps) {
  const descricaoId = `${titulo.toLowerCase().replace(/\s+/g, "-")}-descricao`;
  const buscaId = `${titulo.toLowerCase().replace(/\s+/g, "-")}-busca`;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricas.map((metrica) => (
          <ResumoMetricaCard
            key={metrica.titulo}
            titulo={metrica.titulo}
            valor={metrica.valor}
            icone={metrica.icone}
          />
        ))}
      </div>

      <div className="app-card rounded-[1.5rem] p-4 sm:rounded-[1.85rem] sm:p-6">
        <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <span className="app-muted text-xs font-semibold uppercase tracking-[0.16em]">
              Consulta operacional
            </span>
            <h2 className="mt-2 text-xl font-semibold text-[var(--text-main)] sm:text-2xl">
              {titulo}
            </h2>
            <p id={descricaoId} className="app-muted mt-2 text-sm">
              {descricao}
            </p>
          </div>

          <div className="w-full xl:max-w-3xl" role="search" aria-label={`Busca em ${titulo}`}>
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-end">
              <div className="relative w-full xl:max-w-md">
                <label htmlFor={buscaId} className="sr-only">
                  Buscar ordens de servico
                </label>
                <Search className="app-muted pointer-events-none absolute left-4 top-3.5 h-4 w-4" />
                <input
                  id={buscaId}
                  type="text"
                  value={busca}
                  onChange={(event) => onBuscaChange(event.target.value)}
                  placeholder={placeholderBusca}
                  aria-describedby={descricaoId}
                  className={inputClass}
                />
              </div>

              {controlesExtras}
            </div>
          </div>
        </div>

        {erro ? (
          <div
            className="app-alert-danger mb-4 rounded-2xl px-4 py-3 text-sm"
            role="alert"
            aria-live="assertive"
          >
            {erro}
          </div>
        ) : null}

        {secoes.map((secao) => (
          <TabelaOrdensSection
            key={secao.titulo}
            titulo={secao.titulo}
            descricao={secao.descricao}
            ordens={secao.ordens}
            loading={loading}
            onVer={onVer}
            formatarData={formatarData}
            nomeResponsavel={nomeResponsavel}
          />
        ))}

        {rodape}
      </div>
    </div>
  );
}
