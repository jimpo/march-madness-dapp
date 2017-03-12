// @flow

import Web3 from 'web3';

import {waitForCondition} from './util';


function createWeb3(): Web3 {
  if (typeof web3 !== 'undefined') {
    return new Web3(web3.currentProvider);
  }
  else {
    return new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  }
}

export const web3 = createWeb3();

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
