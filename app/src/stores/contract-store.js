import {action, observable} from 'mobx';
import _ from 'underscore';

import * as ipfs from '../ipfs';
import {abi, networks} from "../../../build/contracts/MarchMadness";


export default class ContractStore {
  @observable error;
  @observable address;
  @observable tournamentData;

  constructor(web3) {
    this.web3 = web3;
    this.MarchMadness = this.web3.eth.contract(abi);
    this.address =  _.values(networks)[0].address;
  }

  getTournamentData() {
    if (!this.address) {
      return Promise.reject(new Error("Contract address is not set"));
    }

    const marchMadness = this.MarchMadness.at(this.address);
    return new Promise((resolve, reject) => {
      marchMadness.tournamentDataIPFSHash((err, ipfsHash) => {
        if (err) return reject(err);

        ipfs.getPath(ipfsHash)
          .then((content) => JSON.parse(content))
          .then((json) => resolve(json))
          .catch(reject);
      });
    });
  }
}
