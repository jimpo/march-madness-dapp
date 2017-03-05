import {observer} from 'mobx-react';
import React from 'react';

import {breakDownTimeInterval} from '../util';


const TournamentStatus = observer(function BracketScreen({contract}) {
  const timeToStart = breakDownTimeInterval(contract.timeToTournamentStart);
  const scoringPeriod = breakDownTimeInterval(contract.scoringDuration);
  const entryFeeETH = `${contract.entryFee.shift(-18)} ETH`;

  return (
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
        {entryFeeETH}
      </div>
    </div>
  );
});

export default TournamentStatus;
