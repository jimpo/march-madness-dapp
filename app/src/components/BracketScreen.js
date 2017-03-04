import {observer} from 'mobx-react';
import React from 'react';

import Bracket from './bracket';
import {doneCreatingBracket} from '../actions/startup';
import {breakDownTimeInterval} from '../util';


const BracketScreen = observer(function BracketScreen({bracket, contract}) {
  const timeToStart = breakDownTimeInterval(contract.timeToTournamentStart);
  const scoringPeriod = breakDownTimeInterval(contract.scoringDuration);

  let action = null;
  if (bracket.editable && bracket.complete) {
    action = (
      <div className="actions">
        <button
          className="btn btn-lg btn-primary bracket-action"
          type="button"
          onClick={doneCreatingBracket}>
          Submit
        </button>
      </div>
    );
  }

  return (
    <section>
      <div className="well">
        <div>
          <strong>Tournament Starts In:</strong>
          {' '}
          {timeToStart.days} days, {timeToStart.hours} hours, {timeToStart.minutes} minutes
        </div>
        <div>
          <strong>Length of Scoring Period:</strong>
          {' '}
          {scoringPeriod.days} days, {scoringPeriod.hours} hours, {scoringPeriod.minutes} minutes
        </div>
        <div>
          <strong>Entry Fee:</strong>
          {' '}
          100000 ETH
        </div>
        </div>
      <Bracket bracket={bracket}>{action}</Bracket>
    </section>
  );
});

export default BracketScreen;
