# Lastro

Motor de cálculo e gestão de carteiras de investimento para pessoa física, construído capítulo a capítulo no livro _Domínio à Prova de Bugs: Modelagem e Testes de Regras de Negócio em TypeScript_, de Jorge Aluizio Alves de Souza.

O Lastro registra operações na B3, mantém posições e preço médio, apura o imposto do mês, projeta proventos e avisa quando a carteira sai da alocação-alvo. Ele existe para ensinar modelagem de domínio e testes de regras de negócio: estados inválidos que não compilam, regras fiscais testadas como especificação e uma suíte medida por testes de mutação.

> **Aviso:** o Lastro é material didático. Não é aconselhamento fiscal nem financeiro e não deve ser usado para calcular impostos reais. As regras fiscais seguem a legislação de outubro de 2026, a data de corte do livro, e podem mudar depois dela.

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

## O que já foi implementado

As doze regras de negócio do Lastro estão descritas em `test/especificacao/regras.test.ts`. Cada regra fica pendente até o capítulo que a implementa; rode `npm test` para ver quais já saíram da lista.

## Licença

O código do Lastro está sob a licença MIT (arquivo `LICENSE`). O texto do livro não faz parte deste repositório e tem todos os direitos reservados.
