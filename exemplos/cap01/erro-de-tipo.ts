// Exemplo da Saída 1.2: o Vitest remove os tipos e executa; quem
// verifica os tipos é o tsc. Sem a marca abaixo, o typecheck falha.
import { valorBrutoDaOperacao } from '../../src/dominio/operacao.js';

// @ts-expect-error -- texto no lugar do preço (Saída 1.2)
export const valorBruto = valorBrutoDaOperacao('10', 100);
