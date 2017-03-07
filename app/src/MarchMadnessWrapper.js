import _ from 'underscore';

import web3 from './web3';
import {abi, networks} from "../../build/contracts/MarchMadness";

const MarchMadness = web3.eth.contract(abi);

export default class MarchMadnessWrapper {
  constructor() {
    const networkKey = _.max(_.keys(networks));
    this.address = networks[networkKey].address;
    this.marchMadness = MarchMadness.at(this.address);
  }

  fetchContractState(property) {
    return new Promise((resolve, reject) => {
      this.marchMadness[property]((error, value) => {
        if (error) return reject(error);
        resolve(value);
      });
    });
  }

  fetchCommitment(account) {
    return new Promise((resolve, reject) => {
      this.marchMadness.getCommitment(account, (error, commitment) => {
        if (error) return reject(error);
        return resolve(commitment);
      });
    });
  }

  fetchScore(account) {
    return new Promise((resolve, reject) => {
      this.marchMadness.getScore(account, (error, score) => {
        if (error) return reject(error);
        return resolve(score);
      });
    });
  }

  fetchBracket(account) {
    return new Promise((resolve, reject) => {
      this.marchMadness.getBracket(account, (error, byteBracket) => {
        if (error) return reject(error);
        return resolve(byteBracket);
      });
    });
  }

  hasCollectedWinnings(account) {
    return new Promise((resolve, reject) => {
      this.marchMadness.hasCollectedWinnings(account, (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      });
    });
  }

  submitBracketCommitment({ commitment, address, entryFee }) {
    return new Promise((resolve, reject) => {
      const options = {
        from: address,
        value: entryFee
      };
      this.marchMadness.submitBracket(commitment, options, (err) => {
        if (err) return reject(err);

        this.marchMadness.getCommitment(address, (err, contractCommitment) => {
          if (err) return reject(err);

          if (commitment !== contractCommitment) {
            return reject(new Error("Submission was not accepted for unknown reason"));
          }

          resolve();
        });
      });
    });
  }

  submitResults({ byteBracket, address }) {
    byteBracket = "0x" + byteBracket;
    return new Promise((resolve, reject) => {
      this.marchMadness.submitResults(byteBracket, { from: address }, (err) => {
        if (err) return reject(err);

        this.marchMadness.results((err, results) => {
          if (err) return reject(err);

          if (byteBracket !== results) {
            return reject(new Error("Results were not accepted for unknown reason"));
          }

          resolve();
        });
      });
    });
  }

  revealBracket({ byteBracket, salt, address }) {
    const revealPromise = new Promise((resolve, reject) => {
      const options = {
        from: address,
        gas: 200000
      };
      this.marchMadness.revealBracket("0x" + byteBracket, "0x" + salt, options, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    return revealPromise
      .then(() => this.fetchScore(address))
      .then((score) => {
        if (score.isZero()) {
          throw new Error("Bracket could not be revealed for unknown reason");
        }
        return score;
      });
  }

  getBracketScore(byteBracket) {
    return new Promise((resolve, reject) => {
      this.marchMadness.getBracketScore("0x" + byteBracket, (err, score) => {
        if (err) return reject(err);
        resolve(score);
      });
    });
  }

  collectWinnings(account) {
    const collectPromise = new Promise((resolve, reject) => {
      this.marchMadness.collectWinnings({ from: account }, (err, score) => {
        if (err) return reject(err);
        resolve(score);
      });
    });
    return collectPromise
      .then(() => this.hasCollectedWinnings(account))
      .then((done) => {
        if (!done) {
          throw new Error("Winnings could not be collected for unknown reason");
        }
      });
  }
}
