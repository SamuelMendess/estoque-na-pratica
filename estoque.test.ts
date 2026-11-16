import assert from "node:assert/strict";
import { test } from "node:test";
import { cadastrar, estoqueBaixo, movimentar } from "./estoque.ts";

test("cadastra item e remove espaços nas extremidades do nome", () => {
  assert.deepEqual(cadastrar("1", " Caderno de teste ", 10, 4),
    { id: "1", nome: "Caderno de teste", saldo: 10, minimo: 4 });
});

test("rejeita nome em branco, saldo negativo e limite fracionário", () => {
  assert.throws(() => cadastrar("1", " ", 0, 0), /nome/);
  assert.throws(() => cadastrar("1", "Caderno de teste", -1, 0), /inteiros/);
  assert.throws(() => cadastrar("1", "Caderno de teste", 0, 1.5), /inteiros/);
});

test("calcula entradas e saídas e avisa ao atingir o limite mínimo", () => {
  const item = cadastrar("1", "Caderno de teste", 10, 4);
  const entrada = movimentar(item, "entrada", 2);
  assert.equal(entrada.saldo, 12);
  assert.equal(estoqueBaixo(entrada), false);
  const saida = movimentar(entrada, "saida", 8);
  assert.equal(saida.saldo, 4);
  assert.equal(estoqueBaixo(saida), true);
  assert.equal(estoqueBaixo(movimentar(saida, "saida", 4)), true);
});

test("rejeita saída acima do saldo e quantidade inválida sem alterar o item", () => {
  const item = cadastrar("1", "Caderno de teste", 4, 2);
  assert.throws(() => movimentar(item, "saida", 5), /ultrapassa/);
  for (const quantidade of [0, -1, 1.5, Infinity]) {
    assert.throws(() => movimentar(item, "entrada", quantidade), /quantidade/);
  }
  assert.equal(item.saldo, 4);
});
