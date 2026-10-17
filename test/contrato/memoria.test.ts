import { repositorioEmMemoria } from '../../src/adaptadores/memoria/repositorio.js';
import { contratoDoRepositorio } from './repositorio.contrato.js';

// #region contrato-memoria
contratoDoRepositorio('memória', () =>
  Promise.resolve(repositorioEmMemoria()),
);
// #endregion
