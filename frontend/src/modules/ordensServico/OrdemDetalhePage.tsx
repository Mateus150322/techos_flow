import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  MapPin,
  Paperclip,
  UserCircle2,
  Wrench,
  PlayCircle,
  CheckCircle2,
  Upload,
} from "lucide-react";

import {
  buscarOrdem,
  enviarAnexo,
  finalizarExecucao,
  iniciarExecucao,
  marcarNaoExecutada,
  type OrdemServicoDetalhe,
} from "./ordensServico.service";
import { StatusBadge } from "./components/StatusBadge";
import { PrioridadeBadge } from "./components/PrioridadeBadge";
import { useTheme } from "@/shared/hooks/useTheme";

type CurrentUser = {
  id?: string;
  name: string;
  email?: string;
  role: "administrador" | "tecnico" | "atendente";
};

export default function OrdemDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [os, setOs] = useState<OrdemServicoDetalhe | null>(null);

  const [observacaoInicio, setObservacaoInicio] = useState("");
  const [observacaoFim, setObservacaoFim] = useState("");
  const [motivoNaoExecucao, setMotivoNaoExecucao] = useState("");
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [tipoAnexo, setTipoAnexo] = useState("foto");
  const [processandoAcao, setProcessandoAcao] = useState(false);

  const currentUser: CurrentUser = useMemo(() => {
    const raw = localStorage.getItem("user");

    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return {
          name: "Usuário",
          role: "atendente",
        };
      }
    }

    return {
      name: "Usuário",
      role: "atendente",
    };
  }, []);

  async function carregarOrdem() {
    try {
      setLoading(true);
      setError(null);

      if (!id) {
        throw new Error("ID não informado.");
      }

      const data = await buscarOrdem(id, [
        "endereco",
        "criadaPor",
        "execucoes",
        "execucoes.tecnico",
        "anexos",
      ]);

      setOs(data);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "Erro ao carregar OS.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarOrdem();
  }, [id]);

  function formatarDataHora(valor?: string | null) {
    if (!valor) return "—";

    return new Date(valor).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatarStatus(status: string) {
    return status.replaceAll("_", " ");
  }

  const ultimaExecucaoAberta = useMemo(() => {
    if (!os?.execucoes?.length) return null;
    return os.execucoes.find((execucao) => !execucao.data_fim) ?? null;
  }, [os]);

  const podeIniciarExecucao =
    currentUser.role === "tecnico" && os?.status === "aberta";

  const podeFinalizarExecucao =
    currentUser.role === "tecnico" &&
    os?.status === "em_execucao" &&
    !!ultimaExecucaoAberta;

  const podeMarcarNaoExecutada =
    currentUser.role === "tecnico" &&
    (os?.status === "aberta" || os?.status === "em_execucao");

  const podeEnviarAnexo =
    currentUser.role === "tecnico" || currentUser.role === "administrador";

  async function handleIniciarExecucao() {
    if (!os?.id) return;

    try {
      setProcessandoAcao(true);
      setError(null);

      await iniciarExecucao(os.id, {
        observacao: observacaoInicio.trim() || undefined,
      });

      setObservacaoInicio("");
      await carregarOrdem();
    } catch (e: any) {
      setError(
        e?.response?.data?.message ??
          "Não foi possível iniciar a execução."
      );
    } finally {
      setProcessandoAcao(false);
    }
  }

  async function handleFinalizarExecucao() {
    if (!os?.id || !ultimaExecucaoAberta?.id) return;

    try {
      setProcessandoAcao(true);
      setError(null);

      await finalizarExecucao(os.id, {
        execucao_id: ultimaExecucaoAberta.id,
        observacao: observacaoFim.trim() || undefined,
      });

      setObservacaoFim("");
      await carregarOrdem();
    } catch (e: any) {
      setError(
        e?.response?.data?.message ??
          "Não foi possível finalizar a execução."
      );
    } finally {
      setProcessandoAcao(false);
    }
  }

  async function handleMarcarNaoExecutada() {
    if (!os?.id) return;

    if (!motivoNaoExecucao.trim()) {
      setError("Informe o motivo da não execução.");
      return;
    }

    try {
      setProcessandoAcao(true);
      setError(null);

      await marcarNaoExecutada(os.id, {
        motivo_nao_execucao: motivoNaoExecucao.trim(),
      });

      setMotivoNaoExecucao("");
      await carregarOrdem();
    } catch (e: any) {
      setError(
        e?.response?.data?.message ??
          "Não foi possível marcar a OS como não executada."
      );
    } finally {
      setProcessandoAcao(false);
    }
  }

  async function handleEnviarAnexo() {
    if (!os?.id || !arquivoSelecionado) {
      setError("Selecione um arquivo para enviar.");
      return;
    }

    try {
      setProcessandoAcao(true);
      setError(null);

      await enviarAnexo(os.id, arquivoSelecionado, tipoAnexo);

      setArquivoSelecionado(null);
      await carregarOrdem();
    } catch (e: any) {
      setError(
        e?.response?.data?.message ??
          "Não foi possível enviar o anexo."
      );
    } finally {
      setProcessandoAcao(false);
    }
  }

  const pageBg = isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900";
  const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
  const innerCardBg = isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200";
  const titleText = isDark ? "text-white" : "text-slate-900";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const bodyText = isDark ? "text-slate-200" : "text-slate-700";
  const buttonSecondary = isDark
    ? "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100";
  const inputBg = isDark
    ? "bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500"
    : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400";

  if (loading) {
    return (
      <div className={`min-h-screen ${pageBg}`}>
        <div className={`rounded-2xl border p-6 shadow-sm ${cardBg}`}>
          <p className={`text-sm ${mutedText}`}>Carregando detalhes...</p>
        </div>
      </div>
    );
  }

  if (error && !os) {
    return (
      <div className={`min-h-screen ${pageBg}`}>
        <div className={`rounded-2xl border p-6 shadow-sm ${cardBg}`}>
          <p className="text-sm text-red-500">{error}</p>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`mt-4 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${buttonSecondary}`}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
        </div>
      </div>
    );
  }

  if (!os) {
    return (
      <div className={`min-h-screen ${pageBg}`}>
        <div className={`rounded-2xl border p-6 shadow-sm ${cardBg}`}>
          <p className={`text-sm ${mutedText}`}>Ordem de serviço não encontrada.</p>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`mt-4 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${buttonSecondary}`}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <div className={`rounded-2xl border p-6 shadow-sm ${cardBg}`}>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${titleText}`}>{os.numero}</h1>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className={`text-sm capitalize ${bodyText}`}>{os.tipo}</span>
              <StatusBadge status={os.status} />
              <PrioridadeBadge prioridade={os.prioridade} />
            </div>

            <p className={`mt-3 text-sm ${mutedText}`}>
              Status atual: {formatarStatus(os.status)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${buttonSecondary}`}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
        </div>

        {error && (
          <div
            className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
              isDark
                ? "border-red-900 bg-red-950 text-red-300"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {error}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Section
              title="Descrição"
              icon={<FileText className="h-4 w-4" />}
              cardBg={cardBg}
            >
              <p className={`text-sm ${bodyText}`}>{os.descricao}</p>
            </Section>

            {podeIniciarExecucao && (
              <Section
                title="Iniciar execução"
                icon={<PlayCircle className="h-4 w-4" />}
                cardBg={cardBg}
              >
                <div className="space-y-4">
                  <div>
                    <label className={`mb-2 block text-sm font-medium ${titleText}`}>
                      Observação inicial
                    </label>
                    <textarea
                      rows={4}
                      value={observacaoInicio}
                      onChange={(e) => setObservacaoInicio(e.target.value)}
                      placeholder="Observação opcional ao iniciar a execução"
                      disabled={processandoAcao}
                      className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${inputBg}`}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleIniciarExecucao}
                    disabled={processandoAcao}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <PlayCircle className="h-4 w-4" />
                    {processandoAcao ? "Iniciando..." : "Iniciar execução"}
                  </button>
                </div>
              </Section>
            )}

            {podeFinalizarExecucao && (
              <Section
                title="Finalizar execução"
                icon={<CheckCircle2 className="h-4 w-4" />}
                cardBg={cardBg}
              >
                <div className="space-y-4">
                  <div>
                    <label className={`mb-2 block text-sm font-medium ${titleText}`}>
                      Observação final
                    </label>
                    <textarea
                      rows={4}
                      value={observacaoFim}
                      onChange={(e) => setObservacaoFim(e.target.value)}
                      placeholder="Observação opcional ao finalizar a execução"
                      disabled={processandoAcao}
                      className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${inputBg}`}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleFinalizarExecucao}
                    disabled={processandoAcao}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {processandoAcao ? "Finalizando..." : "Finalizar execução"}
                  </button>
                </div>
              </Section>
            )}

            {podeMarcarNaoExecutada && (
              <Section
                title="Marcar como não executada"
                icon={<FileText className="h-4 w-4" />}
                cardBg={cardBg}
              >
                <div className="space-y-4">
                  <div>
                    <label className={`mb-2 block text-sm font-medium ${titleText}`}>
                      Justificativa *
                    </label>
                    <textarea
                      rows={4}
                      value={motivoNaoExecucao}
                      onChange={(e) => setMotivoNaoExecucao(e.target.value)}
                      placeholder="Informe o motivo pelo qual a OS não foi executada"
                      disabled={processandoAcao}
                      className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-red-500 disabled:opacity-60 ${inputBg}`}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleMarcarNaoExecutada}
                    disabled={processandoAcao}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FileText className="h-4 w-4" />
                    {processandoAcao ? "Salvando..." : "Marcar como não executada"}
                  </button>
                </div>
              </Section>
            )}

            {podeEnviarAnexo && (
              <Section
                title="Enviar evidência"
                icon={<Upload className="h-4 w-4" />}
                cardBg={cardBg}
              >
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className={`mb-2 block text-sm font-medium ${titleText}`}>
                        Tipo do anexo
                      </label>
                      <select
                        value={tipoAnexo}
                        onChange={(e) => setTipoAnexo(e.target.value)}
                        disabled={processandoAcao}
                        className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${inputBg}`}
                      >
                        <option value="foto">Foto</option>
                        <option value="pdf">PDF</option>
                        <option value="arquivo">Arquivo</option>
                      </select>
                    </div>

                    <div>
                      <label className={`mb-2 block text-sm font-medium ${titleText}`}>
                        Arquivo
                      </label>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        disabled={processandoAcao}
                        onChange={(e) =>
                          setArquivoSelecionado(e.target.files?.[0] ?? null)
                        }
                        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${inputBg}`}
                      />
                    </div>
                  </div>

                  {arquivoSelecionado && (
                    <p className={`text-sm ${mutedText}`}>
                      Arquivo selecionado: {arquivoSelecionado.name}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleEnviarAnexo}
                    disabled={processandoAcao || !arquivoSelecionado}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Upload className="h-4 w-4" />
                    {processandoAcao ? "Enviando..." : "Enviar evidência"}
                  </button>
                </div>
              </Section>
            )}

            <Section
              title="Execuções"
              icon={<Wrench className="h-4 w-4" />}
              cardBg={cardBg}
            >
              {os.execucoes?.length ? (
                <div className="space-y-3">
                  {os.execucoes.map((execucao) => (
                    <div
                      key={execucao.id}
                      className={`rounded-xl border px-4 py-3 ${innerCardBg}`}
                    >
                      <p className={`text-sm ${bodyText}`}>
                        <span className={mutedText}>Técnico:</span>{" "}
                        {execucao.tecnico?.name ?? "—"}
                      </p>

                      <p className={`mt-1 text-sm ${bodyText}`}>
                        <span className={mutedText}>Início:</span>{" "}
                        {formatarDataHora(execucao.data_inicio)}
                      </p>

                      <p className={`mt-1 text-sm ${bodyText}`}>
                        <span className={mutedText}>Fim:</span>{" "}
                        {formatarDataHora(execucao.data_fim)}
                      </p>

                      <p className={`mt-3 text-sm ${bodyText}`}>
                        {execucao.observacao ?? "Sem observações registradas."}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-sm ${mutedText}`}>Nenhuma execução registrada.</p>
              )}
            </Section>
          </div>

          <div className="space-y-4">
            <Section
              title="Endereço"
              icon={<MapPin className="h-4 w-4" />}
              cardBg={cardBg}
            >
              {os.endereco ? (
                <div className={`space-y-1 text-sm ${bodyText}`}>
                  <p>
                    {os.endereco.rua}, {os.endereco.numero}
                  </p>
                  {os.endereco.complemento ? <p>{os.endereco.complemento}</p> : null}
                  <p>{os.endereco.bairro}</p>
                  <p>
                    {os.endereco.cidade} - {os.endereco.estado}
                  </p>
                  <p>CEP: {os.endereco.cep}</p>
                </div>
              ) : (
                <p className={`text-sm ${mutedText}`}>Endereço não informado.</p>
              )}
            </Section>

            <Section
              title="Criada por"
              icon={<UserCircle2 className="h-4 w-4" />}
              cardBg={cardBg}
            >
              <p className={`text-sm ${bodyText}`}>{os.criadaPor?.name ?? "—"}</p>
              <p className={`mt-1 text-xs ${mutedText}`}>{os.criadaPor?.email ?? ""}</p>
            </Section>

            <Section
              title="Anexos"
              icon={<Paperclip className="h-4 w-4" />}
              cardBg={cardBg}
            >
              {os.anexos?.length ? (
                <ul className="space-y-2">
                  {os.anexos.map((anexo) => (
                    <li
                      key={anexo.id}
                      className={`rounded-lg border px-3 py-2 text-sm ${innerCardBg} ${bodyText}`}
                    >
                      {anexo.url ? (
                        <a
                          href={anexo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {anexo.caminho ? anexo.caminho.split("/").pop() : anexo.id}
                        </a>
                      ) : anexo.caminho ? (
                        anexo.caminho.split("/").pop()
                      ) : (
                        anexo.id
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={`text-sm ${mutedText}`}>Sem anexos.</p>
              )}
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  icon,
  cardBg,
}: {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
  cardBg: string;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${cardBg}`}>
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-lg font-medium">{title}</h2>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}