import _bootstrap from 'bootstrap/less/bootstrap.less';
import _fa from 'font-awesome/less/font-awesome.less';

import React from 'react';
import ReactDOM from 'react-dom';

import Application from './components/Application';
import bracketStore from './stores/bracket';
import applicationStore from './stores/application-store';
import contractStore from './stores/contract-store';
import tournamentStore from './stores/tournament';

import {initializeTournament} from './actions/startup';


window.addEventListener('load', () => {
  ReactDOM.render(
    <Application
      application={applicationStore}
      contract={contractStore}
      bracket={bracketStore}
      tournament={tournamentStore}
    />,
    document.getElementById('main')
  );

  initializeTournament();
});
