import {action, observable} from 'mobx';

import * as util from '../util';


const SALT_SIZE = 32;


export default class Bracket {
  @observable picks = new Array(64);

  constructor(tournament) {
    this.tournament = tournament;
    this.editable = true;
  }

  team1InGame(gameNumber) {
    const round = util.roundOfGame(gameNumber);
    if (round === 0) {
      return this.tournament.getTeam(2 * gameNumber);
    }
    else {
      const previousGames = util.previousGames(gameNumber);
      return this.tournament.getTeam(this.picks[previousGames[0]]);
    }
  }

  team2InGame(gameNumber) {
    const round = util.roundOfGame(gameNumber);
    if (round === 0) {
      return this.tournament.getTeam(2 * gameNumber + 1);
    }
    else {
      const previousGames = util.previousGames(gameNumber);
      return this.tournament.getTeam(this.picks[previousGames[1]]);
    }
  }

  @action
  makePick(gameNumber, teamNumber) {
    const oldPick = this.picks[gameNumber];
    this.picks[gameNumber] = teamNumber;

    if (oldPick !== teamNumber && oldPick !== undefined) {
      while (gameNumber < 62) {
        gameNumber = util.nextGame(gameNumber);
        if (this.picks[gameNumber] !== oldPick) {
          break;
        }
        this.picks[gameNumber] = undefined;
      }
    }
  }

  toByteBracket() {
    // MSB is ignored, but setting it to 1 ensures that the value is non-zero.
    let byteBracketStr = '1';
    for (let i = 62; i >= 0; i--) {
      byteBracketStr += this.picks[i] == this.team1InGame(i).number ? '1' : '0';
    }
    return util.bitstringToBuffer(byteBracketStr);
  }

  @action
  loadByteBracket(byteBracket) {
    let byteBracketStr = util.bufferToBitstring(byteBracket);
    for (let i = 0; i < 63; i++) {
      if (byteBracketStr[63 - i] === '1') {
        this.picks[i] = this.team1InGame(i).number;
      }
      else {
        this.picks[i] = this.team2InGame(i).number;
      }
    }
  }
}
