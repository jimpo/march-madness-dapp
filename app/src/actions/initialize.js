import {action} from 'mobx';

import * as ipfs from '../ipfs';
import {applicationStore, bracketStore, contractStore, tournamentStore} from '../stores';
import {dateToTimestamp} from '../util';
import MarchMadnessWrapper from '../MarchMadnessWrapper';
import OracleWrapper from '../OracleWrapper';
import web3 from '../web3';
import {bracketAddressChanged} from './common';

const marchMadness = new MarchMadnessWrapper();
const oracle = new OracleWrapper();

export function initialize() {
  return waitForConnections()
    .then(initializeContract)
    .then(initializeTournament)
    .then(initializeBracket)
    .then(initializeOracle)
    .catch((error) => {
      applicationStore.error = error;
      console.error(error);
    });
}

function checkConnections() {
  let error = null;

  return Promise.resolve()
    .then(() => {
      let ethereumError = null;
      if (!web3.isConnected()) {
        ethereumError = new Error("See below for instructions on connecting to the Ethereum network");
      }
      else if (web3.version.network !== marchMadness.network) {
        ethereumError = new Error("The Ethereum node is connected to the wrong network");
      }

      applicationStore.ethereumNodeConnected = !ethereumError;
      error = error || ethereumError;
    })
    .then(() => {
      return ipfs.isGatewayAvailable()
        .then((isAvailable) => {
          applicationStore.ipfsNodeConnected = isAvailable;
          if (!isAvailable) {
            error = error || new Error("See below for instructions on running an IPFS node");
          }
        });
    })
    .then(() => applicationStore.error = error);
}

function waitForConnections() {
  return new Promise((resolve) => {
    let intervalId;
    const repeatedCheck = () => {
      checkConnections()
        .then(() => {
          if (applicationStore.ethereumNodeConnected && applicationStore.ipfsNodeConnected) {
            clearInterval(intervalId);
            resolve();
          }
        });
    };
    intervalId = setInterval(repeatedCheck, 1000);
    repeatedCheck();
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
    bracketStore.address = contractStore.account;
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
  contractStore.account = web3.eth.defaultAccount || web3.eth.accounts[0];
  if (!contractStore.account) {
    throw Error("Cannot find default Ethereum account");
  }

  return Promise.all([
    marchMadness.fetchContractState('entryFee'),
    marchMadness.fetchContractState('tournamentStartTime'),
    marchMadness.fetchContractState('scoringDuration'),
    marchMadness.fetchContractState('tournamentDataIPFSHash'),
    marchMadness.fetchContractState('results'),
    marchMadness.fetchContractState('contestOverTime'),
    marchMadness.fetchContractState('winningScore')
  ])
    .then(action((values) => {
      contractStore.entryFee = values[0];
      contractStore.tournamentStartTime = values[1];
      contractStore.scoringDuration = values[2];
      contractStore.tournamentDataIPFSHash = values[3];
      contractStore.results = values[4];
      contractStore.contestOverTime = values[5];
      contractStore.winningScore = values[6];
    }))
    .then(() => {
      startCountdown('tournamentStartTime', 'timeToTournamentStart');
      if (!contractStore.contestOverTime.isZero()) {
        startCountdown('contestOverTime', 'timeToContestOver');
      }
    });
}

function initializeOracle() {
  return oracle.voterStatus(contractStore.account)
    .then(action(([isVoter, hasVoted]) => {
      contractStore.oracleIsVoter = isVoter;
      contractStore.oracleHasVoter = hasVoted;
    }));
}
