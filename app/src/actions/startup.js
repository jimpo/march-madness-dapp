import {action} from 'mobx';

import * as ipfs from '../ipfs';
import applicationStore from '../stores/application-store';
import contractStore from '../stores/contract-store';
import bracketStore from '../stores/bracket';
import tournamentStore from '../stores/tournament';
import web3 from '../web3';


function getTournamentData() {
  if (!contractStore.address) {
    return Promise.reject(new Error("Contract address is not set"));
  }

  return new Promise((resolve, reject) => {
    contractStore.marchMadness.tournamentDataIPFSHash((err, ipfsHash) => {
      if (err) return reject(err);

      ipfs.getPath(ipfsHash)
        .then((content) => JSON.parse(content))
        .then((json) => resolve(json))
        .catch(reject);
    });
  });
}

export function createBracket() {
  bracketStore.address = web3.eth.defaultAccount;
  bracketStore.generateSalt();
  contractStore.fetchCommitment(bracketStore.address)
    .then(() => {
      console.log(contractStore.commitments[bracketStore.address]);
    });
}

export function initializeTournament() {
  Promise.all([
    applicationStore.checkEthereumConnection(),
    applicationStore.checkIpfsConnection()
  ])
    .then(() => {
      if (applicationStore.ethereumNodeConnected && applicationStore.ipfsNodeConnected) {
        return getTournamentData();
      }
    })
    .then(action(({teams, regions}) => {
      tournamentStore.teams = teams;
      tournamentStore.regions = regions;
    }));
}
