import type { ModoDeArredondamento } from '../arredondamento.js';
import {
  type ClasseDeAtivo,
  classesDeAtivo,
} from '../classe-de-ativo.js';
import type { Dinheiro } from '../dinheiro.js';
import {
  cemPorCento,
  type PontosBase,
  pontosBase,
} from '../mercado/pontos-base.js';
import {
  type AlocacaoAlvo,
  type Limites,
  limitesDe,
} from './alocacao-alvo.js';
import type { Composicao } from './composicao.js';

// #region alerta
// Uma classe fora da banda: para que lado, o peso e o alvo com a
// banda. O peso é só para mostrar; a decisão não passa por ele.
export interface Desenquadramento {
  readonly classe: ClasseDeAtivo;
  readonly direcao: 'acima' | 'abaixo';
  readonly peso: PontosBase;
  readonly alvo: PontosBase;
  readonly banda: PontosBase;
}

const arredondamentoDoPeso: ModoDeArredondamento = 'meio-para-cima';

// A classe está acima quando valor ÷ total passa de máximo ÷ 10.000:
// pela multiplicação cruzada, valor × 10.000 passa de máximo × total.
// Nada se divide, e uma classe no limite exato fica dentro da banda.
// Numa carteira vazia, zero não passa de nada: não há alerta, e o peso,
// que dividiria por zero, nunca é calculado.
export function desenquadramentos(
  { total, porClasse }: Composicao,
  alocacao: AlocacaoAlvo,
): readonly Desenquadramento[] {
  return classesDeAtivo.flatMap((classe) => {
    const fatia = alocacao.fatiaDe(classe);
    const direcao = direcaoDe(
      porClasse[classe],
      total,
      limitesDe(fatia),
    );
    if (direcao === undefined) {
      return [];
    }
    const peso = pesoDe(porClasse[classe], total);
    return [
      { classe, direcao, peso, alvo: fatia.alvo, banda: fatia.banda },
    ];
  });
}

function direcaoDe(
  valor: Dinheiro,
  total: Dinheiro,
  { minimo, maximo }: Limites,
): Desenquadramento['direcao'] | undefined {
  const escalado = valor.multiplicarPorUnidades(cemPorCento);
  if (escalado.excede(total.multiplicarPorUnidades(maximo))) {
    return 'acima';
  }
  if (total.multiplicarPorUnidades(minimo).excede(escalado)) {
    return 'abaixo';
  }
  return undefined;
}

function pesoDe(valor: Dinheiro, total: Dinheiro): PontosBase {
  return pontosBase(
    valor.razaoSobre(total, cemPorCento, arredondamentoDoPeso),
  );
}
// #endregion
