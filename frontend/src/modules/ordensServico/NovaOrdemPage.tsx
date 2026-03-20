import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, PlusCircle } from "lucide-react";

import { criarOrdem } from "./ordensServico.service";
import { useTheme } from "@/shared/hooks/useTheme";

type FormularioOSData = {
  tipoServico: string;
  nomeCliente: string;
  descricao: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
};

export default function NovaOrdemPage() {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [form, setForm] = useState<FormularioOSData>({
    tipoServico: "",
    nomeCliente: "",
    descricao: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
  });

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

      navigate(`/ordens-servico/${ordemCriada.id}`);
    } catch (error: any) {
      console.error("Erro ao criar OS:", error);

      const errors = error?.response?.data?.errors;
      const message = error?.response?.data?.message;

      setErro(
        errors?.tipo_servico?.[0] ||
          errors?.nome_cliente?.[0] ||
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
    : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const titleText = isDark ? "text-white" : "text-slate-900";

  return (
    <div className={`rounded-2xl border p-6 shadow-sm ${cardBg}`}>
      <div className="mb-6">
        <h1 className={`text-3xl font-bold ${titleText}`}>Nova Ordem de Serviço</h1>
        <p className={`mt-2 text-sm ${mutedText}`}>
          Preencha os dados para criar uma nova OS.
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

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="tipoServico" className={`mb-2 block text-sm font-medium ${titleText}`}>
              Tipo de Serviço *
            </label>
            <select
              id="tipoServico"
              value={form.tipoServico}
              onChange={(e) => updateField("tipoServico", e.target.value)}
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

          <div>
            <label htmlFor="nomeCliente" className={`mb-2 block text-sm font-medium ${titleText}`}>
              Nome do Cliente *
            </label>
            <input
              id="nomeCliente"
              type="text"
              value={form.nomeCliente}
              onChange={(e) => updateField("nomeCliente", e.target.value)}
              disabled={enviando}
              className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${inputBg}`}
            />
          </div>
        </div>

        <div>
          <label htmlFor="descricao" className={`mb-2 block text-sm font-medium ${titleText}`}>
            Descrição do Serviço *
          </label>
          <textarea
            id="descricao"
            rows={4}
            value={form.descricao}
            onChange={(e) => updateField("descricao", e.target.value)}
            placeholder="Descreva o serviço a ser realizado"
            disabled={enviando}
            className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${inputBg}`}
          />
        </div>

        <div className="space-y-5">
          <div>
            <h2 className={`text-xl font-semibold ${titleText}`}>Endereço do Cliente</h2>
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
                onChange={(e) => updateField("logradouro", e.target.value)}
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
                onChange={(e) => updateField("numero", e.target.value)}
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
                onChange={(e) => updateField("complemento", e.target.value)}
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
                onChange={(e) => updateField("bairro", e.target.value)}
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
                onChange={(e) => updateField("cidade", e.target.value)}
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
                onChange={(e) => updateField("estado", formatarEstado(e.target.value))}
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
                onChange={(e) => updateField("cep", formatarCep(e.target.value))}
                placeholder="00000-000"
                maxLength={9}
                disabled={enviando}
                className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${inputBg}`}
              />
            </div>
          </div>
        </div>

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