import {action, observable, computed} from 'mobx';
import _ from 'underscore';

import * as ipfs from '../ipfs';
import web3 from '../web3';
import {abi, networks} from "../../../build/contracts/MarchMadness";


class ContractStore {
  NO_COMMITMENT = "0x0000000000000000000000000000000000000000000000000000000000000000";

  @observable creator;
  @observable entryFee;
  @observable scoringDuration;
  @observable tournamentDataIPFSHash;
  @observable tournamentStartTime;
  @observable timeToTournamentStart;
  @observable commitments = new Map();

  constructor() {
    const networkKey = _.max(_.keys(networks));
    this.address = networks[networkKey].address;

    const MarchMadness = web3.eth.contract(abi);
    this.marchMadness = MarchMadness.at(this.address);
  }

  fetchCommitment(account) {
    return new Promise((resolve, reject) => {
      this.marchMadness.getCommitment(account, (error, commitment) => {
        if (error) return reject(error);

        this.commitments.set(account, commitment);
        return resolve(commitment);
      });
    });
  }

  @computed get tournamentStarted() {
    return this.timeToTournamentStart === 0;
  }

  contractState(property) {
    if (!this.address) {
      return Promise.reject(new Error("Contract address is not set"));
    }

    return new Promise((resolve, reject) => {
      this.marchMadness[property]((error, value) => {
        if (error) return reject(error);
        return resolve(value);
      });
    });
  }
}

export default new ContractStore();
