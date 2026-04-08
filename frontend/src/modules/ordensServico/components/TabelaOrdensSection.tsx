import { StatusBadge } from "./StatusBadge";
import type { OrdemServico } from "../ordensServico.service";

type Props = {
  titulo: string;
  descricao: string;
  ordens: OrdemServico[];
  loading: boolean;
  isDark: boolean;
  mutedText: string;
  titleText: string;
  tableHead: string;
  rowHover: string;
  tableBorder: string;
  onVer: (id: string) => void;
  formatarData: (data?: string | null) => string;
  nomeResponsavel: (os: OrdemServico) => string;
};

export function TabelaOrdensSection({
  titulo,
  descricao,
  ordens,
  loading,
  isDark,
  mutedText,
  titleText,
  tableHead,
  rowHover,
  tableBorder,
  onVer,
  formatarData,
  nomeResponsavel,
}: Props) {
  return (
    <section className="mb-8">
      <div className="mb-4">
        <h3 className={`text-lg font-semibold ${titleText}`}>{titulo}</h3>
        <p className={`text-sm ${mutedText}`}>{descricao}</p>
      </div>

      <div className={`overflow-hidden rounded-2xl border ${tableBorder}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className={tableHead}>
              <tr>
                <th className="p-4 text-left font-semibold">Número</th>
                <th className="p-4 text-left font-semibold">Cliente</th>
                <th className="p-4 text-left font-semibold">Tipo</th>
                <th className="p-4 text-left font-semibold">Status</th>
                <th className="p-4 text-left font-semibold">Responsável</th>
                <th className="p-4 text-left font-semibold">Data de abertura</th>
                <th className="p-4 text-right font-semibold">Ações</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="p-6 text-center">
                    <span className={mutedText}>Carregando...</span>
                  </td>
                </tr>
              )}

              {!loading && ordens.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center">
                    <span className={mutedText}>Nenhuma ordem encontrada.</span>
                  </td>
                </tr>
              )}

              {!loading &&
                ordens.map((os) => (
                  <tr
                    key={os.id}
                    className={`border-t ${tableBorder} transition ${rowHover}`}
                  >
                    <td className={`p-4 font-medium ${titleText}`}>{os.numero}</td>
                    <td className={`p-4 ${titleText}`}>
                      {os.nome_cliente || `${os.tipo} - ${os.descricao?.slice(0, 36) ?? ""}`}
                    </td>
                    <td className="p-4 capitalize">{os.tipo}</td>
                    <td className="p-4">
                      <StatusBadge status={os.status} />
                    </td>
                    <td className="p-4">{nomeResponsavel(os)}</td>
                    <td className="p-4">{formatarData(os.data_abertura)}</td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => onVer(os.id)}
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                          isDark
                            ? "bg-slate-100 text-slate-900 hover:bg-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        Ver
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
