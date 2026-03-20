import api from "@/shared/api/client";

export type Endereco = {
  id: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  latitude: string | null;
  longitude: string | null;
};

export async function listarEnderecos() {
  const { data } = await api.get<Endereco[]>("/enderecos");
  return data;
}