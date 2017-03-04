import {action} from 'mobx';

import * as ipfs from '../ipfs';
import applicationStore from '../stores/application-store';
import contractStore from '../stores/contract-store';
import bracketStore from '../stores/bracket';
import tournamentStore from '../stores/tournament';
import web3 from '../web3';


export function createBracket() {
  applicationStore.screen = 'BracketScreen';
}

export function loadBracket() {
  applicationStore.error = null;
  if (bracketStore.complete) {
    applicationStore.screen = 'BracketScreen';
  }
  else {
    applicationStore.screen = 'LoadBracketScreen';
  }
}

export function doneCreatingBracket() {
  applicationStore.screen = 'SubmitBracketScreen';
}

export function submissionKeyEntered(key) {
  action(() => {
    applicationStore.error = null;
    try {
      bracketStore.deserialize(key);
    }
    catch (e) {
      applicationStore.error = e;
      return;
    }

    localStorage.submissionKey = key;
    applicationStore.screen = 'BracketScreen';
  })();
}

export function submitBracket() {
  submitBracketCommitment()
    .catch((err) => applicationStore.error = err);
  //applicationStore.screen = 'SpinnerScreen';
}

function submitBracketCommitment() {
  return new Promise((resolve, reject) => {
    const options = {
      from: bracketStore.address,
      value: contractStore.entryFee
    };
    const callback = (err, txHash) => {
      if (err) return reject(err);

      web3.eth.getTransactionReceipt(txHash, (err, receipt) => {
        if (err) return reject(err);

        localStorage.submissionKey = bracketStore.submissionKey;
        console.log(receipt.logs);
        return resolve();
      });
    };
    contractStore.marchMadness.submitBracket(bracketStore.commitment, options, callback);
  });
}
