import { api } from "@/shared/api/client";
import type { OrdemServico } from "@/modules/ordensServico/ordensServico.service";

export type AdminDashboardResponse = {
  resumo: {
    total: number;
    abertas: number;
    em_execucao: number;
    finalizadas: number;
    nao_executadas: number;
    canceladas: number;
    pendentes: number;
    tempo_medio_horas: number | null;
  };
  distribuicao_status: Array<{
    status: string;
    label: string;
    quantidade: number;
    percentual: number;
  }>;
  tipos_breakdown: Array<{
    tipo: string;
    total: number;
  }>;
  produtividade_tecnicos: Array<{
    id: string;
    nome: string;
    atribuidas: number;
    finalizadas: number;
  }>;
  resumo_mes_atual: {
    abertas: number;
    em_execucao: number;
    finalizadas: number;
    tecnicos_ativos: number;
  };
  atividade_recente: OrdemServico[];
};

export type AtendenteDashboardResponse = {
  resumo: {
    total: number;
    abertas: number;
    em_execucao: number;
    encerradas: number;
  };
  secoes: {
    abertas: OrdemServico[];
    em_execucao: OrdemServico[];
    encerradas: OrdemServico[];
  };
};

export type TecnicoDashboardResponse = {
  resumo: {
    disponiveis: number;
    minhas: number;
    em_execucao: number;
    concluidas: number;
    total_filtrado: number;
  };
  secoes: {
    disponiveis: OrdemServico[];
    minhas: OrdemServico[];
    em_execucao: OrdemServico[];
    finalizadas: OrdemServico[];
  };
};

export async function buscarDashboardAdmin() {
  const { data } = await api.get<AdminDashboardResponse>("/dashboard/admin");
  return data;
}

export async function buscarDashboardAtendente(q?: string) {
  const { data } = await api.get<AtendenteDashboardResponse>("/dashboard/atendente", {
    params: {
      q: q?.trim() || undefined,
    },
  });

  return data;
}

export async function buscarDashboardTecnico(q?: string) {
  const { data } = await api.get<TecnicoDashboardResponse>("/dashboard/tecnico", {
    params: {
      q: q?.trim() || undefined,
    },
  });

  return data;
}
