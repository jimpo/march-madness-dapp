import {action} from 'mobx';

import * as ipfs from '../ipfs';
import applicationStore from '../stores/application';
import contractStore from '../stores/contract';
import bracketStore from '../stores/bracket';
import tournamentStore from '../stores/tournament';
import web3 from '../web3';


export function createBracket() {
  applicationStore.screen = 'CreateBracketScreen';
}

export function loadBracket() {
  applicationStore.error = null;
  if (bracketStore.picks.complete) {
    applicationStore.screen = 'BracketScreen';
  }
  else {
    applicationStore.screen = 'LoadBracketScreen';
  }
}

export function doneCreatingBracket() {
  applicationStore.screen = 'SubmitBracketScreen';
}

export function submitResults() {
  const results = "0x" + bracketStore.results.toByteBracket();
  sendSubmitResults(results)
    .then(action(() => {
      contractStore.results = results;
      applicationStore.screen = 'StartScreen';
    }))
    .catch((err) => applicationStore.error = err);
}

export function enterResults() {
  applicationStore.screen = 'ResultsBracketScreen';
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
    contractStore.marchMadness.submitBracket(bracketStore.commitment, options, (err) => {
      if (err) return reject(err);

      contractStore.marchMadness.getCommitment(bracketStore.address, (err, contractCommitment) => {
        if (err) return reject(err);

        if (bracketStore.commitment !== contractCommitment) {
          return reject(new Error("Submission was not accepted for unknown reason"));
        }

        resolve();
      });
    });
  });
}

function sendSubmitResults(byteBracket) {
  return new Promise((resolve, reject) => {
    const options = { from: bracketStore.address };
    contractStore.marchMadness.submitResults(byteBracket, options, (err) => {
      if (err) return reject(err);

      contractStore.marchMadness.results((err, results) => {
        if (err) return reject(err);

        if (byteBracket !== results) {
          return reject(new Error("Submission was not accepted for unknown reason"));
        }

        resolve();
      });
    });
  });
}
