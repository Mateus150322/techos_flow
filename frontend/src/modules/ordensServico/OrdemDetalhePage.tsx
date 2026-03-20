import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { buscarOrdem, type OrdemServicoDetalhe } from "./ordensServico.service";

export default function OrdemDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [os, setOs] = useState<OrdemServicoDetalhe | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        if (!id) throw new Error("ID não informado.");

        const data = await buscarOrdem(id, [
          "endereco",
          "criadaPor",
          "execucoes",
          "execucoes.tecnico",
          "anexos",
        ]);

        if (!alive) return;
        setOs(data);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.response?.data?.message ?? e?.message ?? "Erro ao carregar OS.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
        <p className="text-sm text-zinc-400">Carregando detalhes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
        <p className="text-sm text-red-400">{error}</p>
        <Link className="mt-4 inline-block text-sm underline" to="/ordens-servico">
          Voltar
        </Link>
      </div>
    );
  }

  if (!os) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
        <p className="text-sm text-zinc-400">Ordem de serviço não encontrada.</p>
        <Link className="mt-4 inline-block text-sm underline" to="/ordens-servico">
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{os.numero}</h1>
          <p className="text-sm text-zinc-400">
            {os.tipo} • {os.status.replaceAll("_", " ")} • Prioridade {os.prioridade}
          </p>
        </div>

        <Link
          to="/ordens-servico"
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm hover:bg-zinc-800"
        >
          Voltar
        </Link>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-4">
          <Section title="Descrição">
            <p className="text-sm text-zinc-200">{os.descricao}</p>
          </Section>

          <Section title="Execuções">
            {os.execucoes?.length ? (
              <div className="space-y-3">
                {os.execucoes.map((ex) => (
                  <div
                    key={ex.id}
                    className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3"
                  >
                    <p className="text-sm">
                      <span className="text-zinc-400">Técnico:</span>{" "}
                      {ex.tecnico?.name ?? "—"}
                    </p>
                    <p className="text-sm">
                      <span className="text-zinc-400">Início:</span> {ex.data_inicio ?? "—"}
                    </p>
                    <p className="text-sm">
                      <span className="text-zinc-400">Fim:</span> {ex.data_fim ?? "—"}
                    </p>
                    <p className="text-sm mt-2 text-zinc-300">
                      {ex.observacao ?? "—"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-400">Nenhuma execução registrada.</p>
            )}
          </Section>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Section title="Endereço">
            {os.endereco ? (
              <div className="text-sm text-zinc-200 space-y-1">
                <p>
                  {os.endereco.rua}, {os.endereco.numero}
                </p>
                <p>{os.endereco.bairro}</p>
                <p>
                  {os.endereco.cidade} - {os.endereco.estado}
                </p>
                <p>CEP: {os.endereco.cep}</p>
              </div>
            ) : (
              <p className="text-sm text-zinc-400">—</p>
            )}
          </Section>

          <Section title="Criada por">
            <p className="text-sm text-zinc-200">{os.criada_Por?.name ?? "—"}</p>
            <p className="text-xs text-zinc-400">{os.criada_Por?.email ?? ""}</p>
          </Section>

          <Section title="Anexos">
            {os.anexos?.length ? (
              <ul className="text-sm text-zinc-200 space-y-2">
                {os.anexos.map((a: any) => (
                  <li
                    key={a.id}
                    className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2"
                  >
                    {a.nome ?? a.arquivo ?? a.id}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-400">Sem anexos.</p>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <h2 className="text-lg font-medium">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}