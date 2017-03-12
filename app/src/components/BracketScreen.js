// @flow

import {observer} from 'mobx-react';
import React from 'react';

import Bracket from './Bracket';
import TournamentStatus from './TournamentStatus';
import {revealBracket, collectWinnings} from '../actions';


const BracketScreen = observer(function BracketScreen({bracket, contract}) {
  let action = null;

  if (contract.contestOver &&
      contract.scores.get(bracket.address) &&
      contract.scores.get(bracket.address).equals(contract.winningScore) &&
      !contract.collectedWinnings.get(bracket.address)) {
    action = (
      <div className="actions">
        <button
          className="btn btn-lg btn-primary bracket-action"
          type="button"
          onClick={collectWinnings}>
          Collect winnngs
        </button>
      </div>
    );
  }

  if (!contract.contestOver &&
      !contract.scores.get(bracket.address) &&
      contract.resultsSubmitted) {
    action = (
      <div className="actions">
        <button
          className="btn btn-lg btn-primary bracket-action"
          type="button"
          onClick={revealBracket}>
          Reveal
        </button>
      </div>
    );
  }

  return (
    <section>
      <TournamentStatus bracket={bracket} contract={contract}/>
      <Bracket bracket={bracket.picks} results={bracket.results}>
        {action}
      </Bracket>
    </section>
  );
});

export default BracketScreen;
