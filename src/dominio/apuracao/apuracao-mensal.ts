import { Aliquota } from '../aliquota.js';
import type { CatalogoDeAtivos } from '../ativo.js';
import type { Carteira } from '../carteira.js';
import { Dinheiro } from '../dinheiro.js';
import type { Operacao } from '../operacao.js';
import { ok, type Result } from '../resultado.js';
import type {
  ApuracaoDoMes,
  ErroDeApuracao,
} from './apuracao-do-mes.js';
import { type Andamento, somarVenda } from './por-classe.js';
import { registrarNaCarteira } from './resultado-da-venda.js';

const zero = Dinheiro.deCentavos(0n);
const quinzePorCento = Aliquota.de(15n, 100n);

// #region apuracao-mensal
// Serviço de domínio: a apuração não pertence à carteira nem ao
// catálogo. Ela usa os dois, operação por operação, e aplica a lei.
export function apurarMes(
  carteira: Carteira,
  operacoes: readonly Operacao[],
  catalogo: CatalogoDeAtivos,
): Result<ApuracaoDoMes, ErroDeApuracao> {
  const fim = percorrer(carteira, operacoes, catalogo);
  if (!fim.ok) {
    return fim;
  }
  const { totalVendido, resultado } = fim.valor;
  const imposto = quinzePorCento.sobreGanho(resultado);
  return ok({
    categorias: [
      { categoria: 'acoes-comum', totalVendido, resultado, imposto },
    ],
    carteira: fim.valor.carteira,
  });
}
// #endregion

function percorrer(
  carteira: Carteira,
  operacoes: readonly Operacao[],
  catalogo: CatalogoDeAtivos,
): Result<Andamento, ErroDeApuracao> {
  const inicio: Result<Andamento, ErroDeApuracao> = ok({
    carteira,
    totalVendido: zero,
    resultado: zero,
  });
  return operacoes.reduce(
    (andamento, operacao) =>
      andamento.ok
        ? registrar(andamento.valor, operacao, catalogo)
        : andamento,
    inicio,
  );
}

function registrar(
  andamento: Andamento,
  operacao: Operacao,
  catalogo: CatalogoDeAtivos,
): Result<Andamento, ErroDeApuracao> {
  const registro = registrarNaCarteira(andamento.carteira, operacao);
  if (!registro.ok) {
    return registro;
  }
  const { carteira, venda } = registro.valor;
  if (venda === undefined) {
    return ok({ ...andamento, carteira });
  }
  return somarVenda({ ...andamento, carteira }, venda, catalogo);
}
