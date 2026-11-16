import { useEffect, useState, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import { estoqueBaixo, type Tipo } from "./estoque.ts";
import { aplicar, criarOficina, type Acao, type Oficina } from "./oficina.ts";
import "./style.css";

type Resposta = { sessao: string; oficina: Oficina; minhasReservas: string[]; erro?: string };

const chaveId = "estoque-oficina-id";
const chaveNome = "estoque-oficina-apelido";
const navegador = sessionStorage.getItem(chaveId) ?? Array.from(
  crypto.getRandomValues(new Uint8Array(16)), (valor) => valor.toString(16).padStart(2, "0"),
).join("");
sessionStorage.setItem(chaveId, navegador);

const painel = new URLSearchParams(location.search).has("painel");
const endereco = location.origin + location.pathname;
const demonstracao = import.meta.env.MODE === "pages";
const chaveExemplo = "estoque-oficina-demonstracao";
const rodada = demonstracao ? sessionStorage.getItem(chaveExemplo) : null;
const inicial: { oficina: Oficina; reservas: [string, string][] } = rodada
  ? JSON.parse(rodada)
  : { oficina: criarOficina(), reservas: [] };
let exemplo = inicial.oficina;
const reservasExemplo = new Map(inicial.reservas);

function App() {
  const [dados, setDados] = useState<Resposta>();
  const [conectado, setConectado] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [retorno, setRetorno] = useState("");
  const [nome, setNome] = useState(() => sessionStorage.getItem(chaveNome) ?? "");

  async function consultar(acao?: Acao) {
    if (demonstracao) {
      let erro: string | undefined;
      if (acao) {
        try {
          exemplo = aplicar(exemplo, reservasExemplo, acao, { id: navegador, nome: nome.trim() }, () => crypto.randomUUID());
          sessionStorage.setItem(chaveExemplo, JSON.stringify({ oficina: exemplo, reservas: [...reservasExemplo] }));
        } catch (falha) {
          erro = (falha as Error).message;
        }
      }
      const atual = { sessao: "demonstracao", oficina: exemplo, minhasReservas: [...reservasExemplo.keys()], erro };
      setConectado(true);
      setDados(atual);
      return atual;
    }
    const resposta = await fetch("/api/oficina", {
      method: acao ? "POST" : "GET",
      headers: { "X-Oficina-Id": navegador, ...(acao && { "Content-Type": "application/json" }) },
      body: acao ? JSON.stringify({ acao, nome }) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    const atual: Resposta = await resposta.json();
    setConectado(true);
    setDados((anterior) => anterior?.sessao === atual.sessao && anterior.oficina.revisao > atual.oficina.revisao ? anterior : atual);
    return atual;
  }

  useEffect(() => {
    if (demonstracao) {
      void consultar();
      return;
    }
    let ativo = true;
    let timer: ReturnType<typeof setTimeout>;
    async function atualizar() {
      try {
        await consultar();
      } catch {
        if (ativo) setConectado(false);
      } finally {
        if (ativo) timer = setTimeout(atualizar, 1500);
      }
    }
    void atualizar();
    return () => { ativo = false; clearTimeout(timer); };
  }, []);

  async function enviar(acao: Acao) {
    if (!nome.trim()) {
      setRetorno("Digite seu apelido antes de participar.");
      document.getElementById("apelido")?.focus();
      return false;
    }
    setOcupado(true);
    try {
      const resposta = await consultar(acao);
      setRetorno(resposta.erro ?? "Lista atualizada.");
      return !resposta.erro;
    } catch {
      setConectado(false);
      setRetorno("Confira a conexão e o estado da lista antes de tentar novamente.");
      return false;
    } finally {
      setOcupado(false);
    }
  }

  async function movimentar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const campos = new FormData(formulario);
    const produto = String(campos.get("produto"));
    const quantidade = Number(campos.get("quantidade"));
    const tipo = String(campos.get("tipo"));
    const acao: Acao = tipo === "planejar"
      ? { tipo, produto, quantidade }
      : { tipo: "movimentar", movimento: tipo as Tipo, produto, quantidade };
    if (await enviar(acao)) (formulario.elements.namedItem("quantidade") as HTMLInputElement).value = "";
  }

  async function cadastrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const campos = new FormData(formulario);
    if (await enviar({ tipo: "cadastrar", nome: String(campos.get("nome")), saldo: Number(campos.get("saldo")), minimo: Number(campos.get("minimo")) })) {
      formulario.reset();
    }
  }

  const oficina = dados?.oficina;
  const bloqueado = ocupado || !conectado;

  return (
    <main className={painel ? "painel" : ""}>
      <header className="cabecalho">
        <div className="barra">
          <p className="etiqueta">EXTENSÃO EM ADS II · ECONOMIA SUSTENTÁVEL</p>
          <a href={painel ? endereco : "?painel=1"}>{painel ? "Voltar à oficina" : "Abrir painel para TV"}</a>
        </div>
        <h1>Estoque na prática</h1>
        <p>Confira o que tem, combine quem compra e use primeiro o que pode se perder.</p>
        <div className="metadados">
          <span>Oficina · Dados de exercício</span>
          <span role="status" className={conectado ? "online" : "offline"}>{demonstracao ? "Demonstração individual" : conectado ? "Lista sincronizada" : "Aguardando conexão com a oficina"}</span>
        </div>
      </header>
      <section className="proposta" aria-labelledby="proposta">
        <div>
          <h2 id="proposta">A proposta da oficina</h2>
          <p>Projeto de Extensão em ADS II voltado a pessoas que organizam compras e materiais em casa, no trabalho ou em atividades coletivas. A oficina ensina a conferir o que já está disponível, combinar quem compra e decidir quando repor ou usar um item.</p>
          <p>O tema dialoga com o <strong>ODS 12, Consumo e Produção Responsáveis</strong>. Durante a oficina, o grupo pratica decisões que podem evitar compras duplicadas, falta de materiais e desperdício.</p>
        </div>
        <div>
          <h2>Três tarefas para experimentar</h2>
          <ol>
            <li>Reserve as canetas com <strong>Vou comprar</strong> e confirme com <strong>Comprei</strong>.</li>
            <li>Retire duas etiquetas e confira o aviso de reposição.</li>
            <li>Marque as cenouras para <strong>usar primeiro</strong>.</li>
          </ol>
        </div>
        {demonstracao && <p className="modo-online">Para mostrar o exercício na TV, espelhe este navegador ou o celular. Cada aba online tem sua própria rodada. A sincronização entre aparelhos está disponível na oficina em rede local.</p>}
      </section>
      {!painel && <div className="participar">
        <label htmlFor="apelido">Seu apelido</label>
        <input id="apelido" value={nome} maxLength={30} placeholder="Ex.: Participante 1" onChange={(evento) => {
          const valor = evento.target.value;
          setNome(valor);
          sessionStorage.setItem(chaveNome, valor);
        }} />
        <p role="status">{retorno}</p>
      </div>}
      {oficina && dados && <div className="grade">
        <section aria-labelledby="compras">
          <p className="etiqueta">01 · COMBINAR</p>
          <h2 id="compras">Lista compartilhada</h2>
          <p className="apoio">Reserve um item antes de comprar. Ao confirmar, a quantidade entra no estoque.</p>
          <ul className="lista">
            {oficina.compras.map((compra) => {
              const produto = oficina.produtos.find((item) => item.id === compra.produto);
              const minha = dados.minhasReservas.includes(compra.id);
              return <li key={compra.id}>
                <strong>{produto?.nome} · {compra.quantidade} un.</strong>
                <span className={`selo ${compra.status}`}>
                  {compra.status === "pendente" ? "A comprar" : compra.status === "reservada" ? "Reservado" : "Comprado"}
                </span>
                {compra.responsavel && <p className="apoio responsavel">Responsável: {compra.responsavel}</p>}
                {!painel && compra.status === "pendente" && <button disabled={bloqueado} onClick={() => void enviar({ tipo: "reservar", compra: compra.id })}>Vou comprar</button>}
                {!painel && compra.status === "reservada" && minha && <div className="acoes">
                  <button disabled={bloqueado} onClick={() => void enviar({ tipo: "comprar", compra: compra.id })}>Comprei</button>
                  <button className="secundario" disabled={bloqueado} onClick={() => void enviar({ tipo: "liberar", compra: compra.id })}>Liberar reserva</button>
                </div>}
              </li>;
            })}
          </ul>
        </section>
        <section aria-labelledby="saldos">
          <p className="etiqueta">02 · CONFERIR</p>
          <h2 id="saldos">Estoque</h2>
          <p className="apoio">Saldo atual, limite de reposição e itens para usar primeiro.</p>
          <ul className="lista">
            {[...oficina.produtos].sort((a, b) => Number(b.usarPrimeiro) - Number(a.usarPrimeiro)).map((item) => <li key={item.id}>
              <div className="linha-item"><strong>{item.nome}</strong><strong className="saldo">{item.saldo} <small>un.</small></strong></div>
              <p className="apoio">Limite de reposição: {item.minimo}</p>
              <div className="selos">
                {estoqueBaixo(item) && <span className="selo alerta">Atenção à reposição</span>}
                {item.usarPrimeiro && <span className="selo comprada">Usar primeiro</span>}
              </div>
              {!painel && <button className="secundario" type="button" disabled={bloqueado} aria-pressed={item.usarPrimeiro}
                onClick={() => void enviar({ tipo: "priorizar", produto: item.id, valor: !item.usarPrimeiro })}>
                {item.usarPrimeiro ? "Remover prioridade" : "Marcar para usar primeiro"}
              </button>}
            </li>)}
          </ul>
        </section>
        {!painel && <section aria-labelledby="movimentos">
          <p className="etiqueta">03 · ATUALIZAR</p>
          <h2 id="movimentos">Registrar ação</h2>
          <form onSubmit={movimentar}>
            <fieldset disabled={bloqueado}>
              <label>Item<select name="produto" required>
                {oficina.produtos.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
              </select></label>
              <label>Ação<select name="tipo">
                <option value="entrada">Entrada</option><option value="saida">Retirada</option><option value="planejar">Adicionar à lista de compras</option>
              </select></label>
              <label>Quantidade<input name="quantidade" type="number" min="1" step="1" required /></label>
              <button>Registrar</button>
            </fieldset>
          </form>
          <details>
            <summary>Cadastrar outro item</summary>
            <form onSubmit={cadastrar}>
              <fieldset disabled={bloqueado}>
                <label>Nome do item<input name="nome" maxLength={80} required /></label>
                <label>Saldo inicial<input name="saldo" type="number" min="0" step="1" required /></label>
                <label>Limite de reposição<input name="minimo" type="number" min="0" step="1" required /></label>
                <button>Cadastrar</button>
              </fieldset>
            </form>
          </details>
        </section>}
        <section className="historico" aria-labelledby="historico">
          <p className="etiqueta">MOVIMENTAÇÕES</p>
          <h2 id="historico">Histórico da oficina</h2>
          {oficina.historico.length === 0 ? <p className="apoio">As entradas e retiradas aparecerão aqui.</p> : <ol>
            {oficina.historico.slice(0, painel ? 5 : undefined).map((registro, indice) => <li key={oficina.historico.length - indice}>
              <strong>{registro.produto}</strong> · {registro.tipo === "entrada" ? "Entrada" : "Retirada"} de {registro.quantidade} · Saldo {registro.saldo} · {registro.autor}
            </li>)}
          </ol>}
        </section>
      </div>}
      <footer>{demonstracao ? "Os dados do exercício ficam nesta aba durante a sessão do navegador." : "Os dados do exercício ficam disponíveis enquanto o servidor da oficina estiver em execução."}</footer>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);

