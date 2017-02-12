import _css from 'bootstrap/less/bootstrap.less';

import React from 'react';
import ReactDOM from 'react-dom';
import {action} from 'mobx';

import Application from './components/Application';
import Bracket from './stores/bracket';
import ApplicationStore from './stores/application-store';
import ContractStore from './stores/contract-store';
import Tournament from './stores/tournament';


window.addEventListener('load', () => {
  const applicationStore = new ApplicationStore();
  const contractStore = new ContractStore(applicationStore.web3);
  const tournament = new Tournament();
  const bracket = new Bracket(tournament);

  ReactDOM.render(
    <Application
      application={applicationStore}
      contract={contractStore}
      bracket={bracket}
    />,
    document.getElementById('main')
  );

  applicationStore.checkEthereumConnection()
    .then(() => {
      if (applicationStore.ethereumNodeConnected) {
        return applicationStore.checkIpfsConnection();
      }
    })
    .then(() => {
      if (applicationStore.ipfsNodeConnected) {
        return contractStore.getTournamentData();
      }
    })
    .then(action(({teams, regions}) => {
      tournament.teams = teams;
      tournament.regions = regions;
    }));
});
