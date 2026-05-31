import { StatusBadge } from "./StatusBadge";
import type { OrdemServico } from "../ordensServico.service";

type Props = {
  titulo: string;
  descricao: string;
  ordens: OrdemServico[];
  loading: boolean;
  onVer: (id: string) => void;
  formatarData: (data?: string | null) => string;
  nomeResponsavel: (os: OrdemServico) => string;
};

export function TabelaOrdensSection({
  titulo,
  descricao,
  ordens,
  loading,
  onVer,
  formatarData,
  nomeResponsavel,
}: Props) {
  return (
    <section className="mb-8 last:mb-0">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-main)]">{titulo}</h3>
          <p className="app-muted text-sm">{descricao}</p>
        </div>

        <span className="app-card-soft inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold text-[var(--text-muted)]">
          {ordens.length} OS
        </span>
      </div>

      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="app-card rounded-2xl px-4 py-6 text-center">
            <span className="app-muted text-sm">Carregando ordens de servico...</span>
          </div>
        ) : null}

        {!loading && ordens.length === 0 ? (
          <div className="app-card rounded-2xl px-4 py-6 text-center">
            <span className="app-muted text-sm">
              Nenhuma ordem de servico encontrada nesta secao.
            </span>
          </div>
        ) : null}

        {!loading &&
          ordens.map((os) => (
            <article key={os.id} className="app-card rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-[var(--text-main)]">{os.numero}</p>
                  <p className="app-muted mt-1 text-sm">{os.tipo}</p>
                </div>
                <StatusBadge status={os.status} />
              </div>

              <div className="mt-4 space-y-3">
                <MobileInfo label="Cliente" value={os.nome_cliente || "-"} />
                <MobileInfo label="Responsavel" value={nomeResponsavel(os)} />
                <MobileInfo label="Data de abertura" value={formatarData(os.data_abertura)} />
              </div>

              <button
                type="button"
                onClick={() => onVer(os.id)}
                aria-label={`Abrir detalhes da ordem de serviço ${os.numero}`}
                className="app-button-outline mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl px-3 py-2 text-sm font-medium transition"
              >
                Ver detalhes
              </button>
            </article>
          ))}
      </div>

      <div className="app-table-shell hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm" aria-busy={loading}>
            <caption className="sr-only">
              {titulo}. {descricao}
            </caption>
            <thead className="app-table-header">
              <tr>
                <th scope="col" className="p-4 text-left text-xs font-semibold uppercase tracking-[0.14em]">
                  Numero
                </th>
                <th scope="col" className="p-4 text-left text-xs font-semibold uppercase tracking-[0.14em]">
                  Cliente
                </th>
                <th scope="col" className="p-4 text-left text-xs font-semibold uppercase tracking-[0.14em]">
                  Tipo
                </th>
                <th scope="col" className="p-4 text-left text-xs font-semibold uppercase tracking-[0.14em]">
                  Status
                </th>
                <th scope="col" className="p-4 text-left text-xs font-semibold uppercase tracking-[0.14em]">
                  Responsavel
                </th>
                <th scope="col" className="p-4 text-left text-xs font-semibold uppercase tracking-[0.14em]">
                  Data de abertura
                </th>
                <th scope="col" className="p-4 text-right text-xs font-semibold uppercase tracking-[0.14em]">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <span className="app-muted">Carregando ordens de servico...</span>
                  </td>
                </tr>
              )}

              {!loading && ordens.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <span className="app-muted">
                      Nenhuma ordem de servico encontrada nesta secao.
                    </span>
                  </td>
                </tr>
              )}

              {!loading &&
                ordens.map((os) => (
                  <tr key={os.id} className="app-table-row">
                    <th scope="row" className="p-4 text-left font-semibold text-[var(--text-main)]">{os.numero}</th>
                    <td className="p-4 text-[var(--text-main)]">
                      {os.nome_cliente || `${os.tipo} - ${os.descricao?.slice(0, 36) ?? ""}`}
                    </td>
                    <td className="p-4 capitalize text-[var(--text-main)]">{os.tipo}</td>
                    <td className="p-4">
                      <StatusBadge status={os.status} />
                    </td>
                    <td className="p-4 text-[var(--text-main)]">{nomeResponsavel(os)}</td>
                    <td className="p-4 text-[var(--text-main)]">{formatarData(os.data_abertura)}</td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => onVer(os.id)}
                        aria-label={`Ver detalhes da ordem de serviço ${os.numero}`}
                        className="app-button-outline inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium transition"
                      >
                        Ver detalhes
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function MobileInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="app-muted text-[11px] font-semibold uppercase tracking-[0.14em]">{label}</p>
      <p className="mt-1 text-sm text-[var(--text-main)]">{value}</p>
    </div>
  );
}
