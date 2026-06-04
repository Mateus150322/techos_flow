import { useCallback, useEffect, useMemo, useState } from "react";

import {
  aceitarOrdem,
  buscarOrdem,
  enviarAnexo,
  finalizarExecucao,
  getCriadaPor,
  getTecnicoResponsavel,
  iniciarExecucao,
  marcarNaoExecutada,
  type FinalizarExecucaoPayload,
  type GeolocalizacaoAnexoPayload,
  type IniciarExecucaoPayload,
  type MarcarNaoExecutadaPayload,
  type OrdemServicoDetalhe,
} from "./ordensServico.service";
import { ORDEM_SERVICO_DETALHE_INCLUDES } from "./ordemServicoDetalhe.utils";
import { type UserRole, useCurrentUser } from "@/shared/auth/session";
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

  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState("");
  const [actionFeedback, setActionFeedback] = useState<ActionFeedback | null>(null);
  const [os, setOs] = useState<OrdemServicoDetalhe | null>(null);
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

  const carregarOrdem = useCallback(async () => {
    if (!ordemId) {
      setOs(null);
      setLoading(false);
      setError("ID não informado.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await buscarOrdem(ordemId, [...ORDEM_SERVICO_DETALHE_INCLUDES]);
      setOs(data);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Erro ao carregar OS."));
    } finally {
      setLoading(false);
    }
  }, [ordemId]);

  useEffect(() => {
    if (!enabled || !ordemId) {
      return;
    }

    void carregarOrdem();
  }, [carregarOrdem, enabled, ordemId]);

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

  async function executarAcao(
    fn: () => Promise<void>,
    fallback: string,
    sucesso: string
  ) {
    try {
      setProcessandoAcao(true);
      setError("");
      setActionFeedback(null);
      await fn();
      await carregarOrdem();
      setActionFeedback({ tipo: "sucesso", mensagem: sucesso });
      return true;
    } catch (actionError) {
      const mensagem = getApiErrorMessage(actionError, fallback);
      setError(mensagem);
      setActionFeedback({ tipo: "erro", mensagem });
      return false;
    } finally {
      setProcessandoAcao(false);
    }
  }

  async function aceitar() {
    if (!os?.id) {
      return false;
    }

    return executarAcao(
      () => aceitarOrdem(os.id),
      "Não foi possível aceitar a OS.",
      "Ordem de serviço aceita com sucesso."
    );
  }

  async function iniciar(payload?: IniciarExecucaoPayload) {
    if (!os?.id) {
      return false;
    }

    return executarAcao(
      () => iniciarExecucao(os.id, payload ?? {}),
      "Não foi possível iniciar a execução.",
      "Execução iniciada com sucesso."
    );
  }

  async function finalizar(payload: FinalizarExecucaoPayload) {
    if (!os?.id) {
      return false;
    }

    return executarAcao(
      () => finalizarExecucao(os.id, payload),
      "Não foi possível finalizar a execução.",
      "Execução finalizada com sucesso."
    );
  }

  async function marcarComoNaoExecutada(payload: MarcarNaoExecutadaPayload) {
    if (!os?.id) {
      return false;
    }

    return executarAcao(
      () => marcarNaoExecutada(os.id, payload),
      "Não foi possível marcar a OS como não executada.",
      "Ordem de serviço marcada como não executada."
    );
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

      let arquivosEnviados = 0;

      for (const arquivo of arquivoSelecionado) {
        try {
          await enviarAnexo(os.id, arquivo, payload);
          arquivosEnviados += 1;
        } catch (uploadError) {
          if (arquivosEnviados > 0) {
            await carregarOrdem();
            setArquivoSelecionado([]);
            setError(
              `${arquivosEnviados} arquivo(s) foram enviados antes da falha em "${arquivo.name}".`
            );
            return false;
          }

          throw uploadError;
        }
      }

      setArquivoSelecionado([]);
      setTipoAnexo("foto");
      setIncluirGeolocalizacao(true);
      setGeolocalizacaoCapturada(null);
      setFeedbackGeolocalizacao(null);
      setProcessandoEnderecoCapturado(false);
      await carregarOrdem();

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
    error,
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




