import { describe, expect, it } from 'vitest';

import type { Composicao } from '../../src/dominio/alocacao/composicao.js';
import { composicaoDe } from '../../src/dominio/alocacao/composicao.js';
import { desenquadramentos } from '../../src/dominio/alocacao/desenquadramento.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import {
  cemPorCento,
  emPercentual,
  pontosBase,
} from '../../src/dominio/mercado/pontos-base.js';
import { rebalancear } from '../../src/dominio/rebalanceamento/rebalanceamento.js';
import { margemDeIsencao } from '../../src/dominio/rebalanceamento/vendas.js';
import { extrair } from '../../test/apoio/resultado.js';
import {
  alocacaoDaCena,
  carteiraDaCena,
  catalogoDaCena,
  cotacoesDaCena,
  representantesDaCena,
} from '../../test/dominio/carteira-desenquadrada.js';
import { regrasEm } from '../../test/dominio/referencias.js';

// #region sugestao-impressa
// O Lastro ainda não tem uma linha de comando: este exemplo pede a
// sugestão para a carteira da cena, com R$ 3.000,00 já vendidos em
// outubro, e imprime os alertas, as ordens e os pesos depois.
function peso(valor: Dinheiro, total: Dinheiro): string {
  return emPercentual(
    pontosBase(valor.razaoSobre(total, cemPorCento, 'meio-para-cima')),
  );
}

function pesos(
  { porClasse }: Composicao,
  patrimonio: Dinheiro,
): string {
  const acao = peso(porClasse.acao, patrimonio);
  return `ações ${acao}, FII ${peso(porClasse.fii, patrimonio)}`;
}

describe('a sugestão da cena', () => {
  it('imprime os alertas, as ordens e os pesos depois', () => {
    const antes = extrair(
      composicaoDe(carteiraDaCena, cotacoesDaCena, catalogoDaCena),
    );
    const vendido = Dinheiro.deCentavos(3_000_00n);
    const margem = margemDeIsencao(regrasEm('2026-10-20'), vendido);
    const sugestao = rebalancear(
      antes,
      alocacaoDaCena,
      { aporte: Dinheiro.deCentavos(0n), margem },
      representantesDaCena,
    );
    const depois: Composicao = {
      total: antes.total.subtrair(sugestao.caixa),
      porClasse: {
        acao: antes.porClasse.acao.subtrair(sugestao.vendas.acao),
        fii: antes.porClasse.fii.somar(sugestao.compras.fii),
        etf: antes.porClasse.etf,
      },
    };

    console.log(
      [
        ...desenquadramentos(antes, alocacaoDaCena).map(
          ({ classe, direcao, peso: p }) =>
            `Alerta: ${classe} ${direcao} (${emPercentual(p)})`,
        ),
        `Margem de isenção: ${margem.emReais()}`,
        ...sugestao.ordens.map(
          ({ tipo, quantidade, ticker, valor }) =>
            `${tipo}: ${String(quantidade)} ${ticker.paraTexto()} ` +
            `por ${valor.emReais()}`,
        ),
        `Caixa: ${sugestao.caixa.emReais()}`,
        `Depois: ${pesos(depois, antes.total)}`,
      ].join('\n'),
    );
    expect(sugestao.vendas.acao.emReais()).toBe('R$ 17.000,00');
  });
});
// #endregion
