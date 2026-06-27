import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { TecnicoDashboardResponse } from "@/modules/dashboard/dashboard.service";

import {
  buscarOrdem,
  getCriadaPor,
  getTecnicoResponsavel,
  type FinalizarExecucaoPayload,
  type GeolocalizacaoAnexoPayload,
  type IniciarExecucaoPayload,
  type MarcarNaoExecutadaPayload,
  type OrdemServicoDetalhe,
} from "./ordensServico.service";
import { ORDEM_SERVICO_DETALHE_INCLUDES } from "./ordemServicoDetalhe.utils";
import { type UserRole, useCurrentUser } from "@/shared/auth/session";
import { useOnlineStatus } from "@/shared/hooks/useOnlineStatus";
import { getOfflineOperation } from "@/shared/offline/database";
import {
  enqueueOfflineOperation,
} from "@/shared/offline/queue";
import { requestOfflineSync } from "@/shared/offline/sync";
import type {
  OfflineOperation,
  OfflineOperationPayloadMap,
  OfflineOperationType,
} from "@/shared/offline/types";
import { queryKeys } from "@/shared/query/queryClient";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import {
  capturarGeolocalizacaoAtual,
  diagnosticarGeolocalizacao,
  preencherEnderecoCapturado,
  type DiagnosticoGeolocalizacao,
  type GeolocalizacaoCapturada,
} from "@/shared/utils/geolocalizacao";

type UseOrdemServicoDetalheOptions = {
  ordemId?: string | null;
  enabled?: boolean;
  fallbackRole?: UserRole;
};

type FeedbackGeolocalizacao = {
  tipo: "sucesso" | "erro";
  mensagem: string;
};

type ActionFeedback = {
  tipo: "sucesso" | "erro";
  mensagem: string;
};

