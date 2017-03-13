// @flow

import Web3 from 'web3';

import {waitForCondition} from './util';


export const web3 = new Web3();

export function resetWeb3Provider() {
  if (window.web3) {
    web3.setProvider(window.web3.currentProvider);
  }
  else {
    web3.setProvider(new Web3.providers.HttpProvider("http://localhost:8545"));
  }
}

export function waitForConfirmation(txHash: string): Promise<void> {
  return waitForCondition(() => {
    return new Promise((resolve, reject) => {
      web3.eth.getTransaction(txHash, (err, {blockHash}) => {
        if (err) return reject(err);
        resolve(blockHash != null);
      });
    });
  });
}
