// @flow

import type BigNumber from 'bignumber';
import _ from 'underscore';

import {web3, waitForConfirmation} from './web3';
import {abi, networks} from "../../build/contracts/MarchMadness";

const MarchMadness = web3.eth.contract(abi);

type Address = string;


export default class MarchMadnessWrapper {
  networkID: string;
  address: Address;
  marchMadness: MarchMadness;

  constructor() {
    this.networkID = _.last(_.keys(networks));
    this.address = networks[this.networkID].address;
    this.marchMadness = MarchMadness.at(this.address);
  }

  fetchContractState(property: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.marchMadness[property]((error, value) => {
        if (error) return reject(error);
        resolve(value);
      });
    });
  }

  fetchCommitment(account: Address): Promise<string> {
    return new Promise((resolve, reject) => {
      this.marchMadness.getCommitment(account, (error, commitment) => {
        if (error) return reject(error);
        return resolve(commitment);
      });
    });
  }

  fetchScore(account: Address): Promise<BigNumber> {
    return new Promise((resolve, reject) => {
      this.marchMadness.getScore(account, (error, score) => {
        if (error) return reject(error);
        return resolve(score);
      });
    });
  }

  fetchBracket(account: Address): Promise<string> {
    return new Promise((resolve, reject) => {
      this.marchMadness.getBracket(account, (error, byteBracket) => {
        if (error) return reject(error);
        return resolve(byteBracket);
      });
    });
  }

  hasCollectedWinnings(account: Address): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.marchMadness.hasCollectedWinnings(account, (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      });
    });
  }

  submitBracketCommitment(
    {commitment, address, entryFee}: {commitment: string, address: Address, entryFee: BigNumber}
  )
    : Promise<void>
  {
    const submitBracketPromise = new Promise((resolve, reject) => {
      const options = {
        from: address,
        value: entryFee
      };
      this.marchMadness.submitBracket(commitment, options, (err, txHash) => {
        if (err) return reject(err);
        resolve(txHash);
      });
    });

    return submitBracketPromise
      .then((txHash) => waitForConfirmation(txHash))
      .then(() => this.fetchCommitment(address))
      .then((contractCommitment) => {
        if (commitment !== contractCommitment) {
          throw Error("Submission was not accepted for unknown reason");
        }
      });
  }

  revealBracket({byteBracket, salt, address}: {byteBracket: string, salt: string, address: Address})
    : Promise<BigNumber>
  {
    const revealBracket = () => {
      return new Promise((resolve, reject) => {
        this.marchMadness.revealBracket("0x" + byteBracket, "0x" + salt, {from: address}, (err, txHash) => {
          if (err) return reject(err);
          resolve(txHash);
        });
      });
    };
    const scoreBracket = () => {
      return new Promise((resolve, reject) => {
        this.marchMadness.scoreBracket(address, {from: address, gas: 200000}, (err, txHash) => {
          if (err) return reject(err);
          resolve(txHash);
        });
      });
    };

    return revealBracket()
      .then((txHash) => waitForConfirmation(txHash))
      .then(() => scoreBracket())
      .then((txHash) => waitForConfirmation(txHash))
      .then(() => this.fetchScore(address))
      .then((score) => {
        if (score.isZero()) {
          throw new Error("Bracket could not be revealed for unknown reason");
        }
        return score;
      });
  }

  getBracketScore(byteBracket: string): Promise<number> {
    return new Promise((resolve, reject) => {
      this.marchMadness.getBracketScore("0x" + byteBracket, (err, score) => {
        if (err) return reject(err);
        resolve(score);
      });
    });
  }

  collectWinnings(account: Address): Promise<void> {
    const collectWinnings = () => {
      return new Promise((resolve, reject) => {
        this.marchMadness.collectWinnings({ from: account }, (err, score) => {
          if (err) return reject(err);
          resolve(score);
        });
      })
    };
    return collectWinnings()
      .then(() => this.hasCollectedWinnings(account))
      .then((done) => {
        if (!done) {
          throw new Error("Winnings could not be collected for unknown reason");
        }
      });
  }

  startScoring({address}: {address: Address}): Promise<void> {
    const startScoring = () => {
      return new Promise((resolve, reject) => {
        this.marchMadness.startScoring({from: address}, (err, txHash) => {
          if (err) return reject(err);
          resolve(txHash);
        });
      })
    };
    return startScoring()
      .then((txHash) => waitForConfirmation(txHash));
  }
}
