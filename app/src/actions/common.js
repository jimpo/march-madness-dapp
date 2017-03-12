// @flow

// TODO: Refactor this file away

import {web3} from '../web3';
import {bracketStore, contractStore} from '../stores';
import MarchMadnessWrapper from '../MarchMadnessWrapper';

const marchMadness = new MarchMadnessWrapper();

export function bracketAddressChanged(): Promise<void> {
  const address = bracketStore.address;
  return marchMadness.hasCollectedWinnings(address)
    .then((result) => contractStore.collectedWinnings.set(address, result))
    .then(() => marchMadness.fetchCommitment(address))
    .then((commitment) => contractStore.commitments.set(address, commitment))
    .then(() => {
      if (bracketStore.picks.complete && bracketStore.results.complete) {
        return scoreBracket();
      }
    });
}

export function updateTotalSubmissions(): Promise<void> {
  const getContractBalance = () => {
    return new Promise((resolve, reject) => {
      web3.eth.getBalance(marchMadness.address, (err, balance) => {
        if (err) return reject(err);
        resolve(balance);
      });
    });
  };
  return getContractBalance()
    .then((balance) => {
      contractStore.totalSubmissions = balance.div(contractStore.entryFee).toNumber();
    });
}

function scoreBracket(): Promise<void> {
  return marchMadness.fetchScore(bracketStore.address)
    .then((score) => {
      if (score.isZero()) {
        return marchMadness.getBracketScore(bracketStore.picks.toByteBracket());
      }
      else {
        contractStore.scores.set(bracketStore.address, score);
        return score;
      }
    })
    .then((score) => bracketStore.score = score);
}
