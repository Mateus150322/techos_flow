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
  type GeolocalizacaoCapturada,
} from "@/shared/utils/geolocalizacao";

type UseOrdemServicoDetalheOptions = {
  ordemId?: string | null;
  enabled?: boolean;
  fallbackRole?: UserRole;
};

export function useOrdemServicoDetalhe({
  ordemId,
  enabled = true,
  fallbackRole = "atendente",
}: UseOrdemServicoDetalheOptions) {
  const currentUser = useCurrentUser(fallbackRole);

  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState("");
  const [os, setOs] = useState<OrdemServicoDetalhe | null>(null);
  const [processandoAcao, setProcessandoAcao] = useState(false);
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [tipoAnexo, setTipoAnexo] = useState("foto");
  const [incluirGeolocalizacao, setIncluirGeolocalizacao] = useState(true);
  const [processandoGeolocalizacao, setProcessandoGeolocalizacao] = useState(false);
  const [geolocalizacaoCapturada, setGeolocalizacaoCapturada] =
    useState<GeolocalizacaoCapturada | null>(null);

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

  const criadaPor = useMemo(() => getCriadaPor(os), [os]);
  const tecnicoResponsavel = useMemo(() => getTecnicoResponsavel(os), [os]);

  const ultimaExecucaoAberta = useMemo(() => {
    if (!os?.execucoes?.length) {
      return null;
    }

    return os.execucoes.find((execucao) => !execucao.data_fim) ?? null;
  }, [os]);

  const tecnicoResponsavelId = os?.tecnico_responsavel_id ?? tecnicoResponsavel?.id ?? null;
  const osSemResponsavel = !tecnicoResponsavelId;
  const osEhMinha = !!tecnicoResponsavelId && tecnicoResponsavelId === currentUser.id;
  const osEhDeOutroTecnico =
    !!tecnicoResponsavelId && !!currentUser.id && tecnicoResponsavelId !== currentUser.id;
  const podeAceitar = currentUser.role === "tecnico" && os?.status === "aberta" && osSemResponsavel;
  const podeIniciarExecucao =
    currentUser.role === "tecnico" && os?.status === "aberta" && osEhMinha && !ultimaExecucaoAberta;
  const podeFinalizarExecucao =
    currentUser.role === "tecnico" &&
    os?.status === "em_execucao" &&
    osEhMinha &&
    !!ultimaExecucaoAberta;
  const podeMarcarNaoExecutada =
    currentUser.role === "tecnico" &&
    osEhMinha &&
    (os?.status === "aberta" || os?.status === "em_execucao");
  const podeEnviarAnexo =
    currentUser.role === "tecnico" &&
    osEhMinha &&
    (os?.status === "em_execucao" || os?.status === "finalizada" || os?.status === "nao_executada");

  async function executarAcao(fn: () => Promise<void>, fallback: string) {
    try {
      setProcessandoAcao(true);
      setError("");
      await fn();
      await carregarOrdem();
      return true;
    } catch (actionError) {
      setError(getApiErrorMessage(actionError, fallback));
      return false;
    } finally {
      setProcessandoAcao(false);
    }
  }

  async function aceitar() {
    if (!os?.id) {
      return false;
    }

    return executarAcao(() => aceitarOrdem(os.id), "Não foi possível aceitar a OS.");
  }

  async function iniciar(payload?: IniciarExecucaoPayload) {
    if (!os?.id) {
      return false;
    }

    return executarAcao(
      () => iniciarExecucao(os.id, payload ?? {}),
      "Não foi possível iniciar a execução."
    );
  }

  async function finalizar(payload: FinalizarExecucaoPayload) {
    if (!os?.id) {
      return false;
    }

    return executarAcao(
      () => finalizarExecucao(os.id, payload),
      "Não foi possível finalizar a execução."
    );
  }

  async function marcarComoNaoExecutada(payload: MarcarNaoExecutadaPayload) {
    if (!os?.id) {
      return false;
    }

    return executarAcao(
      () => marcarNaoExecutada(os.id, payload),
      "Não foi possível marcar a OS como não executada."
    );
  }

  async function capturarGeolocalizacao() {
    try {
      setProcessandoGeolocalizacao(true);
      setError("");

      const geolocalizacao = await capturarGeolocalizacaoAtual();
      setGeolocalizacaoCapturada(geolocalizacao);
      return geolocalizacao;
    } catch (captureError) {
      setError(
        getApiErrorMessage(
          captureError,
          "Não foi possível capturar a geolocalização para esta evidência."
        )
      );
      return null;
    } finally {
      setProcessandoGeolocalizacao(false);
    }
  }

  async function enviarEvidencia() {
    if (!os?.id || !arquivoSelecionado) {
      setError("Selecione um arquivo para enviar.");
      return false;
    }

    try {
      setProcessandoAcao(true);
      setError("");

      let payload: string | GeolocalizacaoAnexoPayload = tipoAnexo;

      if (tipoAnexo === "foto" && incluirGeolocalizacao) {
        const geolocalizacao = geolocalizacaoCapturada ?? (await capturarGeolocalizacaoAtual());

        setGeolocalizacaoCapturada(geolocalizacao);

        payload = {
          tipo: tipoAnexo,
          latitude: geolocalizacao.latitude,
          longitude: geolocalizacao.longitude,
          precisao_metros: geolocalizacao.precisaoMetros,
          geolocalizacao_capturada_em: geolocalizacao.capturadaEm,
          endereco_capturado: geolocalizacao.endereco?.trim() || undefined,
        };
      }

      await enviarAnexo(os.id, arquivoSelecionado, payload);

      setArquivoSelecionado(null);
      setTipoAnexo("foto");
      setIncluirGeolocalizacao(true);
      setGeolocalizacaoCapturada(null);
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

    if (proximoTipo !== "foto") {
      setIncluirGeolocalizacao(false);
      setGeolocalizacaoCapturada(null);
      return;
    }

    setIncluirGeolocalizacao(true);
  }

  function alternarIncluirGeolocalizacao(ativo: boolean) {
    setIncluirGeolocalizacao(ativo);

    if (!ativo) {
      setGeolocalizacaoCapturada(null);
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
    os,
    criadaPor,
    tecnicoResponsavel,
    ultimaExecucaoAberta,
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
    geolocalizacaoCapturada,
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
