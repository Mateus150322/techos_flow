import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  MapPin,
  Moon,
  Paperclip,
  Sun,
  Upload,
  UserCircle2,
  Wrench,
} from "lucide-react";

import {
  formatarDataHora,
  listarLinhasEnderecoOperacional,
  formatarStatus,
} from "./ordemServicoDetalhe.utils";
import { AnexoItemCard } from "./components/AnexoItemCard";
import { EvidenciaUploadPanel } from "./components/EvidenciaUploadPanel";
import { OrdemServicoAcoesPanel } from "./components/OrdemServicoAcoesPanel";
import { useOrdemServicoDetalhe } from "./useOrdemServicoDetalhe";
import { PrioridadeBadge } from "./components/PrioridadeBadge";
import { StatusBadge } from "./components/StatusBadge";
import { useTheme } from "@/shared/hooks/useTheme";

export default function OrdemDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const {
    loading,
    error,
    setError,
    os,
    criadaPor,
    tecnicoResponsavel,
    ultimaExecucaoAberta,
    osEhDeOutroTecnico,
    podeIniciarExecucao,
    podeFinalizarExecucao,
    podeMarcarNaoExecutada,
    podeEnviarAnexo,
    processandoAcao,
    arquivoSelecionado,
    setArquivoSelecionado,
    tipoAnexo,
    selecionarTipoAnexo,
    incluirGeolocalizacao,
    alternarIncluirGeolocalizacao,
    processandoGeolocalizacao,
    geolocalizacaoCapturada,
    atualizarEnderecoCapturado,
    iniciar,
    finalizar,
    marcarComoNaoExecutada,
    capturarGeolocalizacao,
    enviarEvidencia,
  } = useOrdemServicoDetalhe({ ordemId: id });

  async function handleCapturarGeolocalizacao() {
    await capturarGeolocalizacao();
  }

  async function handleEnviarAnexo() {
    await enviarEvidencia();
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
  const temAcoesOperacionais =
    podeIniciarExecucao || podeFinalizarExecucao || podeMarcarNaoExecutada;
  const linhasEndereco = listarLinhasEnderecoOperacional(os?.endereco);
  const enderecoReferencia = linhasEndereco.join("\n");

  if (loading) {
    return (
      <div className={`min-h-screen ${pageBg}`}>
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className={`rounded-2xl border p-6 shadow-sm ${cardBg}`}>
            <p className={`text-sm ${mutedText}`}>Carregando detalhes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !os) {
    return (
      <div className={`min-h-screen ${pageBg}`}>
        <div className="mx-auto max-w-7xl px-4 py-6">
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
      </div>
    );
  }

  if (!os) {
    return (
      <div className={`min-h-screen ${pageBg}`}>
        <div className="mx-auto max-w-7xl px-4 py-6">
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
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className={`rounded-3xl border p-6 shadow-sm ${cardBg}`}>
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={os.status} />
                <PrioridadeBadge prioridade={os.prioridade} />
              </div>

              <h1 className={`mt-3 text-3xl font-bold ${titleText}`}>{os.numero}</h1>
              <p className={`mt-2 text-sm ${mutedText}`}>
                {os.tipo}
                {os.nome_cliente ? ` - ${os.nome_cliente}` : ""}
              </p>
              <p className={`mt-2 text-sm capitalize ${bodyText}`}>
                Status atual: {formatarStatus(os.status)}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${buttonSecondary}`}
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDark ? "Modo claro" : "Modo escuro"}
              </button>

              <button
                type="button"
                onClick={() => navigate(-1)}
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${buttonSecondary}`}
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>
            </div>
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

          {osEhDeOutroTecnico && (
            <div
              className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
                isDark
                  ? "border-amber-900 bg-amber-950 text-amber-200"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              Esta OS está atribuída a {tecnicoResponsavel?.name || "outro técnico"}.
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <Section title="Descrição da OS" icon={<FileText className="h-4 w-4" />} cardBg={cardBg}>
                <p className={`whitespace-pre-wrap text-sm ${bodyText}`}>{os.descricao}</p>
              </Section>

              {temAcoesOperacionais && (
                <Section
                  title="Ações da OS"
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  cardBg={cardBg}
                >
                  <OrdemServicoAcoesPanel
                    variant="page"
                    isDark={isDark}
                    processandoAcao={processandoAcao}
                    podeIniciarExecucao={podeIniciarExecucao}
                    podeFinalizarExecucao={podeFinalizarExecucao}
                    podeMarcarNaoExecutada={podeMarcarNaoExecutada}
                    execucaoAbertaId={ultimaExecucaoAberta?.id}
                    onError={setError}
                    onIniciarExecucao={(observacao) =>
                      iniciar({
                        observacao,
                      })
                    }
                    onFinalizarExecucao={({ execucaoId, observacao }) =>
                      finalizar({
                        execucao_id: execucaoId,
                        observacao,
                      })
                    }
                    onMarcarNaoExecutada={(motivo) =>
                      marcarComoNaoExecutada({
                        motivo_nao_execucao: motivo,
                      })
                    }
                  />
                </Section>
              )}

              {podeEnviarAnexo && (
                <Section
                  title="Enviar evidência"
                  icon={<Upload className="h-4 w-4" />}
                  cardBg={cardBg}
                >
                  <EvidenciaUploadPanel
                    variant="page"
                    isDark={isDark}
                    processandoAcao={processandoAcao}
                    arquivoSelecionado={arquivoSelecionado}
                    setArquivoSelecionado={setArquivoSelecionado}
                    tipoAnexo={tipoAnexo}
                    selecionarTipoAnexo={selecionarTipoAnexo}
                    incluirGeolocalizacao={incluirGeolocalizacao}
                    alternarIncluirGeolocalizacao={alternarIncluirGeolocalizacao}
                    processandoGeolocalizacao={processandoGeolocalizacao}
                    geolocalizacaoCapturada={geolocalizacaoCapturada}
                    atualizarEnderecoCapturado={atualizarEnderecoCapturado}
                    onCapturarGeolocalizacao={handleCapturarGeolocalizacao}
                    onEnviar={handleEnviarAnexo}
                  />
                </Section>
              )}

              <Section title="Execuções" icon={<Wrench className="h-4 w-4" />} cardBg={cardBg}>
                {os.execucoes?.length ? (
                  <div className="space-y-3">
                    {os.execucoes.map((execucao) => (
                      <div
                        key={execucao.id}
                        className={`rounded-xl border px-4 py-3 ${innerCardBg}`}
                      >
                        <p className={`text-sm ${bodyText}`}>
                          <span className={mutedText}>Técnico:</span>{" "}
                          {execucao.tecnico?.name ?? "-"}
                        </p>
                        <p className={`mt-1 text-sm ${bodyText}`}>
                          <span className={mutedText}>Inicio:</span>{" "}
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
              <Section title="Endereço" icon={<MapPin className="h-4 w-4" />} cardBg={cardBg}>
                {linhasEndereco.length ? (
                  <div className={`rounded-xl border px-4 py-4 ${innerCardBg}`}>
                    <p className={`text-xs font-medium uppercase tracking-[0.16em] ${mutedText}`}>
                      Endereço da OS
                    </p>
                    <div className={`mt-3 space-y-1 text-sm ${bodyText}`}>
                      {linhasEndereco.map((linha) => (
                        <p key={linha}>{linha}</p>
                      ))}
                    </div>
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
                <p className={`text-sm ${bodyText}`}>{criadaPor?.name ?? "-"}</p>
                <p className={`mt-1 text-xs ${mutedText}`}>{criadaPor?.email ?? ""}</p>
              </Section>

              <Section title="Anexos" icon={<Paperclip className="h-4 w-4" />} cardBg={cardBg}>
                {os.anexos?.length ? (
                  <ul className="space-y-2">
                    {os.anexos.map((anexo) => (
                      <AnexoItemCard
                        key={anexo.id}
                        anexo={anexo}
                        variant="page"
                        isDark={isDark}
                        wrapper="li"
                        enderecoReferencia={enderecoReferencia}
                      />
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
