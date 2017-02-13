import {action, observable, computed} from 'mobx';
import _ from 'underscore';

import * as ipfs from '../ipfs';
import web3 from '../web3';
import {abi, networks} from "../../../build/contracts/MarchMadness";


class ContractStore {
  @observable address;
  @observable tournamentStartTime;
  @observable commitments = {};

  constructor() {
    this.MarchMadness = web3.eth.contract(abi);

    const networkKey = _.max(_.keys(networks));
    this.address = networks[networkKey].address;
  }

  @computed get marchMadness() {
    return this.MarchMadness.at(this.address);
  }

  fetchCommitment(account) {
    return new Promise((resolve, reject) => {
      this.marchMadness.getCommitment(account, (error, commitment) => {
        if (error) return reject(error);

        this.commitments[account] = commitment;
        resolve();
      });
    });
  }
}

export default new ContractStore();
