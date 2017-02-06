import _css from 'bootstrap/less/bootstrap.less';

import React from 'react';
import ReactDOM from 'react-dom';

import BracketView from './components/bracket';
import Bracket from './stores/bracket';
import Tournament from './stores/tournament';
import tournamentConfig from './tournamentConfig';


function Application({bracket}) {
  return (
    <div className="container">
      <h1>Ethereum Bracket Challenge</h1>
      <BracketView bracket={bracket}/>
    </div>
  );
};

window.addEventListener('load', () => {
  const tournament = new Tournament(tournamentConfig);
  const bracket = new Bracket(tournament);

  ReactDOM.render(
    <Application bracket={bracket}/>,
    document.getElementById('main')
  );
});
