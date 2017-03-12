// @flow

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

  renderTotalSubmissions() {
    const {contract} = this.props;
    return (
      <div>
        <strong>Total Submissions:</strong>{' '}{contract.totalSubmissions}
      </div>
    );
  }

  render() {
    const {bracket, contract} = this.props;
    if (contract.contestOver) {
      let description;
      if (contract.scores.get(bracket.address) &&
          contract.scores.get(bracket.address).equals(contract.winningScore)) {
        description = "Congratulations, you won!";
      }
      else {
        description = "The contest is now over. Better luck next time.";
      }

      return (
        <div className="well">
          <p>{description}</p>
          {this.renderBracketScores()}
          {this.renderTotalSubmissions()}
        </div>
      );
    }
    else if (contract.resultsSubmitted) {
      return (
        <div className="well">
          <p>The scoring period has begun. During the scoring period, you may publicly reveal and score your bracket for a chance to win.</p>
          {this.renderContestCountdown()}
          {this.renderBracketScores()}
          {this.renderTotalSubmissions()}
        </div>
      );
    }
    else if (contract.tournamentStarted) {
      return (
        <div className="well">
          <p>The tournament is in progress. When the tournament is over, the results will be submitted and the scoring phase will begin.</p>
          {this.renderScoringDuration()}
          {this.renderTotalSubmissions()}
        </div>
      );
    }
    else {
      return (
        <div className="well">
          {this.renderTournamentStartCountdown()}
          {this.renderScoringDuration()}
          {this.renderEntryFee()}
          {this.renderTotalSubmissions()}
        </div>
      );
    }
  }
}

export default TournamentStatus;
