// @flow

import _bootstrap from 'bootstrap/less/bootstrap.less';
import _fa from 'font-awesome/less/font-awesome.less';

import React from 'react';
import ReactDOM from 'react-dom';
import {randomBytes} from 'crypto';

import Application from './components/Application';
import {applicationStore, bracketStore, contractStore, tournamentStore} from './stores';
import {initialize} from './actions/initialize';


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

  initialize();
});

window.randomFillBracket = function() {
  bracketStore.picks.loadByteBracket(randomBytes(8).toString('hex'));
};
window.randomFillResults = function() {
  bracketStore.results.loadByteBracket(randomBytes(8).toString('hex'));
};
