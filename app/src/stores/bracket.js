import {action, observable, computed} from 'mobx';
import {randomBytes} from 'crypto';
import _ from 'underscore';

import * as util from '../util';
import tournament from './tournament';
import web3 from '../web3';

const SALT_SIZE = 16;


class BracketSelection {
  @observable winners;

  constructor() {
    this.tournament = tournament;
    this.reset();
  }

  reset() {
    this.winners = new Array(63);
  }

  team1InGame(gameNumber) {
    const round = util.roundOfGame(gameNumber);
    if (round === 0) {
      return this.tournament.getTeam(2 * gameNumber);
    }
    else {
      const previousGames = util.previousGames(gameNumber);
      return this.tournament.getTeam(this.winners[previousGames[0]]);
    }
  }

  team2InGame(gameNumber) {
    const round = util.roundOfGame(gameNumber);
    if (round === 0) {
      return this.tournament.getTeam(2 * gameNumber + 1);
    }
    else {
      const previousGames = util.previousGames(gameNumber);
      return this.tournament.getTeam(this.winners[previousGames[1]]);
    }
  }

  @computed get complete() {
    return _.every(this.winners, _.isNumber);
  }

  //@action
  selectWinner(gameNumber, teamNumber) {
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

  toByteBracket() {
    // MSB is ignored, but setting it to 1 ensures that the value is non-zero.
    let byteBracketStr = '1';
    for (let i = 62; i >= 0; i--) {
      byteBracketStr += this.winners[i] == this.team1InGame(i).number ? '1' : '0';
    }
    return util.bitstringToBuffer(byteBracketStr).toString('hex');
  }

  //@action
  loadByteBracket(byteBracket) {
    let byteBracketStr = util.bufferToBitstring(new Buffer(byteBracket, 'hex'));
    for (let i = 0; i < 63; i++) {
      if (byteBracketStr[63 - i] === '1') {
        this.winners[i] = this.team1InGame(i).number;
      }
      else {
        this.winners[i] = this.team2InGame(i).number;
      }
    }
  }
}

class Bracket {
  @observable address;
  @observable picks = new BracketSelection();
  @observable results = new BracketSelection();
  @observable salt;

  @action
  reset() {
    this.picks.reset();
    this.salt = randomBytes(SALT_SIZE).toString('hex');
  }

  @computed get commitment() {
    if (this.picks.complete && this.salt) {
      return web3.sha3(this.address + this.picks.toByteBracket() + this.salt, { encoding: 'hex' });
    }
  }

  @computed get submissionKey() {
    return this.address.slice(2) +
      this.picks.toByteBracket() +
      this.salt +
      this.commitment.slice(2);
  }

  @action
  deserialize(key) {
    const addressLength = 40;
    const byteBracketLength = 16;
    const saltLength = SALT_SIZE * 2;
    const commitmentLength = 64;
    const totalLength = addressLength + byteBracketLength + saltLength + commitmentLength;

    if (key.length !== totalLength || !key.match(/^[0-9a-f]*$/)) {
      throw new Error("Invalid submission key");
    }

    let index = 0;
    const address = key.slice(index, index += addressLength);
    const byteBracket = key.slice(index, index += byteBracketLength);
    const salt = key.slice(index, index += saltLength);
    const checksum = key.slice(index, index += commitmentLength);

    if (!web3.eth.accounts.includes("0x" + address)) {
      throw Error("This submission appears to have been made by a different Ethereum client");
    }

    if (web3.sha3("0x" + address + byteBracket + salt, { encoding: 'hex' }) !== "0x" + checksum) {
      throw new Error("Submission key failed checksum");
    }

    this.address = "0x" + address;
    this.picks.loadByteBracket(byteBracket);
    this.salt = salt;
  }
}

const bracketStore = new Bracket();
export default bracketStore;
