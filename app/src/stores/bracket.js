import {action, observable, computed} from 'mobx';
import {randomBytes} from 'crypto';
import _ from 'underscore';

import * as util from '../util';
import tournament from './tournament';
import web3 from '../web3';

const SALT_SIZE = 16;


class Bracket {
  @observable address;
  @observable picks = new Array(63);
  @observable salt;
  @observable editable = false;

  constructor() {
    this.tournament = tournament;
  }

  generateSalt() {
    this.salt = randomBytes(SALT_SIZE).toString('hex');
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

  @computed get complete() {
    return _.every(this.picks, _.isNumber);
  }

  @computed get commitment() {
    if (this.complete && this.salt) {
      return web3.sha3(this.toByteBracket(), this.salt);
    }
  }

  @computed get submissionKey() {
    return this.address.replace(/^0x/, '') +
      this.toByteBracket() +
      this.salt +
      this.commitment.replace(/^0x/, '');
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
    return util.bitstringToBuffer(byteBracketStr).toString('hex');
  }

  @action
  loadByteBracket(byteBracket) {
    let byteBracketStr = util.bufferToBitstring(new Buffer(byteBracket, 'hex'));
    for (let i = 0; i < 63; i++) {
      if (byteBracketStr[63 - i] === '1') {
        this.picks[i] = this.team1InGame(i).number;
      }
      else {
        this.picks[i] = this.team2InGame(i).number;
      }
    }
  }

  @action
  loadSubmissionKey() {
    if (!web3.eth.accounts.includes(bracketStore.address)) {
      throw Error(" ");
    }
  }
}

const bracketStore = new Bracket();
export default bracketStore;

window.randomFillBracket = function() {
  bracketStore.loadByteBracket(randomBytes(8));
}