export function useOrdemServicoDetalhe({
  ordemId,
  enabled = true,
  fallbackRole = "atendente",
}: UseOrdemServicoDetalheOptions) {
  const currentUser = useCurrentUser(fallbackRole);
  const queryClient = useQueryClient();
  const online = useOnlineStatus();

  const [error, setError] = useState("");
  const [actionFeedback, setActionFeedback] = useState<ActionFeedback | null>(null);
  const [processandoAcao, setProcessandoAcao] = useState(false);
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File[]>([]);
  const [tipoAnexo, setTipoAnexo] = useState("foto");
  const [incluirGeolocalizacao, setIncluirGeolocalizacao] = useState(true);
  const [processandoGeolocalizacao, setProcessandoGeolocalizacao] = useState(false);
  const [processandoEnderecoCapturado, setProcessandoEnderecoCapturado] = useState(false);
  const [geolocalizacaoCapturada, setGeolocalizacaoCapturada] =
    useState<GeolocalizacaoCapturada | null>(null);
  const [feedbackGeolocalizacao, setFeedbackGeolocalizacao] =
    useState<FeedbackGeolocalizacao | null>(null);
  const [diagnosticoGeolocalizacao] = useState<DiagnosticoGeolocalizacao>(() =>
    diagnosticarGeolocalizacao()
  );

  const buscarDetalheOrdem = useCallback(async () => {
    if (!ordemId) {
      throw new Error("ID não informado.");
    }

    return buscarOrdem(ordemId, [...ORDEM_SERVICO_DETALHE_INCLUDES]);
  }, [ordemId]);

  const ordemQuery = useQuery<OrdemServicoDetalhe>({
    queryKey: queryKeys.ordemServico(ordemId ?? "sem-id"),
    queryFn: buscarDetalheOrdem,
    enabled: enabled && Boolean(ordemId),
  });
  const os = ordemQuery.data ?? null;
  const loading =
    ordemQuery.isPending && ordemQuery.fetchStatus !== "paused";
  const loadError = ordemQuery.error
    ? getApiErrorMessage(ordemQuery.error, "Erro ao carregar OS.")
    : enabled && !ordemId
      ? "ID não informado."
      : !os && ordemQuery.fetchStatus === "paused"
        ? "Sem internet e sem detalhes salvos para esta OS."
        : "";

  const carregarOrdem = useCallback(async () => {
    if (!ordemId) {
      setError("ID não informado.");
      return;
    }

    setError("");
    await queryClient.invalidateQueries({
      queryKey: ["dashboard-tecnico"],
    });

    const result = await ordemQuery.refetch();

    if (result.error) {
      throw result.error;
    }
  }, [ordemId, ordemQuery, queryClient]);

  useEffect(() => {
    setActionFeedback(null);
  }, [ordemId]);

  const criadaPor = useMemo(() => getCriadaPor(os), [os]);
  const tecnicoResponsavel = useMemo(() => getTecnicoResponsavel(os), [os]);

  const ultimaExecucaoAberta = useMemo(() => {
    if (!os?.execucoes?.length) {
      return null;
    }

    return os.execucoes.find((execucao) => !execucao.data_fim) ?? null;
  }, [os]);

  const execucaoRecuperavel = useMemo(() => {
    if (!os?.execucoes?.length || os?.status !== "em_execucao" || ultimaExecucaoAberta) {
      return null;
    }

    return (
      [...os.execucoes]
        .sort((atual, proxima) => {
          const atualTs = new Date(atual.data_fim ?? atual.data_inicio).getTime();
          const proximaTs = new Date(proxima.data_fim ?? proxima.data_inicio).getTime();

          return proximaTs - atualTs;
        })
        .at(0) ?? null
    );
  }, [os, ultimaExecucaoAberta]);

  const execucaoParaFinalizacao = ultimaExecucaoAberta ?? execucaoRecuperavel;

  const tecnicoResponsavelId =
    os?.tecnico_responsavel_id ?? tecnicoResponsavel?.id ?? null;
  const osSemResponsavel = !tecnicoResponsavelId;
  const osEhMinha = !!tecnicoResponsavelId && tecnicoResponsavelId === currentUser.id;
  const osEhDeOutroTecnico =
    !!tecnicoResponsavelId && !!currentUser.id && tecnicoResponsavelId !== currentUser.id;
  const podeAceitar = currentUser.role === "tecnico" && os?.status === "aberta" && osSemResponsavel;
  const podeIniciarExecucao =
    currentUser.role === "tecnico" &&
    os?.status === "aberta" &&
    osEhMinha &&
    !ultimaExecucaoAberta;
  const podeFinalizarExecucao =
    currentUser.role === "tecnico" &&
    os?.status === "em_execucao" &&
    osEhMinha &&
    !!execucaoParaFinalizacao;
  const podeMarcarNaoExecutada =
    currentUser.role === "tecnico" &&
    osEhMinha &&
    (os?.status === "aberta" || os?.status === "em_execucao");
  const podeEnviarAnexo =
    currentUser.role === "tecnico" &&
    osEhMinha &&
    (os?.status === "em_execucao" || os?.status === "finalizada" || os?.status === "nao_executada");

  function atualizarOrdemLocal(
    updater: (current: OrdemServicoDetalhe) => OrdemServicoDetalhe
  ) {
    if (!ordemId) {
      return;
    }

    queryClient.setQueryData<OrdemServicoDetalhe>(
      queryKeys.ordemServico(ordemId),
      (current) => (current ? updater(current) : current)
    );
  }

  function atualizarDashboardLocal(
    patch: Partial<OrdemServicoDetalhe> & { id: string }
  ) {
    queryClient.setQueriesData<TecnicoDashboardResponse>(
      { queryKey: ["dashboard-tecnico"] },
      (current) => {
        if (!current) {
          return current;
        }

        const updateList = (items: typeof current.secoes.disponiveis) =>
          items.map((item) =>
            item.id === patch.id ? { ...item, ...patch } : item
          );

        return {
          ...current,
          secoes: {
            disponiveis: updateList(current.secoes.disponiveis),
            minhas: updateList(current.secoes.minhas),
            em_execucao: updateList(current.secoes.em_execucao),
            finalizadas: updateList(current.secoes.finalizadas),
          },
        };
      }
    );
  }

  async function executarOperacaoOffline<T extends OfflineOperationType>({
    type,
    payload,
    aplicarLocalmente,
    sucesso,
  }: {
    type: T;
    payload: OfflineOperationPayloadMap[T];
    aplicarLocalmente: (operation: OfflineOperation) => void;
    sucesso: string;
  }) {
    if (!os?.id || !currentUser.id) {
      const mensagem = "Não foi possível identificar o técnico ou a OS.";
      setError(mensagem);
      setActionFeedback({ tipo: "erro", mensagem });
      return false;
    }

    try {
      setProcessandoAcao(true);
      setError("");
      setActionFeedback(null);
      const operation = await enqueueOfflineOperation({
        userId: currentUser.id,
        orderId: os.id,
        type,
        payload,
      });

      aplicarLocalmente(operation);

      if (online) {
        await requestOfflineSync();
        const storedOperation = await getOfflineOperation(operation.id);

        if (storedOperation?.status === "failed") {
          await ordemQuery.refetch();
          const mensagem =
            storedOperation.lastError ||
            "Não foi possível sincronizar esta alteração.";
          setError(mensagem);
          setActionFeedback({ tipo: "erro", mensagem });
          return false;
        }

        if (
          !storedOperation ||
          storedOperation.status === "completed"
        ) {
          await carregarOrdem();
          setActionFeedback({ tipo: "sucesso", mensagem: sucesso });
          return true;
        }
      }

      const mensagem =
        "Alteração salva neste aparelho e aguardando sincronização.";
      setActionFeedback({ tipo: "sucesso", mensagem });
      return true;
    } catch (actionError) {
      const mensagem = getApiErrorMessage(
        actionError,
        "Não foi possível salvar a alteração no aparelho."
      );
      setError(mensagem);
      setActionFeedback({ tipo: "erro", mensagem });
      return false;
    } finally {
      setProcessandoAcao(false);
    }
  }

  async function aceitar() {
    return executarOperacaoOffline({
      type: "accept_order",
      payload: {},
      aplicarLocalmente: () => {
        atualizarOrdemLocal((current) => ({
          ...current,
          tecnico_responsavel_id: currentUser.id,
          tecnicoResponsavel: {
            id: currentUser.id!,
            name: currentUser.name,
            email: currentUser.email ?? "",
            role: "tecnico",
          },
        }));
        atualizarDashboardLocal({
          id: os!.id,
          tecnico_responsavel_id: currentUser.id,
          tecnicoResponsavel: {
            id: currentUser.id!,
            name: currentUser.name,
            email: currentUser.email ?? "",
            role: "tecnico",
          },
        });
      },
      sucesso: "Ordem de serviço aceita com sucesso.",
    });
  }

  async function iniciar(payload?: IniciarExecucaoPayload) {
    const inicioPayload = payload ?? {};

    return executarOperacaoOffline({
      type: "start_execution",
      payload: inicioPayload,
      aplicarLocalmente: (operation) => {
        atualizarOrdemLocal((current) => ({
          ...current,
          status: "em_execucao",
          execucoes: [
            {
              id: `offline:${operation.id}`,
              os_id: current.id,
              tecnico_id: currentUser.id!,
              data_inicio: inicioPayload.data_inicio ?? new Date().toISOString(),
              data_fim: null,
              observacao: inicioPayload.observacao ?? null,
              tecnico: {
                id: currentUser.id!,
                name: currentUser.name,
                email: currentUser.email ?? "",
                role: "tecnico",
              },
            },
            ...(current.execucoes ?? []),
          ],
        }));
        atualizarDashboardLocal({
          id: os!.id,
          status: "em_execucao",
        });
      },
      sucesso: "Execução iniciada com sucesso.",
    });
  }

  async function finalizar(payload: FinalizarExecucaoPayload) {
    const dataFim = payload.data_fim ?? new Date().toISOString();

    return executarOperacaoOffline({
      type: "finish_execution",
      payload,
      aplicarLocalmente: () => {
        atualizarOrdemLocal((current) => ({
          ...current,
          status: "finalizada",
          data_encerramento: dataFim,
          execucoes: (current.execucoes ?? []).map((execucao) =>
            execucao.id === payload.execucao_id
              ? {
                  ...execucao,
                  data_fim: dataFim,
                  observacao: payload.observacao ?? execucao.observacao,
                  diagnostico: payload.diagnostico,
                  procedimento: payload.procedimento,
                  material_utilizado: payload.material_utilizado ?? null,
                }
              : execucao
          ),
        }));
        atualizarDashboardLocal({
          id: os!.id,
          status: "finalizada",
          data_encerramento: dataFim,
        });
      },
      sucesso: "Execução finalizada com sucesso.",
    });
  }

  async function marcarComoNaoExecutada(payload: MarcarNaoExecutadaPayload) {
    return executarOperacaoOffline({
      type: "mark_not_executed",
      payload,
      aplicarLocalmente: () => {
        atualizarOrdemLocal((current) => ({
          ...current,
          status: "nao_executada",
          data_encerramento: new Date().toISOString(),
          motivo_nao_execucao: payload.motivo_nao_execucao,
        }));
        atualizarDashboardLocal({
          id: os!.id,
          status: "nao_executada",
          motivo_nao_execucao: payload.motivo_nao_execucao,
        });
      },
      sucesso: "Ordem de serviço marcada como não executada.",
    });
  }

  async function capturarGeolocalizacao() {
    try {
      setProcessandoGeolocalizacao(true);
      setError("");
      setFeedbackGeolocalizacao(null);

      if (!diagnosticoGeolocalizacao.disponivel) {
        throw new Error(
          diagnosticoGeolocalizacao.mensagem ||
            "Não foi possível capturar a geolocalização neste dispositivo."
        );
      }

      const geolocalizacao = await capturarGeolocalizacaoAtual();
      setGeolocalizacaoCapturada(geolocalizacao);
      setFeedbackGeolocalizacao({
        tipo: "sucesso",
        mensagem:
          typeof geolocalizacao.precisaoMetros === "number"
            ? geolocalizacao.precisaoMetros <= 100
              ? `Localização capturada com precisão de ${Math.round(geolocalizacao.precisaoMetros)} m. Buscando endereço...`
              : `Localização aproximada capturada com precisão de ${Math.round(geolocalizacao.precisaoMetros)} m. Usando a melhor posição encontrada e buscando endereço...`
            : "Localização capturada com sucesso. Buscando endereço...",
      });

      void enriquecerEnderecoDaGeolocalizacao(geolocalizacao);
      return geolocalizacao;
    } catch (captureError) {
      const mensagem = getApiErrorMessage(
        captureError,
        "Não foi possível capturar a geolocalização para esta evidência."
      );

      setError(mensagem);
      setFeedbackGeolocalizacao({
        tipo: "erro",
        mensagem,
      });
      return null;
    } finally {
      setProcessandoGeolocalizacao(false);
    }
  }

  async function enriquecerEnderecoDaGeolocalizacao(geolocalizacao: GeolocalizacaoCapturada) {
    try {
      setProcessandoEnderecoCapturado(true);

      const geolocalizacaoComEndereco = await preencherEnderecoCapturado(geolocalizacao);

      setGeolocalizacaoCapturada((atual) => {
        if (!atual) {
          return geolocalizacaoComEndereco;
        }

        const mesmaCaptura =
          atual.capturadaEm === geolocalizacao.capturadaEm &&
          atual.latitude === geolocalizacao.latitude &&
          atual.longitude === geolocalizacao.longitude;

        return mesmaCaptura ? geolocalizacaoComEndereco : atual;
      });

      if (geolocalizacaoComEndereco.endereco || geolocalizacaoComEndereco.cidade) {
        setFeedbackGeolocalizacao({
          tipo: "sucesso",
          mensagem:
            typeof geolocalizacaoComEndereco.precisaoMetros === "number"
              ? geolocalizacaoComEndereco.precisaoMetros <= 100
                ? `Localização capturada com precisão de ${Math.round(geolocalizacaoComEndereco.precisaoMetros)} m e endereço identificado.`
                : `Localização aproximada capturada com precisão de ${Math.round(geolocalizacaoComEndereco.precisaoMetros)} m e endereço identificado.`
              : "Localização capturada e endereço identificado.",
        });
      }
    } finally {
      setProcessandoEnderecoCapturado(false);
    }
  }

  async function enviarEvidencia() {
    if (!os?.id || arquivoSelecionado.length === 0) {
      setError("Selecione pelo menos um arquivo para enviar.");
      setFeedbackGeolocalizacao(null);
      return false;
    }

    if (!currentUser.id) {
      setError("Não foi possível identificar o técnico responsável pelo envio.");
      return false;
    }

    try {
      setProcessandoAcao(true);
      setError("");
      setFeedbackGeolocalizacao(null);

      let payload: string | GeolocalizacaoAnexoPayload = tipoAnexo;

      if (tipoAnexo === "foto" && incluirGeolocalizacao) {
        const geolocalizacao =
          geolocalizacaoCapturada ?? (await capturarGeolocalizacao());

        if (!geolocalizacao) {
          const mensagem = "Capture a localização da evidência antes de enviar a foto.";

          setError(mensagem);
          setFeedbackGeolocalizacao({
            tipo: "erro",
            mensagem,
          });
          return false;
        }

        setGeolocalizacaoCapturada(geolocalizacao);

        payload = {
          tipo: tipoAnexo,
          latitude: geolocalizacao.latitude,
          longitude: geolocalizacao.longitude,
          precisao_metros: geolocalizacao.precisaoMetros,
          geolocalizacao_capturada_em: geolocalizacao.capturadaEm,
          rua_capturada: geolocalizacao.rua?.trim() || undefined,
          bairro_capturado: geolocalizacao.bairro?.trim() || undefined,
          cidade_capturada: geolocalizacao.cidade?.trim() || undefined,
          estado_capturado: geolocalizacao.estado?.trim() || undefined,
          endereco_capturado: geolocalizacao.endereco?.trim() || undefined,
        };
      }

      const arquivoInvalido = arquivoSelecionado.find(
        (arquivo) => arquivo.size > 5 * 1024 * 1024
      );

      if (arquivoInvalido) {
        setError(`O arquivo "${arquivoInvalido.name}" ultrapassa o limite de 5 MB.`);
        return false;
      }

      const operations: OfflineOperation[] = [];

      for (const arquivo of arquivoSelecionado) {
        const operation = await enqueueOfflineOperation({
          userId: currentUser.id,
          orderId: os.id,
          type: "upload_attachment",
          payload: {
            file: {
              blob: arquivo,
              name: arquivo.name,
              type: arquivo.type,
              lastModified: arquivo.lastModified,
            },
            metadata: payload,
          },
        });
        operations.push(operation);
      }

      atualizarOrdemLocal((current) => ({
        ...current,
        anexos: [
          ...(current.anexos ?? []),
          ...operations.map((operation, index) => {
            const arquivo = arquivoSelecionado[index];
            const metadata =
              typeof payload === "string" ? { tipo: payload } : payload;

            return {
              id: `offline:${operation.id}`,
              nome_arquivo: arquivo?.name,
              tipo: metadata.tipo ?? tipoAnexo,
              latitude: metadata.latitude,
              longitude: metadata.longitude,
              precisao_metros: metadata.precisao_metros,
              geolocalizacao_capturada_em:
                metadata.geolocalizacao_capturada_em,
              rua_capturada: metadata.rua_capturada,
              bairro_capturado: metadata.bairro_capturado,
              cidade_capturada: metadata.cidade_capturada,
              estado_capturado: metadata.estado_capturado,
              endereco_capturado: metadata.endereco_capturado,
              sincronizacao_pendente: true,
            };
          }),
        ],
      }));

      setArquivoSelecionado([]);
      setTipoAnexo("foto");
      setIncluirGeolocalizacao(true);
      setGeolocalizacaoCapturada(null);
      setFeedbackGeolocalizacao(null);
      setProcessandoEnderecoCapturado(false);
      if (online) {
        await requestOfflineSync();
        const storedOperations = await Promise.all(
          operations.map((operation) => getOfflineOperation(operation.id))
        );
        const failedOperation = storedOperations.find(
          (operation) => operation?.status === "failed"
        );

        if (failedOperation) {
          await ordemQuery.refetch();
          setError(
            failedOperation.lastError ||
              "Não foi possível sincronizar uma das evidências."
          );
          return false;
        }

        await carregarOrdem();
      } else {
        setActionFeedback({
          tipo: "sucesso",
          mensagem: `${operations.length} evidência(s) salva(s) no aparelho e aguardando sincronização.`,
        });
      }

      return true;
    } catch (uploadError) {
      setError(getApiErrorMessage(uploadError, "Não foi possível enviar o anexo."));
      return false;
    } finally {
      setProcessandoAcao(false);
    }
  }

  function selecionarTipoAnexo(proximoTipo: string) {
    setTipoAnexo(proximoTipo);
    setFeedbackGeolocalizacao(null);

    if (proximoTipo !== "foto") {
      setIncluirGeolocalizacao(false);
      setGeolocalizacaoCapturada(null);
      setProcessandoEnderecoCapturado(false);
      return;
    }

    setIncluirGeolocalizacao(true);
  }

  function alternarIncluirGeolocalizacao(ativo: boolean) {
    setIncluirGeolocalizacao(ativo);
    setFeedbackGeolocalizacao(null);

    if (!ativo) {
      setGeolocalizacaoCapturada(null);
      setProcessandoEnderecoCapturado(false);
    }
  }

  function atualizarEnderecoCapturado(value: string) {
    setGeolocalizacaoCapturada((current) =>
      current
        ? {
            ...current,
            endereco: value,
          }
        : current
    );
  }

  return {
    currentUser,
    loading,
    error: error || loadError,
    setError,
    actionFeedback,
    setActionFeedback,
    os,
    criadaPor,
    tecnicoResponsavel,
    ultimaExecucaoAberta,
    execucaoParaFinalizacao,
    osSemResponsavel,
    osEhMinha,
    osEhDeOutroTecnico,
    podeAceitar,
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
    processandoEnderecoCapturado,
    geolocalizacaoCapturada,
    feedbackGeolocalizacao,
    diagnosticoGeolocalizacao,
    atualizarEnderecoCapturado,
    carregarOrdem,
    aceitar,
    iniciar,
    finalizar,
    marcarComoNaoExecutada,
    capturarGeolocalizacao,
    enviarEvidencia,
  };
}




