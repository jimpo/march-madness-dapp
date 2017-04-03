// @flow

import {observer} from 'mobx-react';
import React from 'react';

import Bracket from './Bracket';
import {submitResults} from '../actions';


const ResultsBracketScreen = observer(function ResultsBracketScreen({bracket}) {
  let action = null;
  let encodedResults = null;

  if (bracket.results.complete) {
    action = (
      <div className="actions">
        <button
          className="btn btn-lg btn-primary bracket-action"
          type="button"
          onClick={submitResults}>
          Submit results
        </button>
      </div>
    );

    encodedResults = <p>The encoding of the results is: <strong>0x{bracket.results.toByteBracket()}</strong></p>;
  }

  return (
    <section>
      <div className="well">
        <p>When the tournament is over, copy official tournament results from the <a href="http://www.ncaa.com/interactive-bracket/basketball-men/d1" target="_blank">NCAA website</a>. The encoded bracket will be shown here when winners have been selected for all games. You should compare your encoding of the results against that obtained by the other oracles before submitting.</p>
        {encodedResults}
      </div>
      <Bracket bracket={bracket.results} editable={true}>
        {action}
      </Bracket>
    </section>
  );
});

export default ResultsBracketScreen;
