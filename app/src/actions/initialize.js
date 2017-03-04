import {action} from 'mobx';

import * as ipfs from '../ipfs';
import applicationStore from '../stores/application';
import contractStore from '../stores/contract';
import bracketStore from '../stores/bracket';
import tournamentStore from '../stores/tournament';
import {dateToTimestamp} from '../util';
import web3 from '../web3';


export function initialize() {
  return checkConnections()
    .then(initializeContract)
    .then(initializeTournament)
    .then(initializeBracket)
    .catch((error) => {
      applicationStore.error = error;
      console.error(error);
    });
}

function checkConnections() {
  return Promise.all([
    applicationStore.checkEthereumConnection(),
    applicationStore.checkIpfsConnection()
  ])
    .then(() => {
      if (!applicationStore.ethereumNodeConnected) {
        throw Error("See below for instructions on connecting to the Ethereum network");
      }
      if (!applicationStore.ipfsNodeConnected) {
        throw Error("See below for instructions on running an IPFS node");
      }
    });
}

function initializeBracket() {
  if (localStorage.submissionKey) {
    try {
      bracketStore.deserialize(localStorage.submissionKey);
    }
    catch (e) {
      delete localStorage.submissionKey;
    }
  }

  if (!bracketStore.address) {
    const defaultAddress = web3.eth.defaultAccount || web3.eth.accounts[0];
    if (!defaultAddress) {
      throw Error("Cannot find default Ethereum account");
    }

    bracketStore.address = defaultAddress;
    bracketStore.reset();
  }

  return contractStore.fetchCommitment(bracketStore.address)
    .then((commitment) => {
      if (!commitment) {
        bracketStore.editable = true;
      }
      else if (commitment !== bracketStore.commitment) {
        bracketStore.reset();
        throw new Error(
          "A bracket has already been entered for your Ethereum account. " +
            "Load the bracket using the submission key."
        );
      }
    });
}

function initializeTournament() {
  return ipfs.getPath(contractStore.tournamentDataIPFSHash)
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
