# Lastro

Motor de cálculo e gestão de carteiras de investimento para pessoa física, construído capítulo a capítulo no livro _Domínio à Prova de Bugs: Modelagem e Testes de Regras de Negócio em TypeScript_, de Jorge Aluizio Alves de Souza.

O Lastro registra operações na B3, mantém posições e preço médio, apura o imposto do mês, projeta proventos e avisa quando a carteira sai da alocação-alvo. Ele existe para ensinar modelagem de domínio e testes de regras de negócio: estados inválidos que não compilam, regras fiscais testadas como especificação e uma suíte medida por testes de mutação.

> **Aviso:** o Lastro é material didático. Não é aconselhamento fiscal nem financeiro e não deve ser usado para calcular impostos reais. As regras fiscais seguem a legislação de outubro de 2026, a data de corte do livro, e podem mudar depois dela.

## O livro

_Domínio à Prova de Bugs_ está publicado na Amazon como ebook Kindle, no KDP Select: à venda e disponível no Kindle Unlimited ([amazon.com.br/dp/B0HNXSK6K1](https://www.amazon.com.br/dp/B0HNXSK6K1), ISBN 978-65-02-44961-5). A edição impressa, em brochura, sai em breve pela própria Amazon, que imprime sob demanda e envia o exemplar ao leitor (ISBN 978-65-02-46065-8).

O livro tem 15 capítulos em 4 partes. Cada capítulo explica uma técnica e a aplica ao Lastro: objetos de valor, uniões discriminadas e tipos marcados; agregados e invariantes; TDD e refatoração; testes baseados em propriedades; testes de mutação; regras fiscais com vigência; portas e adaptadores; e a entrega como pacote e como imagem Docker.

## Como acompanhar o livro

Cada capítulo termina numa _tag_ deste repositório (`cap01` a `cap15`, e a versão final `v1.0.0`). Para ver o código exatamente como ele está ao fim de um capítulo:

```sh
git checkout cap01
npm ci
npm run verificar
```

Para ver o que mudou de um capítulo para o outro:

```sh
git diff cap01 cap02
```

A partir do Capítulo 2, cada capítulo tem um desafio. A branch `desafio/capXX` traz testes vermelhos para você fazer passar, e a _tag_ `capXX-desafio` guarda uma solução de referência.

## Requisitos

- Node 24 (a versão está fixada em `.nvmrc`)
- npm

## Scripts

| Script                   | O que faz                                           |
| ------------------------ | --------------------------------------------------- |
| `npm run typecheck`      | Verifica os tipos com o `tsc`                       |
| `npm run lint`           | Roda o ESLint e confere a formatação com o Prettier |
| `npm run formatar`       | Formata o código com o Prettier                     |
| `npm test`               | Roda os testes com o Vitest                         |
| `npm run test:cobertura` | Roda os testes com relatório de cobertura           |
| `npm run verificar`      | Tipos, lint e testes, nessa ordem, como na CI       |

## Como usar

O Lastro tem duas entradas para quem o usa: a linha de comando, que importa o extrato da corretora e escreve o relatório do mês, e a API HTTP, descrita em [`docs/api.md`](docs/api.md). As duas guardam as operações num banco SQLite ou Postgres e chamam as mesmas regras.

<!-- #region instalacao -->

### Instalação

Cada versão do Lastro sai na página de _releases_ do GitHub, com o pacote do npm anexado. Para instalar a versão 1.0.0 e ganhar o comando `lastro`:

```sh
npm install --global https://github.com/aluiziodeveloper/lastro-gestao-financeira/releases/download/v1.0.0/aluiziodeveloper-lastro-1.0.0.tgz
lastro relatorio 2026-04 --carteira minha --banco lastro.db
```

Num projeto em TypeScript ou JavaScript, o domínio e os casos de uso vêm do ponto de entrada principal, e os adaptadores, de `/adaptadores`:

```ts
import { Dinheiro, registrarOperacoes } from '@aluiziodeveloper/lastro';
import { repositorioSqlite } from '@aluiziodeveloper/lastro/adaptadores';
```

O que o pacote exporta é o contrato público do Lastro, listado em [`docs/api.md`](docs/api.md). Mudar esse contrato de forma incompatível só acontece numa versão maior.

<!-- #endregion -->

<!-- #region uso-cli -->

### Linha de comando

Compile o Lastro e importe um extrato em CSV, com o cabeçalho `Data;C/V;Ativo;Quantidade;Preço;Custos`:

```sh
npm ci
npm run build
node dist/adaptadores/cli/main.js importar \
  exemplos/cap14/extrato-abril.csv --carteira minha --banco lastro.db
```

O banco é um arquivo SQLite, criado na primeira importação. Peça o relatório de um mês:

```sh
node dist/adaptadores/cli/main.js relatorio 2026-04 \
  --carteira minha --banco lastro.db
```

O código de saída diz como foi: `0`, feito; `1`, o Lastro recusou o pedido, com o motivo na saída; `2`, o comando não seguiu o uso.

<!-- #endregion -->

<!-- #region uso-docker -->

### API com Docker

O `compose.yaml` sobe a API e um Postgres 17, com os dados num volume. Com o Docker instalado:

```sh
docker compose up -d
curl -s -X POST localhost:3000/carteiras/minha/operacoes \
  -H 'content-type: application/json' \
  -d @exemplos/cap15/operacoes-abril.json
curl -s localhost:3000/carteiras/minha/relatorios/2026-04
```

`docker compose down` para os contêineres e mantém os dados; `docker compose down -v` apaga também o volume. A imagem sozinha, sem o Compose, precisa da variável `LASTRO_POSTGRES_URL` com o endereço de um Postgres.

<!-- #endregion -->

## Versões

O Lastro segue o versionamento semântico: a versão maior muda quando o contrato público muda de forma incompatível. O que entrou em cada versão está em [`CHANGELOG.md`](CHANGELOG.md), gerado dos commits por `npm run changelog`.

## O que já foi implementado

As doze regras de negócio do Lastro estão descritas em `test/especificacao/regras.test.ts`. Cada regra fica pendente até o capítulo que a implementa; rode `npm test` para ver quais já saíram da lista.

## Licença

O código do Lastro está sob a licença MIT (arquivo `LICENSE`). O texto do livro não faz parte deste repositório e tem todos os direitos reservados.
