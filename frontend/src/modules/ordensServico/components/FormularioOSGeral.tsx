import { useState, type FormEvent } from "react";
import { Loader2, PlusCircle } from "lucide-react";

import { useTheme } from "@/shared/hooks/useTheme";
import {
  getApiErrorMessage,
  getApiValidationErrors,
} from "@/shared/utils/apiError";
import {
  criarOrdem,
  type OrdemServicoDetalhe,
} from "../ordensServico.service";

type FormularioOSData = {
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
};

const initialForm: FormularioOSData = {
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
  titulo = "Nova Ordem de Serviço",
  descricao = "Preencha os dados para criar uma nova OS.",
}: FormularioOSGeralProps) {
  const { isDark } = useTheme();

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

  function validarFormulario() {
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

      setForm(initialForm);
      onCriada?.(ordemCriada);
    } catch (error) {
      const errors = getApiValidationErrors(error);
      const message = getApiErrorMessage(error, "");

      setErro(
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

  const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
  const inputBg = isDark
    ? "bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500"
    : "bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400";
  const sectionCard = isDark
    ? "rounded-2xl border border-slate-800 bg-slate-950/70 p-5"
    : "rounded-2xl border border-slate-200 bg-slate-50 p-5";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const titleText = isDark ? "text-white" : "text-slate-900";

  return (
    <div className={`rounded-2xl border p-6 shadow-sm ${cardBg}`}>
      <div className="mb-6">
        <h2 className={`text-2xl font-semibold ${titleText}`}>{titulo}</h2>
        <p className={`mt-2 text-sm ${mutedText}`}>{descricao}</p>
        <p className={`mt-3 text-xs uppercase tracking-[0.16em] ${mutedText}`}>
          Campos marcados com * são obrigatórios
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {erro && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              isDark
                ? "border-red-900 bg-red-950 text-red-300"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {erro}
          </div>
        )}

        <section className={sectionCard}>
          <div className="mb-5">
            <h3 className={`text-xl font-semibold ${titleText}`}>Dados da OS</h3>
            <p className={`mt-1 text-sm ${mutedText}`}>
              Identifique o tipo da solicitação e o cliente atendido.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <label htmlFor="tipoServico" className={`mb-2 block text-sm font-medium ${titleText}`}>
                Tipo de Serviço *
              </label>
              <select
                id="tipoServico"
                value={form.tipoServico}
                onChange={(event) => updateField("tipoServico", event.target.value)}
                disabled={enviando}
                className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${inputBg}`}
              >
                <option value="">Selecione o tipo</option>
                <option value="manutencao">Manutenção</option>
                <option value="instalacao">Instalação</option>
                <option value="vistoria">Vistoria</option>
                <option value="leitura">Leitura</option>
                <option value="reparo">Reparo</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="nomeCliente" className={`mb-2 block text-sm font-medium ${titleText}`}>
                Nome do Cliente *
              </label>
              <input
                id="nomeCliente"
                type="text"
                value={form.nomeCliente}
                onChange={(event) => updateField("nomeCliente", event.target.value)}
                disabled={enviando}
                className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${inputBg}`}
              />
            </div>
          </div>

          <div className="mt-6 max-w-sm">
            <label htmlFor="prioridade" className={`mb-2 block text-sm font-medium ${titleText}`}>
              Prioridade *
            </label>
            <select
              id="prioridade"
              value={form.prioridade}
              onChange={(event) => updateField("prioridade", event.target.value)}
              disabled={enviando}
              className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${inputBg}`}
            >
              <option value="1">Alta</option>
              <option value="2">Média</option>
              <option value="3">Baixa</option>
            </select>
          </div>

          <div className="mt-6">
            <label htmlFor="descricao" className={`mb-2 block text-sm font-medium ${titleText}`}>
              Descrição do Serviço *
            </label>
            <textarea
              id="descricao"
              rows={4}
              value={form.descricao}
              onChange={(event) => updateField("descricao", event.target.value)}
              placeholder="Descreva o serviço a ser realizado"
              disabled={enviando}
              className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${inputBg}`}
            />
          </div>
        </section>

        <section className={sectionCard}>
          <div className="mb-5">
            <h3 className={`text-xl font-semibold ${titleText}`}>Endereço do cliente</h3>
            <p className={`mt-1 text-sm ${mutedText}`}>
              Informe o local que será usado como referência para atendimento.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <label htmlFor="logradouro" className={`mb-2 block text-sm font-medium ${titleText}`}>
                Logradouro *
              </label>
              <input
                id="logradouro"
                type="text"
                value={form.logradouro}
                onChange={(event) => updateField("logradouro", event.target.value)}
                disabled={enviando}
                className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${inputBg}`}
              />
            </div>

            <div>
              <label htmlFor="numero" className={`mb-2 block text-sm font-medium ${titleText}`}>
                Número *
              </label>
              <input
                id="numero"
                type="text"
                value={form.numero}
                onChange={(event) => updateField("numero", event.target.value)}
                disabled={enviando}
                className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${inputBg}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="complemento" className={`mb-2 block text-sm font-medium ${titleText}`}>
                Complemento
              </label>
              <input
                id="complemento"
                type="text"
                value={form.complemento}
                onChange={(event) => updateField("complemento", event.target.value)}
                disabled={enviando}
                className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${inputBg}`}
              />
            </div>

            <div>
              <label htmlFor="bairro" className={`mb-2 block text-sm font-medium ${titleText}`}>
                Bairro *
              </label>
              <input
                id="bairro"
                type="text"
                value={form.bairro}
                onChange={(event) => updateField("bairro", event.target.value)}
                disabled={enviando}
                className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${inputBg}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <label htmlFor="cidade" className={`mb-2 block text-sm font-medium ${titleText}`}>
                Cidade *
              </label>
              <input
                id="cidade"
                type="text"
                value={form.cidade}
                onChange={(event) => updateField("cidade", event.target.value)}
                disabled={enviando}
                className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${inputBg}`}
              />
            </div>

            <div>
              <label htmlFor="estado" className={`mb-2 block text-sm font-medium ${titleText}`}>
                Estado *
              </label>
              <input
                id="estado"
                type="text"
                value={form.estado}
                onChange={(event) => updateField("estado", formatarEstado(event.target.value))}
                maxLength={2}
                disabled={enviando}
                className={`w-full rounded-xl border px-4 py-3 uppercase outline-none transition focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${inputBg}`}
              />
            </div>

            <div>
              <label htmlFor="cep" className={`mb-2 block text-sm font-medium ${titleText}`}>
                CEP *
              </label>
              <input
                id="cep"
                type="text"
                value={form.cep}
                onChange={(event) => updateField("cep", formatarCep(event.target.value))}
                placeholder="00000-000"
                maxLength={9}
                disabled={enviando}
                className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${inputBg}`}
              />
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={enviando}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enviando ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <PlusCircle size={18} />
              Criar Ordem de Serviço
            </>
          )}
        </button>
      </form>
    </div>
  );
}
