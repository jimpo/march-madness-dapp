// @flow

import {action, observable, computed} from 'mobx';
import _ from 'underscore';

import * as util from '../util';
import type Team from '../models/Team';
import type TournamentStore from '../stores/TournamentStore';


export default class BracketSelection {
  tournament: TournamentStore;

  @observable winners: (?number)[];

  constructor(tournament: TournamentStore) {
    this.tournament = tournament;
    this.reset();
  }

  reset() {
    this.winners = new Array(63);
  }

  team1InGame(gameNumber: number): ?Team {
    const round = util.roundOfGame(gameNumber);
    if (round === 0) {
      return this.tournament.teams[2 * gameNumber];
    }
    else {
      const previousGames = util.previousGames(gameNumber);
      const teamNumber = this.winners[previousGames[0]];
      return teamNumber == null ? null : this.tournament.teams[teamNumber];
    }
  }

  team2InGame(gameNumber: number): ?Team {
    const round = util.roundOfGame(gameNumber);
    if (round === 0) {
      return this.tournament.teams[2 * gameNumber + 1];
    }
    else {
      const previousGames = util.previousGames(gameNumber);
      const teamNumber = this.winners[previousGames[1]];
      return teamNumber == null ? null : this.tournament.teams[teamNumber];
    }
  }

  @computed get complete(): boolean {
    return _.every(this.winners, _.isNumber);
  }

  @action
  selectWinner(gameNumber: number, teamNumber: number): void {
    const oldWinner = this.winners[gameNumber];
    this.winners[gameNumber] = teamNumber;

    if (oldWinner !== teamNumber && oldWinner !== undefined) {
      while (gameNumber < 62) {
        gameNumber = util.nextGame(gameNumber);
        if (this.winners[gameNumber] !== oldWinner) {
          break;
        }
        this.winners[gameNumber] = undefined;
      }
    }
  }

  toByteBracket(): string {
    // MSB is ignored, but setting it to 1 ensures that the value is non-zero.
    let byteBracketStr = '1';
    for (let i = 62; i >= 0; i--) {
      const team = this.team1InGame(i);
      if (!team) {
        throw Error("Cannot call toByteBracket on an incomplete BracketSelection");
      }
      byteBracketStr += this.winners[i] == team.number ? '1' : '0';
    }
    return util.bitstringToBuffer(byteBracketStr).toString('hex');
  }

  @action
  loadByteBracket(byteBracket: string): void {
    let byteBracketStr = util.bufferToBitstring(new Buffer(byteBracket, 'hex'));
    for (let i = 0; i < 63; i++) {
      if (byteBracketStr[63 - i] === '1') {
        const team: Team = this.team1InGame(i);
        this.winners[i] = team.number;
      }
      else {
        const team: Team = this.team2InGame(i);
        this.winners[i] = team.number;
      }
    }
  }
}
