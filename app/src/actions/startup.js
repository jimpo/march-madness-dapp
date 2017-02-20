import {action} from 'mobx';

import applicationStore from '../stores/application';
import contractStore from '../stores/contract';
import bracketStore from '../stores/bracket';
import tournamentStore from '../stores/tournament';
import MarchMadnessWrapper from '../MarchMadnessWrapper';
import {bracketAddressChanged} from './common';

const marchMadness = new MarchMadnessWrapper();

export function createBracket(): void {
  applicationStore.screen = 'CreateBracketScreen';
}

export function loadBracket(): void {
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
  const options = {
    byteBracket: bracketStore.results.toByteBracket(),
    address: bracketStore.address
  };
  marchMadness.submitResults(options)
    .then(() => marchMadness.getBracketScore(bracketStore.picks.toByteBracket()))
    .then(action((score) => {
      bracketStore.score = score;
      contractStore.results = options.byteBracket;
      applicationStore.screen = 'StartScreen';
    }))
    .catch((err) => applicationStore.error = err);
}

export function enterResults() {
  applicationStore.screen = 'ResultsBracketScreen';
}

export function submissionKeyEntered(key) {
  applicationStore.error = null;
  try {
    bracketStore.deserialize(key);
  }
  catch (e) {
    applicationStore.error = e;
    return;
  }

  localStorage.submissionKey = key;

  bracketAddressChanged()
    .then(() => applicationStore.screen = 'BracketScreen')
    .catch((err) => applicationStore.error = err);
}

export function submitBracket() {
  const options = {
    commitment: bracketStore.commitment,
    address: bracketStore.address,
    entryFee: contractStore.entryFee
  };
  marchMadness.submitBracketCommitment(options)
    .then(action(() => {
      localStorage.submissionKey = bracketStore.submissionKey;
      applicationStore.screen = 'BracketScreen';
    }))
    .catch((err) => applicationStore.error = err);
}

export function revealBracket() {
  const options = {
    byteBracket: bracketStore.picks.toByteBracket(),
    salt: bracketStore.salt,
    address: bracketStore.address
  };
  marchMadness.revealBracket(options)
    .then(() => marchMadness.scoreBracket(options.address))
    .then((score) => contractStore.scores.set(bracketStore.address, score))
    .catch((err) => applicationStore.error = err);
}

export function collectWinnings() {
  marchMadness.collectWinnings(bracketStore.address)
    .then(() => contractStore.collectedWinnings.set(bracketStore.address, true))
    .catch((err) => applicationStore.error = err);
}
