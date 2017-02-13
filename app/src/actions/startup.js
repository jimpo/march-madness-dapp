import {action} from 'mobx';

import * as ipfs from '../ipfs';
import applicationStore from '../stores/application-store';
import contractStore from '../stores/contract-store';
import bracketStore from '../stores/bracket';
import tournamentStore from '../stores/tournament';
import {dateToTimestamp} from '../util';
import web3 from '../web3';


export function createBracket() {
  bracketStore.address = web3.eth.defaultAccount;
  bracketStore.generateSalt();
  contractStore.fetchCommitment(bracketStore.address)
    .then(() => {
      console.log(contractStore.commitments[bracketStore.address]);
    });
}

export function initialize() {
  checkConnections()
    .then((connected) => {
      if (connected) {
        initializeTournament();
      }
    })
    .catch(console.error);
}

function checkConnections() {
  return Promise.all([
    applicationStore.checkEthereumConnection(),
    applicationStore.checkIpfsConnection()
  ])
    .then(() => applicationStore.ethereumNodeConnected && applicationStore.ipfsNodeConnected);
}

function initializeTournament() {
  return initializeContract()
    .then(() => ipfs.getPath(contractStore.tournamentDataIPFSHash))
    .then((content) => JSON.parse(content))
    .then(action(({teams, regions}) => {
      tournamentStore.teams = teams;
      tournamentStore.regions = regions;
    }));
}

function startTournamentCountdown() {
  let intervalId;
  const updateTimeToTournamentStart = () => {
    const now = dateToTimestamp(new Date());
    if (now > contractStore.tournamentStartTime) {
      contractStore.timeToTournamentStart = 0;
      clearInterval(intervalId);
    }
    else {
      contractStore.timeToTournamentStart = contractStore.tournamentStartTime - now;
    }
  };
  intervalId = setInterval(updateTimeToTournamentStart, 5000);
  updateTimeToTournamentStart();
}

function initializeContract() {
  return Promise.all([
    contractStore.contractState('entryFee'),
    contractStore.contractState('tournamentStartTime'),
    contractStore.contractState('scoringDuration'),
    contractStore.contractState('tournamentDataIPFSHash')
  ])
    .then(action((results) => {
      contractStore.entryFee = results[0];
      contractStore.tournamentStartTime = results[1];
      contractStore.scoringDuration = results[2];
      contractStore.tournamentDataIPFSHash = results[3];
    }))
    .then(startTournamentCountdown);
}
