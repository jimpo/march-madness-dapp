import {action} from 'mobx';

import * as ipfs from '../ipfs';
import applicationStore from '../stores/application-store';
import contractStore from '../stores/contract-store';
import bracketStore from '../stores/bracket';
import tournamentStore from '../stores/tournament';
import web3 from '../web3';


export function createBracket() {
  applicationStore.screen = 'CreateBracketScreen';
}

export function doneCreatingBracket() {
  applicationStore.screen = 'SubmitBracketScreen';
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

        console.log(receipt.logs);
        resolve();
      });
    };
    contractStore.marchMadness.submitBracket(bracketStore.commitment, options, callback);
  });
}
