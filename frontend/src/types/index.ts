export type PerfilUsuario = "atendente" | "tecnico" | "administrador";

export type StatusOS =
  | "aberta"
  | "em_execucao"
  | "finalizada"
  | "nao_executada"
  | "cancelada";

export type TipoOS =
  | "manutencao"
  | "instalacao"
  | "vistoria"
  | "leitura"
  | "reparo"
  | "eta_ete";

export type UnidadeEtaEte = "CR" | "ETA" | "EEE" | "ETE" | "CAPITACAO";

export type TipoManutencao = "preventiva" | "corretiva";

export type MotivoNaoResolucao =
  | "falta_equipamento"
  | "falta_ferramenta"
  | "motivo_externo"
  | "outro_setor";

export interface Usuario {
  id: string;
  name: string;
  email: string;
  role: PerfilUsuario;
  active?: boolean;
  createdAt?: Date;
}

export interface EnderecoOS {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

export interface EvidenciaExecucao {
  id: string;
  nome_arquivo: string;
  url_arquivo: string;
  enviado_em: Date;
  enviado_por: string;
}

export interface ExecucaoOS {
  executado_em: Date;
  tecnico: string;
  observacoes: string;
  evidencias: EvidenciaExecucao[];
}

export interface DadosEtaEte {
  data_chamada: Date;
  hora_inicio?: string;
  hora_fim?: string;
  data_final?: Date;
  unidade: UnidadeEtaEte;
  local: string;
  setor_requisitante: string;
  encarregado: string;
  equipe: string;
  tipo_manutencao: TipoManutencao;
  servico: string;
  equipamento: string;
  diagnostico: string;
  procedimento: string;
  material_utilizado: string;
  resolucao: boolean;
  motivo_nao_resolucao?: MotivoNaoResolucao;
}

export interface OrdemServico {
  id: string;
  numero: string;
  tipo: TipoOS;
  status: StatusOS;
  nome_cliente?: string;
  endereco?: EnderecoOS;
  descricao: string;
  data_abertura: Date;
  criada_por: string;
  atribuida_para?: string;
  execucao?: ExecucaoOS;
  data_encerramento?: Date;
  dados_eta_ete?: DadosEtaEte;
}