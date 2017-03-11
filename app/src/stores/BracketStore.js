// @flow

import {action, observable, computed} from 'mobx';
import {randomBytes} from 'crypto';
import _ from 'underscore';

import * as util from '../util';
import BracketSelection from '../models/BracketSelection';
import type TournamentStore from './TournamentStore';
import web3 from '../web3';

const SALT_SIZE = 16;


export default class BracketStore {
  @observable address: string;
  @observable picks: BracketSelection;
  @observable results: BracketSelection;
  @observable salt: string;
  @observable score: number;

  constructor(tournamentStore: TournamentStore) {
    this.picks = new BracketSelection(tournamentStore);
    this.results = new BracketSelection(tournamentStore);
  }

  @action
  reset() {
    this.picks.reset();
    this.salt = randomBytes(SALT_SIZE).toString('hex');
  }

  @computed get commitment(): ?string {
    if (this.picks.complete && this.salt) {
      return web3.sha3(this.address + this.picks.toByteBracket() + this.salt, { encoding: 'hex' });
    }
  }

  @computed get submissionKey(): ?string {
    const commitment = this.commitment;
    if (commitment) {
      return this.address.slice(2) +
        this.picks.toByteBracket() +
        this.salt +
        commitment.slice(2);
    }
  }

  @action
  deserialize(key: string): void {
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
