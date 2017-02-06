import {observable} from 'mobx';

import * as util from '../util';


export default class Bracket {
  //@observable picks = [];

  constructor(tournament) {
    this.tournament = tournament;
  }

  team1InGame(gameNumber) {
    const round = util.roundOfGame(gameNumber);
    if (round === 0) {
      return this.tournament.getTeam(2 * gameNumber);
    }
    else {
      return null;
      const previousGames = util.previousGames(gameNumber);
      return this.picks[previousGames[0]];
    }
  }

  team2InGame(gameNumber) {
    const round = util.roundOfGame(gameNumber);
    if (round === 0) {
      return this.tournament.getTeam(2 * gameNumber + 1);
    }
    else {
      return null;
      const previousGames = util.previousGames(gameNumber);
      return this.picks[previousGames[1]];
    }
  }

  toByteBracket() {
    // MSB is ignored, but setting it to 1 ensures that the value is non-zero.
    let byteBracket = 1;
    for (let i = 62; i >= 0; i--) {
      byteBracket <<= 1;
      if (picks[i] == this.team1InGame(i)) {
        byteBracket |= 1;
      }
    }
    return byteBracket;
  }

  static fromByteBracket(byteBracket) {
    const bracket = new Bracket();
    for (let i = 0; i < 63; i++) {
      if (byteBracket & 1) {
        bracket.picks.push(bracket.team1InGame(i));
      }
      else {
        bracket.picks.push(bracket.team2InGame(i));
      }
      byteBracket >>= 1;
    }
    return bracket;
  }
}
