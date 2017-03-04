import {action} from 'mobx';

import * as ipfs from '../ipfs';
import applicationStore from '../stores/application';
import contractStore from '../stores/contract';
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
    .then(action(() => {
      localStorage.submissionKey = bracketStore.submissionKey;
      bracketStore.editable = false;
      applicationStore.screen = 'BracketScreen';
    }))
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

      web3.eth.getTransactionReceipt(txHash, (err, {logs}) => {
        if (err) return reject(err);

        const expectedTopic = contractStore.marchMadness.SubmissionAccepted().options.topics[0];
        if (!logs || !logs[0] || !logs[0].topics || logs[0].topics[0] !== expectedTopic) {
          return reject(new Error("Submission was not accepted for unknown reason"));
        }

        return resolve();
      });
    };
    contractStore.marchMadness.submitBracket(bracketStore.commitment, options, callback);
  });
}
