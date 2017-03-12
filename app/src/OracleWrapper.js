import _ from 'underscore';

import {web3} from './web3';
import {abi, networks} from "../../build/contracts/FederatedOracleBytes8";

const FederatedOracleBytes8 = web3.eth.contract(abi);

export default class OracleWrapper {
  constructor() {
    this.network = _.last(_.keys(networks));
    this.address = networks[this.network].address;
    this.oracle = FederatedOracleBytes8.at(this.address);
  }

  voterStatus(account) {
    return new Promise((resolve, reject) => {
      this.oracle.voters(account, (error, results) => {
        if (error) return reject(error);
        return resolve(results);
      });
    });
  }
}
