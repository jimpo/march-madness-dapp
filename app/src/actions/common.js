// TODO: Refactor this file away

import contractStore from '../stores/contract';
import bracketStore from '../stores/bracket';
import MarchMadnessWrapper from '../MarchMadnessWrapper';

const marchMadness = new MarchMadnessWrapper();

export function bracketAddressChanged() {
  const address = bracketStore.address;
  return marchMadness.hasCollectedWinnings(address)
    .then((result) => contractStore.collectedWinnings.set(address, result))
    .then(() => marchMadness.fetchCommitment(address))
    .then((commitment) => contractStore.commitments.set(address, commitment))
    .then(() => {
      if (bracketStore.picks.complete && bracketStore.results.complete) {
        scoreBracket();
      }
    });
}

function scoreBracket() {
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
