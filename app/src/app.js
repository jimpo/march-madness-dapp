import _css from 'bootstrap/less/bootstrap.less';

import React from 'react';
import ReactDOM from 'react-dom';
import Web3 from 'web3';

import BracketView from './components/bracket';
import Bracket from './stores/bracket';
import Tournament from './stores/tournament';
import tournamentConfig from './tournamentConfig';


function createWeb3() {
  if (typeof web3 !== 'undefined') {
    return new Web3(web3.currentProvider);
  }
  else {
    return new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  }
}

function Application({bracket}) {
  return (
    <div className="container">
      <h1>Ethereum Bracket Challenge</h1>
      <BracketView bracket={bracket}/>
    </div>
  );
};

window.addEventListener('load', () => {
  window.web3 = createWeb3();
  console.log(web3.isConnected());

  const tournament = new Tournament(tournamentConfig);
  const bracket = new Bracket(tournament);

  ReactDOM.render(
    <Application bracket={bracket}/>,
    document.getElementById('main')
  );
});
