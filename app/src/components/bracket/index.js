import classNames from 'classnames';
import {observer} from 'mobx-react';
import React from 'react';
import _ from 'underscore';

import * as util from '../../util';
import _css from './style.less';
import Lines from './Lines';


function Team({team, gameNumber, bracket}) {
  let clickHandler = null;
  if (bracket.editable) {
    clickHandler = () => {
      if (team) {
        bracket.makePick(gameNumber, team.number);
      }
    };
  }
  return (
    <div className={classNames('team', { 'team-selectable': bracket.editable })} onClick={clickHandler}>
      <div className="seed">{team && team.seed}</div>
      <div className="game-info">
        <span className="team-name">{team && team.name}</span>
      </div>
    </div>
  );
}

const Game = observer(function Game({number, bracket}) {
  return (
    <div className={classNames('game', `game-${number}`)}>
      <Team team={bracket.team1InGame(number)} gameNumber={number} bracket={bracket}/>
      <Team team={bracket.team2InGame(number)} gameNumber={number} bracket={bracket}/>
    </div>
  );
});

function Round({number, regionNumber, bracket}) {
  const gameNumbers = util.regionalGamesInRound(regionNumber, number);
  const gameComponents = gameNumbers.map(
    (gameNumber) => <Game key={gameNumber} number={gameNumber} bracket={bracket}/>
  );
  return (
    <div className={classNames('round', `round-${number}`)}>
      {gameComponents}
    </div>
  );
}

function Region({details, bracket}) {
  const rounds = _.range(4).map((roundNumber) => {
    return (
      <Round
        key={roundNumber}
        number={roundNumber}
        regionNumber={details.number}
        bracket={bracket}
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

export default function Bracket({bracket, children}) {
  const tournament = bracket.tournament;
  return (
    <div className="bracket">
      {children}
      <div className="clearfix">
        <Region bracket={bracket} details={tournament.regionDetails(0)}/>
        <Region bracket={bracket} details={tournament.regionDetails(2)}/>
      </div>
      <div className="final-rounds">
        <Game number={60} bracket={bracket}/>
        <Game number={61} bracket={bracket}/>
        <Game number={62} bracket={bracket}/>
      </div>
      <div className="clearfix">
        <Region bracket={bracket} details={tournament.regionDetails(1)}/>
        <Region bracket={bracket} details={tournament.regionDetails(3)}/>
      </div>
    </div>
  );
}
