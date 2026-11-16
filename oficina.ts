import { cadastrar, movimentar, type Item, type Tipo } from "./estoque.ts";

export type Produto = Item & { usarPrimeiro: boolean };
export type Compra = {
  id: string;
  produto: string;
  quantidade: number;
  status: "pendente" | "reservada" | "comprada";
  responsavel?: string;
};
export type Registro = { produto: string; tipo: Tipo; quantidade: number; saldo: number; autor: string };
export type Oficina = { revisao: number; produtos: Produto[]; compras: Compra[]; historico: Registro[] };
export type Acao =
  | { tipo: "cadastrar"; nome: string; saldo: number; minimo: number }
  | { tipo: "movimentar"; produto: string; movimento: Tipo; quantidade: number }
  | { tipo: "priorizar"; produto: string; valor: boolean }
  | { tipo: "planejar"; produto: string; quantidade: number }
  | { tipo: "reservar" | "comprar" | "liberar"; compra: string };
export type Participante = { id: string; nome: string };

export function criarOficina(): Oficina {
  return {
    revisao: 0,
    produtos: [
      { ...cadastrar("cenouras", "Cenouras", 6, 2), usarPrimeiro: false },
      { ...cadastrar("etiquetas", "Etiquetas", 5, 3), usarPrimeiro: false },
      { ...cadastrar("canetas", "Canetas", 3, 2), usarPrimeiro: false },
    ],
    compras: [{ id: "compra-canetas", produto: "canetas", quantidade: 4, status: "pendente" }],
    historico: [],
  };
}

export function aplicar(
  oficina: Oficina,
  reservas: Map<string, string>,
  acao: Acao,
  participante: Participante,
  novoId: () => string,
): Oficina {
  const proxima = { ...oficina, revisao: oficina.revisao + 1 };
  if (acao.tipo === "cadastrar") {
    if (typeof acao.nome !== "string" || acao.nome.length > 80) throw new Error("Informe um nome de até 80 caracteres.");
    const item = cadastrar(novoId(), acao.nome, acao.saldo, acao.minimo);
    return { ...proxima, produtos: [...oficina.produtos, { ...item, usarPrimeiro: false }] };
  }

  if ("produto" in acao) {
    const item = oficina.produtos.find((produto) => produto.id === acao.produto);
    if (!item) throw new Error("Selecione um item da lista.");
    if (acao.tipo === "priorizar") {
      if (typeof acao.valor !== "boolean") throw new Error("Marcação inválida.");
      return {
        ...proxima,
        produtos: oficina.produtos.map((produto) => produto.id === item.id ? { ...produto, usarPrimeiro: acao.valor } : produto),
      };
    }
    if (acao.tipo === "planejar") {
      if (oficina.compras.some((compra) => compra.produto === item.id && compra.status !== "comprada")) {
        throw new Error("Já existe uma compra aberta para este item.");
      }
      movimentar(item, "entrada", acao.quantidade);
      return {
        ...proxima,
        compras: [...oficina.compras, { id: novoId(), produto: item.id, quantidade: acao.quantidade, status: "pendente" }],
      };
    }
    if (acao.tipo !== "movimentar" || !["entrada", "saida"].includes(acao.movimento)) {
      throw new Error("Movimentação inválida.");
    }
    return registrar(proxima, item, acao.movimento, acao.quantidade, participante.nome);
  }

  const compra = oficina.compras.find((registro) => registro.id === acao.compra);
  if (!compra) throw new Error("Compra indisponível. Confira a lista atualizada.");

  let atualizada: Compra;
  if (acao.tipo === "reservar") {
    if (compra.status !== "pendente") throw new Error("Esta compra já foi reservada ou concluída.");
    atualizada = { ...compra, status: "reservada", responsavel: participante.nome };
    reservas.set(compra.id, participante.id);
  } else if (acao.tipo === "comprar" || acao.tipo === "liberar") {
    if (compra.status !== "reservada" || reservas.get(compra.id) !== participante.id) {
      throw new Error("Apenas quem reservou esta compra pode atualizá-la.");
    }
    if (acao.tipo === "comprar") {
      const item = oficina.produtos.find((produto) => produto.id === compra.produto);
      if (!item) throw new Error("Item indisponível.");
      Object.assign(proxima, registrar(proxima, item, "entrada", compra.quantidade, participante.nome));
      atualizada = { ...compra, status: "comprada" };
    } else {
      atualizada = { ...compra, status: "pendente", responsavel: undefined };
    }
    reservas.delete(compra.id);
  } else {
    throw new Error("Ação inválida.");
  }

  return { ...proxima, compras: oficina.compras.map((registro) => registro.id === compra.id ? atualizada : registro) };
}

function registrar(oficina: Oficina, item: Produto, tipo: Tipo, quantidade: number, autor: string): Oficina {
  const atualizado = movimentar(item, tipo, quantidade);
  return {
    ...oficina,
    produtos: oficina.produtos.map((produto) => produto.id === item.id ? { ...produto, saldo: atualizado.saldo } : produto),
    historico: [{ produto: item.nome, tipo, quantidade, saldo: atualizado.saldo, autor }, ...oficina.historico],
  };
}
