import classNames from 'classnames';
import {observer} from 'mobx-react';
import React from 'react';
import _ from 'underscore';

import {regionalGamesInRound} from '../../util';
import _css from './style.less';
import Lines from './Lines';


const Team = observer(function Team({team, gameNumber, bracket, results, editable}) {
  let clickHandler = null;
  if (editable) {
    clickHandler = () => {
      if (team) {
        bracket.selectWinner(gameNumber, team.number);
      }
    };
  }

  const actualWinner = results && results.winners[gameNumber];
  const selected = team && bracket.winners[gameNumber] === team.number;
  const classes = classNames({
    team: true,
    selectable: editable,
    selected: selected,
    correct: selected && actualWinner === team.number,
    incorrect: selected && actualWinner != null && actualWinner !== team.number
  });
  return (
    <div className={classes} onClick={clickHandler}>
      <div className="seed">{team && team.seed}</div>
      <div className="game-info">
        <span className="team-name">{team && team.name}</span>
      </div>
    </div>
  );
});

const Game = observer(function Game({number, bracket, results, editable}) {
  const team1 = bracket.team1InGame(number);
  const team2 = bracket.team2InGame(number);
  return (
    <div className={classNames('game', `game-${number}`)}>
      <Team team={team1} gameNumber={number} bracket={bracket} results={results} editable={editable}/>
      <Team team={team2} gameNumber={number} bracket={bracket} results={results} editable={editable}/>
    </div>
  );
});

function Round({number, regionNumber, bracket, results, editable}) {
  const gameNumbers = regionalGamesInRound(regionNumber, number);
  const gameComponents = gameNumbers.map((gameNumber) => {
    return (
      <Game
        key={gameNumber}
        number={gameNumber}
        bracket={bracket}
        results={results}
        editable={editable}
      />
    );
  });
  return (
    <div className={classNames('round', `round-${number}`)}>
      {gameComponents}
    </div>
  );
}

function Region({details, bracket, results, editable}) {
  const rounds = _.range(4).map((roundNumber) => {
    return (
      <Round
        key={roundNumber}
        number={roundNumber}
        regionNumber={details.number}
        bracket={bracket}
        results={results}
        editable={editable}
      />
    );
  });

  let linesFlipped = false;
  if (details.number > 1) {
    rounds.reverse();
    linesFlipped = true;
  }

  return (
    <div className={classNames('region', `region-${details.number}`)}>
      <Lines flipped={linesFlipped}/>
      <h3 className="region-name">{details.name}</h3>
      {rounds}
    </div>
  );
}

export default function Bracket({bracket, results, children, editable}) {
  const tournament = bracket.tournament;
  return (
    <div className="bracket">
      {children}
      <div className="clearfix">
        <Region bracket={bracket} results={results} editable={editable} details={tournament.regions[0]}/>
        <Region bracket={bracket} results={results} editable={editable} details={tournament.regions[2]}/>
      </div>
      <div className="final-rounds">
        <Game number={60} bracket={bracket} results={results} editable={editable}/>
        <Game number={61} bracket={bracket} results={results} editable={editable}/>
        <Game number={62} bracket={bracket} results={results} editable={editable}/>
      </div>
      <div className="clearfix">
        <Region bracket={bracket} results={results} editable={editable} details={tournament.regions[1]}/>
        <Region bracket={bracket} results={results} editable={editable} details={tournament.regions[3]}/>
      </div>
    </div>
  );
}
