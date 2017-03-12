// @flow

import {observer} from 'mobx-react';
import React from 'react';

import {submissionKeyEntered} from '../actions';


const LoadBracketScreen = observer(function LoadBracketScreen({bracket}) {
  return (
    <form>
      <div className="form-group">
        <input
          type="text"
          className="form-control"
          placeholder="Paste your submission key"
          onChange={(e) => submissionKeyEntered(e.target.value)}
        />
      </div>
    </form>
  );
});

export default LoadBracketScreen;
