import { useState, type FormEvent, type ReactNode } from "react";
import { Loader2, PlusCircle } from "lucide-react";

import {
  getApiErrorMessage,
  getApiValidationErrors,
} from "@/shared/utils/apiError";
import {
  criarOrdem,
  type OrdemServicoDetalhe,
} from "../ordensServico.service";

type FormularioOSData = {
  dataAbertura: string;
  horaAbertura: string;
  tipoServico: string;
  nomeCliente: string;
  prioridade: string;
  descricao: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
};

type FormularioOSGeralProps = {
  onCriada?: (ordem: OrdemServicoDetalhe) => void;
  titulo?: string;
  descricao?: string;
  mobileNavOffset?: boolean;
};

function getDataAtualLocal() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function getHoraAtualLocal() {
  return new Date().toTimeString().slice(0, 5);
}

const initialForm: FormularioOSData = {
  dataAbertura: getDataAtualLocal(),
  horaAbertura: getHoraAtualLocal(),
  tipoServico: "",
  nomeCliente: "",
  prioridade: "2",
  descricao: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  cep: "",
};

export default function FormularioOSGeral({
  onCriada,
  titulo = "Nova Ordem de Servico",
  descricao = "Preencha os dados para criar uma nova OS.",
  mobileNavOffset = false,
}: FormularioOSGeralProps) {
  const [form, setForm] = useState<FormularioOSData>(initialForm);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  function updateField<K extends keyof FormularioOSData>(
    field: K,
    value: FormularioOSData[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function formatarCep(value: string) {
    const apenasNumeros = value.replace(/\D/g, "").slice(0, 8);

    if (apenasNumeros.length <= 5) {
      return apenasNumeros;
    }

    return `${apenasNumeros.slice(0, 5)}-${apenasNumeros.slice(5)}`;
  }

  function formatarEstado(value: string) {
    return value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 2);
  }

  function montarDataAbertura() {
    if (!form.dataAbertura || !form.horaAbertura) {
      return "";
    }

    return `${form.dataAbertura}T${form.horaAbertura}`;
  }

  function validarFormulario() {
    if (!form.dataAbertura) return "Informe a data de abertura.";
    if (!form.horaAbertura) return "Informe a hora de abertura.";
    if (!form.tipoServico.trim()) return "Informe o tipo de serviço.";
    if (!form.nomeCliente.trim()) return "Informe o nome do cliente.";
    if (!form.prioridade.trim()) return "Informe a prioridade.";
    if (!form.descricao.trim()) return "Informe a descrição do serviço.";
    if (!form.logradouro.trim()) return "Informe o logradouro.";
    if (!form.numero.trim()) return "Informe o número.";
    if (!form.bairro.trim()) return "Informe o bairro.";
    if (!form.cidade.trim()) return "Informe a cidade.";
    if (!form.estado.trim()) return "Informe o estado.";
    if (form.estado.trim().length !== 2) return "Informe a UF com 2 letras.";
    if (!form.cep.trim()) return "Informe o CEP.";
    if (form.cep.replace(/\D/g, "").length !== 8) return "Informe um CEP válido.";

    return "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");

    const mensagemErro = validarFormulario();

    if (mensagemErro) {
      setErro(mensagemErro);
      return;
    }

    try {
      setEnviando(true);

      const ordemCriada = await criarOrdem({
        data_abertura: montarDataAbertura(),
        tipo_servico: form.tipoServico.trim(),
        nome_cliente: form.nomeCliente.trim(),
        prioridade: Number(form.prioridade),
        descricao: form.descricao.trim(),
        endereco: {
          logradouro: form.logradouro.trim(),
          numero: form.numero.trim(),
          complemento: form.complemento.trim(),
          bairro: form.bairro.trim(),
          cidade: form.cidade.trim(),
          estado: form.estado.trim().toUpperCase(),
          cep: form.cep.replace(/\D/g, ""),
        },
      });

      setForm({
        ...initialForm,
        dataAbertura: getDataAtualLocal(),
        horaAbertura: getHoraAtualLocal(),
      });
      onCriada?.(ordemCriada);
    } catch (error) {
      const errors = getApiValidationErrors(error);
      const message = getApiErrorMessage(error, "");

      setErro(
        errors?.data_abertura?.[0] ||
          errors?.tipo_servico?.[0] ||
          errors?.nome_cliente?.[0] ||
          errors?.prioridade?.[0] ||
          errors?.descricao?.[0] ||
          errors?.["endereco.logradouro"]?.[0] ||
          errors?.["endereco.numero"]?.[0] ||
          errors?.["endereco.bairro"]?.[0] ||
          errors?.["endereco.cidade"]?.[0] ||
          errors?.["endereco.estado"]?.[0] ||
          errors?.["endereco.cep"]?.[0] ||
          message ||
          "Não foi possível criar a ordem de serviço."
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="app-card rounded-[1.5rem] p-4 sm:rounded-[1.85rem] sm:p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[var(--text-main)] sm:text-2xl">{titulo}</h2>
        <p className="app-muted mt-2 text-sm">{descricao}</p>
        <p className="app-muted mt-3 text-xs uppercase tracking-[0.16em]">
          Campos marcados com * sao obrigatorios
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className={`space-y-6 ${mobileNavOffset ? "pb-40" : "pb-24"} sm:space-y-8 sm:pb-0`}
        aria-busy={enviando}
      >
        {erro ? (
          <div className="app-alert-danger rounded-xl px-4 py-3 text-sm" role="alert" aria-live="assertive">{erro}</div>
        ) : null}

        <section className="app-section-soft rounded-[1.2rem] p-4 sm:rounded-[1.35rem] sm:p-5">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-[var(--text-main)] sm:text-xl">Dados da OS</h3>
            <p className="app-muted mt-1 text-sm">
              Registre a abertura da OS e identifique a solicitacao.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-6">
            <FormField label="Data de abertura *" htmlFor="dataAbertura">
              <input
                id="dataAbertura"
                type="date"
                value={form.dataAbertura}
                onChange={(event) => updateField("dataAbertura", event.target.value)}
                disabled={enviando}
                className="app-input px-4 py-3 disabled:opacity-60"
              />
            </FormField>

            <FormField label="Hora de abertura *" htmlFor="horaAbertura">
              <input
                id="horaAbertura"
                type="time"
                value={form.horaAbertura}
                onChange={(event) => updateField("horaAbertura", event.target.value)}
                disabled={enviando}
                className="app-input px-4 py-3 disabled:opacity-60"
              />
            </FormField>

            <FormField label="Tipo de servico *" htmlFor="tipoServico">
              <select
                id="tipoServico"
                value={form.tipoServico}
                onChange={(event) => updateField("tipoServico", event.target.value)}
                disabled={enviando}
                className="app-input px-4 py-3 disabled:opacity-60"
              >
                <option value="">Selecione o tipo</option>
                <option value="manutencao">Manutencao</option>
                <option value="instalacao">Instalacao</option>
                <option value="vistoria">Vistoria</option>
                <option value="leitura">Leitura</option>
                <option value="reparo">Reparo</option>
              </select>
            </FormField>

            <FormField label="Prioridade *" htmlFor="prioridade">
              <select
                id="prioridade"
                value={form.prioridade}
                onChange={(event) => updateField("prioridade", event.target.value)}
                disabled={enviando}
                className="app-input px-4 py-3 disabled:opacity-60"
              >
                <option value="1">Alta</option>
                <option value="2">Media</option>
                <option value="3">Baixa</option>
              </select>
            </FormField>
          </div>

          <div className="mt-4 sm:mt-6">
            <FormField label="Nome do cliente *" htmlFor="nomeCliente">
              <input
                id="nomeCliente"
                type="text"
                value={form.nomeCliente}
                onChange={(event) => updateField("nomeCliente", event.target.value)}
                disabled={enviando}
                className="app-input px-4 py-3 disabled:opacity-60"
              />
            </FormField>
          </div>

          <div className="mt-4 sm:mt-6">
            <FormField label="Descricao do servico *" htmlFor="descricao">
              <textarea
                id="descricao"
                rows={4}
                value={form.descricao}
                onChange={(event) => updateField("descricao", event.target.value)}
                placeholder="Descreva o servico a ser realizado"
                disabled={enviando}
                className="app-input px-4 py-3 disabled:opacity-60"
              />
            </FormField>
          </div>
        </section>

        <section className="app-section-soft rounded-[1.2rem] p-4 sm:rounded-[1.35rem] sm:p-5">
          <div className="mb-5">
            <h3 className="text-xl font-semibold text-[var(--text-main)]">
              Endereco do cliente
            </h3>
            <p className="app-muted mt-1 text-sm">
              Informe o local que sera usado como referencia para atendimento.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            <div className="md:col-span-2">
              <FormField label="Logradouro *" htmlFor="logradouro">
                <input
                  id="logradouro"
                  type="text"
                  value={form.logradouro}
                  onChange={(event) => updateField("logradouro", event.target.value)}
                  disabled={enviando}
                  className="app-input px-4 py-3 disabled:opacity-60"
                />
              </FormField>
            </div>

            <FormField label="Numero *" htmlFor="numero">
              <input
                id="numero"
                type="text"
                value={form.numero}
                onChange={(event) => updateField("numero", event.target.value)}
                disabled={enviando}
                className="app-input px-4 py-3 disabled:opacity-60"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
            <FormField label="Complemento" htmlFor="complemento">
              <input
                id="complemento"
                type="text"
                value={form.complemento}
                onChange={(event) => updateField("complemento", event.target.value)}
                disabled={enviando}
                className="app-input px-4 py-3 disabled:opacity-60"
              />
            </FormField>

            <FormField label="Bairro *" htmlFor="bairro">
              <input
                id="bairro"
                type="text"
                value={form.bairro}
                onChange={(event) => updateField("bairro", event.target.value)}
                disabled={enviando}
                className="app-input px-4 py-3 disabled:opacity-60"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            <FormField label="Cidade *" htmlFor="cidade">
              <input
                id="cidade"
                type="text"
                value={form.cidade}
                onChange={(event) => updateField("cidade", event.target.value)}
                disabled={enviando}
                className="app-input px-4 py-3 disabled:opacity-60"
              />
            </FormField>

            <FormField label="Estado *" htmlFor="estado">
              <input
                id="estado"
                type="text"
                value={form.estado}
                onChange={(event) => updateField("estado", formatarEstado(event.target.value))}
                maxLength={2}
                disabled={enviando}
                className="app-input px-4 py-3 uppercase disabled:opacity-60"
              />
            </FormField>

            <FormField label="CEP *" htmlFor="cep">
              <input
                id="cep"
                type="text"
                value={form.cep}
                onChange={(event) => updateField("cep", formatarCep(event.target.value))}
                placeholder="00000-000"
                maxLength={9}
                disabled={enviando}
                className="app-input px-4 py-3 disabled:opacity-60"
              />
            </FormField>
          </div>
        </section>

        <div
          className={`fixed inset-x-0 z-20 border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--bg-card)_92%,transparent)] px-4 py-3 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none ${
            mobileNavOffset
              ? "bottom-[calc(5.5rem+env(safe-area-inset-bottom))]"
              : "bottom-0"
          }`}
        >
          <div className="mx-auto max-w-7xl">
            <button
              type="submit"
              disabled={enviando}
              className="app-button-primary inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {enviando ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <PlusCircle size={18} />
                  Criar Ordem de Servico
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function FormField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-[var(--text-main)]">{label}</label>
      {children}
    </div>
  );
}
