// @flow

import _ from 'underscore';

import {web3, waitForConfirmation} from './web3';
import {abi, networks} from "../../build/contracts/FederatedOracleBytes8";

const FederatedOracleBytes8 = web3.eth.contract(abi);

type Address = string;


export default class OracleWrapper {
  networkID: string;
  address: Address;
  oracle: FederatedOracleBytes8;

  constructor() {
    this.networkID = _.last(_.keys(networks));
    this.address = networks[this.networkID].address;
    this.oracle = FederatedOracleBytes8.at(this.address);
  }

  voterStatus(account: Address): Promise<[boolean, boolean]> {
    return new Promise((resolve, reject) => {
      this.oracle.voters(account, (error, results) => {
        if (error) return reject(error);
        return resolve(results);
      });
    });
  }

  getFinalValue(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.oracle.finalValue((error, value) => {
        if (error) return reject(error);
        return resolve(value);
      });
    });
  }

  submitResults({byteBracket, address}: {byteBracket: string, address: Address}): Promise<void> {
    byteBracket = "0x" + byteBracket;
    const submitResults = () => {
      return new Promise((resolve, reject) => {
        this.oracle.submitValue(byteBracket, {from: address}, (err, txHash) => {
          if (err) return reject(err);
          resolve(txHash);
        });
      });
    };

    return submitResults()
      .then((txHash) => waitForConfirmation(txHash))
      .then(() => this.voterStatus(address))
      .then(([_, hasVoted]) => {
        if (!hasVoted) {
          throw Error("Results could not be submitted successfully for an unknown reason");
        }
      });
  }
}
