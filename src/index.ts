// #region api-publica
// O contrato público do Lastro: o que um programa pode importar de
// '@aluiziodeveloper/lastro'. O domínio e os casos de uso, sem banco
// nem HTTP, que ficam em '@aluiziodeveloper/lastro/adaptadores'. Tirar
// ou renomear um nome daqui é mudança incompatível: versão maior.

// Valores do domínio
export { Dinheiro } from './dominio/dinheiro.js';
export {
  type ErroDeQuantidade,
  Quantidade,
} from './dominio/quantidade.js';
export { type ErroDeTicker, Ticker } from './dominio/ticker.js';
export { err, ok, type Result } from './dominio/resultado.js';
export {
  criarDataDePregao,
  type DataDePregao,
  type ErroDeDataDePregao,
} from './dominio/data-de-pregao.js';
export {
  criarIdDeOperacao,
  type ErroDeIdDeOperacao,
  type IdDeOperacao,
} from './dominio/id-de-operacao.js';
export {
  criarIdDeCarteira,
  type ErroDeIdDeCarteira,
  type IdDeCarteira,
} from './dominio/id-de-carteira.js';

// Operações e carteira
export {
  type CamposDaOperacao,
  type Compra,
  criarCompra,
  criarVenda,
  type Operacao,
  type Venda,
} from './dominio/operacao.js';
export { Carteira } from './dominio/carteira.js';
export type {
  ErroDeCarteira,
  ErroDeOperacao,
} from './dominio/erros.js';

// Dados de referência da apuração
export {
  CatalogoDeAtivos,
  type ErroDeCatalogo,
} from './dominio/ativo.js';
export {
  type ClasseDeAtivo,
  classesDeAtivo,
} from './dominio/classe-de-ativo.js';
export {
  type CalendarioDeDiasUteis,
  calendarioNacional,
} from './dominio/calendario.js';
export { definicoesDoLastro } from './dominio/regime/regimes.js';
export {
  type ErroDeRegimes,
  RegimesTributarios,
} from './dominio/regime/regimes-tributarios.js';
export {
  type ErroDeMesDeApuracao,
  MesDeApuracao,
} from './dominio/apuracao/mes-de-apuracao.js';
export type { Relogio } from './dominio/relogio.js';

// Casos de uso e a porta do repositório
export {
  type DadosDeReferencia,
  type ErroDeRegistro,
  posicaoDaCarteira,
  projecaoAPartirDeHoje,
  registrarOperacoes,
  relatorioDoMesDaCarteira,
  type RepositorioDeCarteiras,
} from './aplicacao/index.js';
// #endregion
