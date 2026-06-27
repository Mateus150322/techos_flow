import { useState, type FormEvent, type ReactNode } from "react";
import { ClipboardList, Loader2, MapPin, PlusCircle } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  getApiErrorMessage,
  getApiValidationErrors,
} from "@/shared/utils/apiError";
import { useCurrentUser } from "@/shared/auth/session";
import { usePersistedDraft } from "@/shared/hooks/usePersistedDraft";
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

type FormSection = "dados" | "endereco";

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
  const currentUser = useCurrentUser("atendente");
  const {
    value: form,
    setValue: setForm,
    clearDraft,
  } = usePersistedDraft<FormularioOSData>(
    `draft:ordem-geral:${currentUser.id ?? "atendente"}`,
    initialForm
  );
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [secoesAbertas, setSecoesAbertas] = useState<FormSection[]>(["dados"]);

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

    const local = new Date(`${form.dataAbertura}T${form.horaAbertura}`);

    return Number.isNaN(local.getTime()) ? "" : local.toISOString();
  }

  function validarFormulario() {
    if (!form.dataAbertura) return { mensagem: "Informe a data de abertura.", secao: "dados" as const };
    if (!form.horaAbertura) return { mensagem: "Informe a hora de abertura.", secao: "dados" as const };
    if (!form.tipoServico.trim()) return { mensagem: "Informe o tipo de serviço.", secao: "dados" as const };
    if (!form.nomeCliente.trim()) return { mensagem: "Informe o nome do cliente.", secao: "dados" as const };
    if (!form.prioridade.trim()) return { mensagem: "Informe a prioridade.", secao: "dados" as const };
    if (!form.descricao.trim()) return { mensagem: "Informe a descrição do serviço.", secao: "dados" as const };
    if (!form.logradouro.trim()) return { mensagem: "Informe o logradouro.", secao: "endereco" as const };
    if (!form.numero.trim()) return { mensagem: "Informe o número.", secao: "endereco" as const };
    if (!form.bairro.trim()) return { mensagem: "Informe o bairro.", secao: "endereco" as const };
    if (!form.cidade.trim()) return { mensagem: "Informe a cidade.", secao: "endereco" as const };
    if (!form.estado.trim()) return { mensagem: "Informe o estado.", secao: "endereco" as const };
    if (form.estado.trim().length !== 2) return { mensagem: "Informe a UF com 2 letras.", secao: "endereco" as const };
    if (!form.cep.trim()) return { mensagem: "Informe o CEP.", secao: "endereco" as const };
    if (form.cep.replace(/\D/g, "").length !== 8) return { mensagem: "Informe um CEP válido.", secao: "endereco" as const };

    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");

    const mensagemErro = validarFormulario();

    if (mensagemErro) {
      setErro(mensagemErro.mensagem);
      setSecoesAbertas((current) =>
        current.includes(mensagemErro.secao)
          ? current
          : [...current, mensagemErro.secao]
      );
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

      await clearDraft({
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
        className={`space-y-6 ${mobileNavOffset ? "pb-6" : "pb-0"} sm:space-y-8 sm:pb-0`}
        aria-busy={enviando}
      >
        {erro ? (
          <div className="app-alert-danger rounded-xl px-4 py-3 text-sm" role="alert" aria-live="assertive">{erro}</div>
        ) : null}

        <Accordion
          type="multiple"
          value={secoesAbertas}
          onValueChange={(value) => setSecoesAbertas(value as FormSection[])}
          className="space-y-4"
        >
          <FormAccordionSection
            value="dados"
            title="Dados da OS"
            description="Registre a abertura da OS e identifique a solicitação."
            icon={<ClipboardList className="h-5 w-5" />}
          >

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
              <FormField label="Descrição do serviço *" htmlFor="descricao">
                <textarea
                  id="descricao"
                  rows={4}
                  value={form.descricao}
                  onChange={(event) => updateField("descricao", event.target.value)}
                  placeholder="Descreva o serviço a ser realizado"
                  disabled={enviando}
                  className="app-input px-4 py-3 disabled:opacity-60"
                />
              </FormField>
            </div>
          </FormAccordionSection>

          <FormAccordionSection
            value="endereco"
            title="Endereço do cliente"
            description="Informe o local usado como referência para o atendimento."
            icon={<MapPin className="h-5 w-5" />}
          >

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
          </FormAccordionSection>
        </Accordion>

        <div className="app-mobile-sticky-actions">
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

function FormAccordionSection({
  value,
  title,
  description,
  icon,
  children,
}: {
  value: FormSection;
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <AccordionItem
      value={value}
      className="app-section-soft overflow-hidden rounded-[1.2rem] border border-[var(--border)] px-4 sm:rounded-[1.35rem] sm:px-5"
    >
      <AccordionTrigger className="py-4 sm:py-5">
        <span className="flex min-w-0 items-start gap-3">
          <span className="app-card inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--primary)] shadow-none">
            {icon}
          </span>
          <span className="min-w-0">
            <span className="block text-base font-semibold text-[var(--text-main)] sm:text-lg">
              {title}
            </span>
            <span className="app-muted mt-1 block text-xs font-normal leading-5 sm:text-sm">
              {description}
            </span>
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="pb-5">{children}</AccordionContent>
    </AccordionItem>
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
