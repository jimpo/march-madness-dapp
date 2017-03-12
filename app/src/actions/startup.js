// @flow

import {action} from 'mobx';

import {applicationStore, bracketStore, contractStore, tournamentStore} from '../stores';
import MarchMadnessWrapper from '../MarchMadnessWrapper';
import OracleWrapper from '../OracleWrapper';
import {bracketAddressChanged} from './common';
import {waitForConfirmation} from '../web3';

const marchMadness = new MarchMadnessWrapper();
const oracle = new OracleWrapper();

export function createBracket() {
  applicationStore.screen = 'CreateBracketScreen';
}

export function loadBracket() {
  applicationStore.clearAlert();
  if (!bracketStore.picks.complete) {
    applicationStore.screen = 'LoadBracketScreen';
  }
  else if (contractStore.commitments.get(bracketStore.address) === contractStore.NO_COMMITMENT) {
    applicationStore.screen = 'CreateBracketScreen';
  }
  else {
    applicationStore.screen = 'BracketScreen';
  }
}

export function doneCreatingBracket() {
  applicationStore.screen = 'SubmitBracketScreen';
}

export function submitResults() {
  applicationStore.alert('info', "Submiting to the Ethereum network...");

  const options = {
    byteBracket: bracketStore.results.toByteBracket(),
    address: bracketStore.address
  };
  oracle.submitResults(options)
    .then(() => oracle.getFinalValue())
    .then((value) => {
      if (value === '0x0000000000000000') {
        applicationStore.alert('success', "Your vote on the results has been submitted");
      }
      else {
        contractStore.results = options.byteBracket;
        return startScoringPhase();
      }
    })
    .catch((err) => applicationStore.alertError(err));
}

export function enterResults() {
  applicationStore.screen = 'ResultsBracketScreen';
}

export function submissionKeyEntered(key: string) {
  try {
    bracketStore.deserialize(key);
  }
  catch (e) {
    applicationStore.alertError(e);
    return;
  }

  localStorage.setItem('submissionKey', key);

  bracketAddressChanged()
    .then(loadBracket)
    .catch((err) => applicationStore.alertError(err));
}

export function submitBracket() {
  applicationStore.alert('info', "Submiting to the Ethereum network...");

  const options = {
    commitment: bracketStore.commitment,
    address: bracketStore.address,
    entryFee: contractStore.entryFee
  };
  marchMadness.submitBracketCommitment(options)
    .then(action(() => {
      localStorage.setItem('submissionKey', bracketStore.submissionKey);
      applicationStore.alert('success', "Your submission has been accepted");
      applicationStore.screen = 'BracketScreen';
    }))
    .catch((err) => applicationStore.alertError(err));
}

export function revealBracket() {
  const options = {
    byteBracket: bracketStore.picks.toByteBracket(),
    salt: bracketStore.salt,
    address: bracketStore.address
  };
  marchMadness.revealBracket(options)
    .then((score) => contractStore.scores.set(bracketStore.address, score))
    .catch((err) => applicationStore.alertError(err));
}

export function collectWinnings() {
  marchMadness.collectWinnings(bracketStore.address)
    .then(() => contractStore.collectedWinnings.set(bracketStore.address, true))
    .catch((err) => applicationStore.alertError(err));
}

function startScoringPhase() {
  return marchMadness.startScoring({address: contractStore.account})
    .then(() => {
      if (bracketStore.picks.complete) {
        return marchMadness.getBracketScore(bracketStore.picks.toByteBracket())
          .then((score) => bracketStore.score = score);
      }
    })
    .then(action(() => {
      applicationStore.alert(
        'success',
        "The results are in and the scoring period has begun"
      );
      applicationStore.screen = 'StartScreen';
    }));
}
