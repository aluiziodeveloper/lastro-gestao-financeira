// Os casos de uso, a porta do repositório e os dados de referência que
// eles recebem, reunidos para o ponto de entrada do pacote.
export type { DadosDeReferencia } from '../dominio/dados-de-referencia.js';
export type { RepositorioDeCarteiras } from './portas.js';
export { posicaoDaCarteira } from './posicao-da-carteira.js';
export { projecaoAPartirDeHoje } from './projecao-a-partir-de-hoje.js';
export {
  type ErroDeRegistro,
  registrarOperacoes,
} from './registrar-operacoes.js';
export { relatorioDoMesDaCarteira } from './relatorio-da-carteira.js';
