# Estoque na prática

Site local para a oficina de Economia Sustentável da Extensão em ADS II. Os celulares compartilham uma lista de compras e um estoque de exercício. A TV pode acompanhar pelo painel de leitura.

## Versão online

O GitHub Pages hospeda a proposta do projeto e a demonstração interativa. Use o navegador do celular e espelhe a mesma tela no computador ou na TV. Use **Abrir painel para TV** para acompanhar os saldos e as compras na mesma aba. A rodada online é individual e fica na sessão do navegador. Para que vários celulares editem a mesma lista, use a oficina em rede local descrita abaixo.

Gere a versão estática com `npm run build:pages`. Os arquivos de publicação ficam em `dist` e usam caminhos relativos para funcionar no GitHub Pages.

## Abrir a oficina

No terminal, nesta pasta, com Node.js 24:

```powershell
npm run build
npm run oficina -- --host 0.0.0.0
```

Se esta for a primeira execução em outro computador, instale as dependências com `npm ci` antes do build. Após a instalação, a oficina usa apenas a rede local.

- **Notebook:** abra `http://localhost:4173`.
- **Celulares:** conecte todos ao mesmo Wi-Fi do notebook. Digite no navegador o endereço **Network** mostrado no terminal, incluindo `:4173`. Evite rede de convidados com isolamento entre aparelhos. Se o Windows pedir acesso de rede, limite-o à rede privada usada para a oficina.
- **TV:** espelhe o notebook por HDMI ou pela função de projeção disponível. No site, clique em **Abrir painel para TV** e, se quiser, pressione **F11** para tela cheia. Para operar pelo notebook e manter o painel na TV, use a opção de estender a tela.
- Mantenha o terminal aberto. Recarregar o navegador conserva a lista compartilhada. Reiniciar o servidor restaura os itens de exercício e apaga as movimentações. Use apelidos e dados de exercício.

## Exercício com o grupo

1. **Evitar compra duplicada.** Duas pessoas abrem a lista de canetas no celular. Uma toca em **Vou comprar**. A outra verifica que apareceu o responsável e que a compra já foi reservada. Quem reservou toca em **Comprei**. O saldo de canetas sobe de 3 para 7, e a entrada aparece no histórico. Se a pessoa desistir, pode liberar a reserva antes de confirmar.
2. **Evitar falta.** Outra pessoa registra uma retirada de 2 etiquetas. O saldo cai de 5 para 3 e o aviso aparece ao atingir o limite. Peça ao grupo que decida se deve adicionar uma compra à lista.
3. **Reduzir desperdício.** Outra pessoa marca **Usar primeiro** nas cenouras. Elas sobem na lista. Peça que expliquem qual item consumiriam antes de comprar mais.

Compare o que muda nos celulares e na TV. Peça a cada participante para executar uma ação e explicar a decisão. Para reiniciar a rodada, encerre o servidor com Ctrl+C e execute novamente o comando da oficina.

## Verificação

`npm test` cobre cadastro, movimentação, validações e limite de estoque. O build passou. Em teste via HTTP com dois clientes, a API confirmou atualização compartilhada, reserva concorrente exclusiva, liberação, baixa de estoque, entrada única na confirmação de compra e marcação de prioridade. Antes da oficina, teste a conexão pelo celular na rede que será usada e confira a legibilidade na TV.
