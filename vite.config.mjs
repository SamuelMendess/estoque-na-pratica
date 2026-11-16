import { randomUUID } from "node:crypto";
import { defineConfig } from "vite";
import { aplicar, criarOficina } from "./oficina.ts";

function instalarOficina(servidor) {
  let oficina = criarOficina();
  const sessao = randomUUID();
  const reservas = new Map();

  servidor.middlewares.use("/api/oficina", async (req, res) => {
    const id = req.headers["x-oficina-id"];
    function enviar(status, erro) {
      res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      res.end(JSON.stringify({
        sessao,
        oficina,
        minhasReservas: [...reservas].filter(([, dono]) => dono === id).map(([compra]) => compra),
        erro,
      }));
    }

    if (req.method === "GET") return enviar(200);
    if (req.method !== "POST" || req.headers["content-type"] !== "application/json") {
      return enviar(415, "Envie uma ação em JSON.");
    }
    if (typeof id !== "string" || !/^[0-9a-f]{32}$/.test(id)) {
      return enviar(400, "Identificação de navegador inválida.");
    }

    try {
      let corpo = "";
      req.setEncoding("utf8");
      for await (const parte of req) {
        corpo += parte;
        if (corpo.length > 4096) {
          enviar(413, "Dados da ação excedem o limite.");
          return;
        }
      }
      const { acao, nome } = JSON.parse(corpo);
      if (!acao || typeof acao !== "object" || typeof nome !== "string" || !nome.trim() || nome.length > 30) {
        return enviar(400, "Informe um apelido de até 30 caracteres e tente novamente.");
      }
      oficina = aplicar(oficina, reservas, acao, { id, nome: nome.trim() }, randomUUID);
      enviar(200);
    } catch (erro) {
      enviar(400, erro instanceof SyntaxError ? "Ação inválida." : erro.message);
    }
  });
}

export default defineConfig({
  plugins: [{ name: "oficina-local", configureServer: instalarOficina, configurePreviewServer: instalarOficina }],
});
