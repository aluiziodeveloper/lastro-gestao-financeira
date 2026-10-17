// #region relogio-porta
// A porta do tempo. Quem precisa saber que horas são recebe um Relogio
// e não lê o relógio do sistema. A porta tem um método só, porque é
// tudo o que os seus usuários pedem: o instante de agora.
export interface Relogio {
  agora(): Date;
}
// #endregion
