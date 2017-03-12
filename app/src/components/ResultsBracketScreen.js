// @flow

import {observer} from 'mobx-react';
import React from 'react';

import Bracket from './Bracket';
import {submitResults} from '../actions';


const ResultsBracketScreen = observer(function ResultsBracketScreen({bracket}) {
  let action = null;
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
  }

  return (
    <section>
      <Bracket bracket={bracket.results} editable={true}>
        {action}
      </Bracket>
    </section>
  );
});

export default ResultsBracketScreen;
