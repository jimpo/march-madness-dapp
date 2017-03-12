// @flow

import BigNumber from 'bignumber';
import {action} from 'mobx';

import * as ipfs from '../ipfs';
import {applicationStore, bracketStore, contractStore, tournamentStore} from '../stores';
import {dateToTimestamp, waitForCondition} from '../util';
import MarchMadnessWrapper from '../MarchMadnessWrapper';
import OracleWrapper from '../OracleWrapper';
import {web3} from '../web3';
import {bracketAddressChanged, updateTotalSubmissions} from './common';

const marchMadness = new MarchMadnessWrapper();
const oracle = new OracleWrapper();

export function initialize() {
  waitForCondition(checkConnections)
    .then(initializeContract)
    .then(initializeTournament)
    .then(initializeBracket)
    .then(initializeOracle)
    .catch((error) => {
      applicationStore.alertError(error);
      console.error(error);
    });
}

function checkConnections(): Promise<boolean> {
  let error = null;

  return Promise.resolve()
    .then(() => {
      let ethereumError = null;
      if (!web3.isConnected()) {
        ethereumError = "See below for instructions on connecting to the Ethereum network";
      }
      else if (web3.version.network !== marchMadness.networkID) {
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
            error = error || "See below for instructions on running an IPFS node";
          }
        });
    })
    .then(() => {
      applicationStore.alert('warning', error);
      return !error;
    });
}

function initializeBracket(): Promise<void> {
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

function initializeTournament(): Promise<void> {
  return ipfs.getPath(contractStore.tournamentDataIPFSHash)
    .then((content) => JSON.parse(content))
    .then(action(({name, teams, regions}) => {
      tournamentStore.name = name;
      tournamentStore.setTeams(teams);
      tournamentStore.setRegions(regions);

      if (contractStore.resultsSubmitted) {
        bracketStore.results.loadByteBracket(contractStore.results.slice(2));
      }
    }));
}

function startCountdown(timeField, countdownField): Promise<void> {
  return waitForCondition(() => {
    const now = dateToTimestamp(new Date());
    if (now > contractStore[timeField]) {
      contractStore[countdownField] = 0;
      return Promise.resolve(true);
    }
    else {
      contractStore[countdownField] = contractStore[timeField] - now;
      return Promise.resolve(false);
    }
  });
}

function initializeContract(): Promise<void> {
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

      watchTotalSubmissions();
      watchWinningScore();
    })
    .then(updateTotalSubmissions);
}

function initializeOracle(): Promise<void> {
  return oracle.voterStatus(contractStore.account)
    .then(action(([isVoter, hasVoted]) => {
      contractStore.oracleIsVoter = isVoter;
      contractStore.oracleHasVoted = hasVoted;
    }));
}

function watchTotalSubmissions() {
  marchMadness.marchMadness.SubmissionAccepted((err, log) => {
    if (err) {
      console.error(err);
    }
    else {
      updateTotalSubmissions();
    }
  });
}

function watchWinningScore() {
  marchMadness.marchMadness.NewWinner({}, {fromBlock: 0, toBlock: 'latest'}, (err, log) => {
    if (err) {
      console.error(err);
    }
    else {
      marchMadness.fetchContractState('winningScore')
        .then((winningScore) => contractStore.winningScore = winningScore);
    }
  });
}
