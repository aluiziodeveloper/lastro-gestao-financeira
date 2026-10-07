// Código ilustrativo do Capítulo 1: o serviço de um sistema que
// nasceu como cadastro. Não faz parte do domínio do Lastro. Ele
// compila e passa no lint de propósito: os problemas aqui são de
// desenho, não de sintaxe.

export interface OperacaoRegistro {
  ticker: string;
  tipo: string;
  data: string;
  quantidade: number;
  preco: number;
  custos: number;
}

export interface PosicaoRegistro {
  quantidade: number;
  precoMedio: number;
}

// #region servico-da-cena
export class OperacaoService {
  registrar(op: OperacaoRegistro, pos: PosicaoRegistro): void {
    if (op.tipo === 'compra' || op.tipo === 'C') {
      const total =
        pos.quantidade * pos.precoMedio + op.quantidade * op.preco;
      pos.quantidade += op.quantidade;
      pos.precoMedio = total / pos.quantidade;
    } else if (op.tipo === 'venda') {
      pos.quantidade -= op.quantidade;
    }
  }
}
// #endregion

// #region servico-ampliado
// Versão ampliada para o estudo de caso do Capítulo 1 (Parte D).
export class OperacaoServiceAmpliado extends OperacaoService {
  apurarImpostoDoMes(
    operacoes: OperacaoRegistro[],
    posicoes: Record<string, PosicaoRegistro>,
    classes: Record<string, string>,
  ): number {
    let vendas = 0;
    let imposto = 0;
    for (const op of operacoes) {
      if (op.tipo === 'venda' || op.tipo === 'V') {
        const pos = posicoes[op.ticker];
        if (pos) {
          const resultado =
            (op.preco - pos.precoMedio) * op.quantidade - op.custos;
          const aliquota = classes[op.ticker] === 'fii' ? 0.2 : 0.15;
          vendas += op.preco * op.quantidade;
          imposto += resultado * aliquota;
        }
      }
    }
    if (vendas < 20000) {
      return 0;
    }
    return imposto;
  }
}
// #endregion
