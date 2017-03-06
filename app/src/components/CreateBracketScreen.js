import {observer} from 'mobx-react';
import React from 'react';

import Bracket from './Bracket';
import TournamentStatus from './TournamentStatus';
import {doneCreatingBracket} from '../actions/startup';


const CreateBracketScreen = observer(function CreateBracketScreen({bracket, contract}) {
  let action = null;
  if (bracket.picks.complete) {
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
      <TournamentStatus bracket={bracket} contract={contract}/>
      <Bracket bracket={bracket.picks} editable={true}>
        {action}
      </Bracket>
    </section>
  );
});

export default CreateBracketScreen;
