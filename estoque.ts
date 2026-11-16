export type Item = {
  id: string;
  nome: string;
  saldo: number;
  minimo: number;
};

export type Tipo = "entrada" | "saida";

export function cadastrar(id: string, nome: string, saldo: number, minimo: number): Item {
  nome = nome.trim();
  if (!nome) throw new Error("Informe o nome do item.");
  if (!Number.isSafeInteger(saldo) || saldo < 0 || !Number.isSafeInteger(minimo) || minimo < 0) {
    throw new Error("Use números inteiros a partir de zero no saldo e no limite.");
  }
  return { id, nome, saldo, minimo };
}

export function movimentar(item: Item, tipo: Tipo, quantidade: number): Item {
  if (!Number.isSafeInteger(quantidade) || quantidade < 1) {
    throw new Error("Informe uma quantidade inteira maior que zero.");
  }
  const saldo = item.saldo + (tipo === "entrada" ? quantidade : -quantidade);
  if (saldo < 0) throw new Error("A saída ultrapassa o saldo disponível.");
  if (!Number.isSafeInteger(saldo)) throw new Error("O saldo ultrapassa o limite aceito.");
  return { ...item, saldo };
}

export function estoqueBaixo(item: Item): boolean {
  return item.saldo <= item.minimo;
}
