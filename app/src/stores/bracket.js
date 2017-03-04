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
  reset() {
    this.picks = new Array(63);
    this.salt = randomBytes(SALT_SIZE).toString('hex');
  }

  @computed get complete() {
    return _.every(this.picks, _.isNumber);
  }

  @computed get commitment() {
    if (this.complete && this.salt) {
      return web3.sha3(
        this.address.replace(/^0x/, ''),
        this.toByteBracket(),
        this.salt
      );
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

    if (web3.sha3(address, byteBracket, salt) !== "0x" + checksum) {
      throw new Error("Submission key failed checksum");
    }

    this.address = "0x" + address;
    this.loadByteBracket(byteBracket);
    this.salt = salt;
  }
}

const bracketStore = new Bracket();
export default bracketStore;

window.randomFillBracket = function() {
  bracketStore.loadByteBracket(randomBytes(8));
}
