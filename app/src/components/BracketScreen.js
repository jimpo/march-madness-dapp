import {observer} from 'mobx-react';
import React from 'react';

import Bracket from './Bracket';
import TournamentStatus from './TournamentStatus';


const BracketScreen = observer(function BracketScreen({bracket, contract}) {
  return (
    <section>
      <TournamentStatus contract={contract}/>
      <Bracket bracket={bracket.picks} results={bracket.results}/>
    </section>
  );
});

export default BracketScreen;
