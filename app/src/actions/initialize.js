import {action} from 'mobx';

import * as ipfs from '../ipfs';
import applicationStore from '../stores/application';
import contractStore from '../stores/contract';
import bracketStore from '../stores/bracket';
import tournamentStore from '../stores/tournament';
import {dateToTimestamp} from '../util';
import MarchMadnessWrapper from '../MarchMadnessWrapper';
import web3 from '../web3';
import {bracketAddressChanged} from './common';

const marchMadness = new MarchMadnessWrapper();

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

  return bracketAddressChanged()
    .then(() => {
      const commitment = contractStore.commitments.get(bracketStore.address);
      if (commitment !== contractStore.NO_COMMITMENT && commitment !== bracketStore.commitment) {
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
    .then(action(({name, teams, regions}) => {
      tournamentStore.name = name;
      tournamentStore.teams = teams;
      tournamentStore.regions = regions;

      if (contractStore.resultsSubmitted) {
        bracketStore.results.loadByteBracket(contractStore.results.slice(2));
      }
    }));
}

function startCountdown(timeField, countdownField) {
  let intervalId;
  const updateCountdown = () => {
    const now = dateToTimestamp(new Date());
    if (now > contractStore[timeField]) {
      contractStore[countdownField] = 0;
      clearInterval(intervalId);
    }
    else {
      contractStore[countdownField] = contractStore[timeField] - now;
    }
  };
  intervalId = setInterval(updateCountdown, 5000);
  updateCountdown();
}

function initializeContract() {
  return Promise.all([
    marchMadness.fetchContractState('creator'),
    marchMadness.fetchContractState('entryFee'),
    marchMadness.fetchContractState('tournamentStartTime'),
    marchMadness.fetchContractState('scoringDuration'),
    marchMadness.fetchContractState('tournamentDataIPFSHash'),
    marchMadness.fetchContractState('results'),
    marchMadness.fetchContractState('contestOverTime'),
    marchMadness.fetchContractState('winningScore')
  ])
    .then(action((values) => {
      contractStore.creator = values[0];
      contractStore.entryFee = values[1];
      contractStore.tournamentStartTime = values[2];
      contractStore.scoringDuration = values[3];
      contractStore.tournamentDataIPFSHash = values[4];
      contractStore.results = values[5];
      contractStore.contestOverTime = values[6];
      contractStore.winningScore = values[7];
    }))
    .then(() => {
      startCountdown('tournamentStartTime', 'timeToTournamentStart');
      if (!contractStore.contestOverTime.isZero()) {
        startCountdown('contestOverTime', 'timeToContestOver');
      }
    });
}
