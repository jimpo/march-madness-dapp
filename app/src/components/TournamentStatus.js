import {observer} from 'mobx-react';
import React from 'react';

import {breakDownTimeInterval} from '../util';

@observer
class TournamentStatus extends React.Component {
  renderTournamentStartCountdown() {
    const {contract} = this.props;
    const timeToStart = breakDownTimeInterval(contract.timeToTournamentStart);
    return (
      <div>
        <strong>Tournament Starts In:</strong>
        {' '}
        {timeToStart.days} days, {timeToStart.hours} hours, {timeToStart.minutes} minutes
      </div>
    );
  }

  renderContestCountdown() {
    const {contract} = this.props;
    const timeToEnd = breakDownTimeInterval(contract.timeToContestOver);
    return (
      <div>
        <strong>Scoring Period Ends In:</strong>
        {' '}
        {timeToEnd.days} days, {timeToEnd.hours} hours, {timeToEnd.minutes} minutes
      </div>
    );
  }

  renderScoringDuration() {
    const {contract} = this.props;
    const scoringPeriod = breakDownTimeInterval(contract.scoringDuration);
    return (
      <div>
        <strong>Length of Scoring Period:</strong>
        {' '}
        {scoringPeriod.days} days, {scoringPeriod.hours} hours, {scoringPeriod.minutes} minutes
      </div>
    );
  }

  renderEntryFee() {
    const {contract} = this.props;
    const entryFeeETH = `${contract.entryFee.shift(-18)} ETH`;
    return (
      <div>
        <strong>Entry Fee:</strong>
        {' '}
        {entryFeeETH}
      </div>
    );
  }

  renderBracketScores() {
    const {bracket, contract} = this.props;
    return (
      <div>
        <div>
          <strong>My Score:</strong>{' '}{bracket.score.toString()}
        </div>
        <div>
          <strong>Current High Score:</strong>{' '}{contract.winningScore.toString()}
        </div>
      </div>
    );
  }

  // TODO: Show size of pool, # of entrants
  render() {
    const {bracket, contract} = this.props;
    if (contract.contestOver) {
      return (
        <div className="well">
          <div>
            <strong>Status:</strong>
            {' '}
            Contest Over
          </div>
          {this.renderBracketScores()}
        </div>
      );
    }
    else if (contract.resultsSubmitted) {
      return (
        <div className="well">
          <div>
            <strong>Status:</strong>
            {' '}
            Scoring period
          </div>
          {this.renderContestCountdown()}
          {this.renderBracketScores()}
        </div>
      );
    }
    else if (contract.tournamentStarted) {
      return (
        <div className="well">
          <div>
            <strong>Status:</strong>
            {' '}
            Tournament is in progress
          </div>
          {this.renderScoringDuration()}
        </div>
      );
    }
    else {
      return (
        <div className="well">
          {this.renderTournamentStartCountdown()}
          {this.renderScoringDuration()}
          {this.renderEntryFee()}
        </div>
      );
    }
  }
}

export default TournamentStatus;
