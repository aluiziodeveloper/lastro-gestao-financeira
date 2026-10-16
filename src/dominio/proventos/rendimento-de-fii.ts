import type {
  CatalogoDeAtivos,
  ErroDeCatalogo,
  SituacaoDoFundo,
} from '../ativo.js';
import type {
  RegimeTributario,
  RequisitosDaIsencaoDoFii,
} from '../regime/regime-tributario.js';
import { ok, type Result } from '../resultado.js';
import type {
  RendimentoDeFii,
  TratamentoDoProvento,
} from './provento.js';
import { exclusivoNaFonte, isento } from './tratamentos.js';

// #region fii-isencao
// A isenção depende do fundo na data do pagamento e da parte que o
// investidor tem dele. Falhou um requisito, a fonte retém.
export function tratarRendimentoDeFii(
  rendimento: RendimentoDeFii,
  regime: RegimeTributario,
  catalogo: CatalogoDeAtivos,
): Result<TratamentoDoProvento, ErroDeCatalogo> {
  const { ticker, pagamento } = rendimento;
  const situacao = catalogo.situacaoDoFundoEm(ticker, pagamento);
  if (!situacao.ok) {
    return situacao;
  }
  const requisitos = regime.proventos.fii;
  return ok(
    cumpreOsRequisitos(rendimento, situacao.valor, requisitos)
      ? isento(rendimento)
      : exclusivoNaFonte(rendimento, requisitos.aliquotaSemIsencao),
  );
}

function cumpreOsRequisitos(
  { cotas }: RendimentoDeFii,
  fundo: SituacaoDoFundo,
  { minimoDeCotistas, participacaoAbaixoDe }: RequisitosDaIsencaoDoFii,
): boolean {
  const { numerador, denominador } = participacaoAbaixoDe;
  const participacaoAbaixoDoLimite =
    cotas.paraBigInt() * denominador <
    fundo.cotasEmitidas.paraBigInt() * numerador;
  return (
    fundo.negociacao === 'bolsa-ou-balcao-organizado' &&
    fundo.cotistas >= minimoDeCotistas &&
    participacaoAbaixoDoLimite
  );
}
// #endregion
