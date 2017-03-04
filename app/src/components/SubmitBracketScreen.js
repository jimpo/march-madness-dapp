import {observer} from 'mobx-react';
import React from 'react';

import {submitBracket} from '../actions/startup';


const SubmitBracketScreen = observer(function SubmitBracketScreen({bracket}) {
  return (
    <div>
      <p>This is your submission key. You will need this key to reload and submit your bracket, so copy it somewhere safe. After recording the submission key, you may submit your bracket.</p>
      <p><code>{bracket.submissionKey}</code></p>
      <button
        type="button"
        className="btn btn-lg btn-primary btn-block"
        onClick={submitBracket}>
        Submit my bracket
      </button>
    </div>
  );
});

export default SubmitBracketScreen;
