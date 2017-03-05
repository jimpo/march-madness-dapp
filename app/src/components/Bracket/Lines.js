import classNames from 'classnames';
import React from 'react';
import _ from 'underscore';

const TEAM_HT = 22;
const TEAM_SPC = 2;
const GAME_HT = 2 * TEAM_HT + TEAM_SPC;
const GAME_SPC = 14;
const ROUND_WD = 31;
const ROUND1_SPC = 4;
const ROUND2_SPC = -14;

function LineSegments({x1, x2, y1, y2, flipped}) {
  if (flipped) {
    x1 = 100 - x1;
    x2 = 100 - x2;
  }

  return (
    <g style={{stroke: 'rgb(0,0,0)', strokeWidth: 1}}>
      <line x1={`${x1}%`} x2={`${x2}%`} y1={y1} y2={y1}/>
      <line x1={`${x1}%`} x2={`${x2}%`} y1={y2} y2={y2}/>
      <line x1={`${x2}%`} x2={`${x2}%`} y1={y1} y2={y2}/>
    </g>
  );
}

export default function Lines({flipped}) {
  const round0Lines = _.range(4).map((i) => {
    return (
      <LineSegments
        key={i}
        flipped={flipped}
        x1={ROUND_WD}
        x2={50}
        y1={(GAME_HT / 2) + 2 * i * (GAME_HT + GAME_SPC)}
        y2={(GAME_HT / 2) + (2 * i + 1) * (GAME_HT + GAME_SPC)}
     />
    );
  });

  const round1Lines = _.range(2).map((i) => {
    return (
      <LineSegments
        key={i}
        flipped={flipped}
        x1={2 * ROUND_WD + ROUND1_SPC}
        x2={75}
        y1={(GAME_HT + GAME_SPC / 2) + 2 * i * 2 * (GAME_HT + GAME_SPC)}
        y2={(GAME_HT + GAME_SPC / 2) + (2 * i + 1) * 2 * (GAME_HT + GAME_SPC)}
     />
    );
  });

  const round2Lines = (
    <LineSegments
      flipped={flipped}
      x1={3 * ROUND_WD + ROUND1_SPC + ROUND2_SPC}
      x2={90}
      y1={2 * GAME_HT + 3 * GAME_SPC / 2}
      y2={6 * GAME_HT + 11 * GAME_SPC / 2}
    />
  );

  return (
    <svg className="bracket-lines" width="100%" height={8 * GAME_HT + 7 * GAME_SPC}>
      {round0Lines}
      {round1Lines}
      {round2Lines}
    </svg>
  );
}
