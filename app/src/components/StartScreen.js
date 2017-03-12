import {observer} from 'mobx-react';
import React from 'react';

import {createBracket, enterResults, loadBracket} from '../actions/startup';


const Requirements  = observer(function Requirements({application}) {
  const requirements = [
    {
      key: "ethereum",
      text: <span>An <a href="https://www.ethereum.org" target="_blank">Ethereum</a> network connection.</span>,
      help: <span>We recommend the <a href="https://metamask.io" target="_blank">Metmask</a> Chrome extension or <a href="https://github.com/ethereum/mist/releases" target="_blank">Mist</a> Ethereum wallet.</span>,
      ok: application.ethereumNodeConnected
    },
    {
      key: "ipfs",
      text: <span>An <a href="https://ipfs.io" target="_blank">IPFS</a> gateway.</span>,
      help: <span>See the <a href="https://ipfs.io/docs/getting-started/" target="_blank">IPFS guide</a> to get started.</span>,
      ok: application.ipfsNodeConnected
    }
  ];

  const components = requirements.map(({key, text, help, ok}) => {
    let icon;
    switch (ok) {
    case true:
      icon = <i className="fa-li fa fa-check"/>;
      break;
    case false:
      icon = <i className="fa-li fa fa-times"/>;
      break;
    default:
      icon = <i className="fa-li fa fa-spinner fa-spin"/>;
      break;
    }

    if (ok) {
      help = null;
    }

    return <li key={key}>{icon}{text}{' '}{help}</li>;
  });

  return (
    <div>
      <p><strong>Requirements</strong></p>
      <ul className="fa-ul">{components}</ul>
    </div>
  );
});

@observer class StartScreen extends React.Component {
  renderDescription() {
    return <p>Welcome to the Ethereum bracket challenge! This is an open bracket pool for the NCAA basketball tournament running on the <a href="https://www.ethereum.org/" target="_blank">Ethereum</a> platform.</p>;
  }

  renderRules() {
    return (
      <div>
        <p><strong>Rules</strong></p>
        <p>Before the tournament starts, you may create a bracket and submit it to the pool by paying the entry fee in Ether. Instead of submitting the actual bracket at this time, you will only submit a commitment that locks in your picks while preventing others from seeing them. After the tournament starts, no further submissions will be accepted.</p>
          <p>When the tournament ends, the creator of the pool submits the results and the scoring period begins. During the scoring period, everyone who submitted a bracket has the option to reveal their bracket. The highest scoring bracket revealed during the scoring period is the winner. In the event of a tie, all brackets with the winning score split the winnings equally. After the scoring period ends, all winners may claim their winnings.</p>
      </div>
    );
  }

  renderScoring() {
    return (
      <div>
        <p><strong>Scoring</strong></p>
        <p>Brackets are scored according to the number of games where the winner is correctly predicted. Correct predictions score a different number of points depending on the round. Round 1 games score 1 point, round 2 games score 2 points, round 3 games score 4 points, round 4 games score 8 points, round 5 games score 16 points, and the final game scores 32 points. The are no tie-breakers.</p>
      </div>
    );
  }

  renderCreateBracketButton() {
    const {bracket, tournament, contract} = this.props;
    if (tournament.ready &&
        !contract.tournamentStarted &&
        contract.commitments.get(bracket.address) === contract.NO_COMMITMENT) {
      return (
        <button
          type="button"
          className="btn btn-lg btn-primary btn-block"
          onClick={createBracket}>
          Create a bracket
        </button>
      );
    }
  }

  renderLoadBracketButton() {
    const {tournament} = this.props;
    if (tournament.ready) {
      return (
        <button
          type="button"
          className="btn btn-lg btn-default btn-block"
          onClick={loadBracket}>
          Load my bracket
        </button>
      );
    }
  }

  renderEnterResultsButton() {
    const {bracket, contract} = this.props;
    if (contract.oracleIsVoter &&
        !contract.oracleHasVoted &&
        contract.tournamentStarted &&
        !bracket.results.complete) {
      return (
        <button
          type="button"
          className="btn btn-lg btn-default btn-block"
          onClick={enterResults}>
          Enter tournament results
        </button>
      );
    }
  }

  render() {
    const {application, tournament, bracket} = this.props;
    return (
      <section>
        {this.renderDescription()}
        {this.renderRules()}
        {this.renderScoring()}
        <Requirements application={application}/>
        <hr/>
        {this.renderCreateBracketButton()}
        {this.renderLoadBracketButton()}
        {this.renderEnterResultsButton()}
      </section>
   );
  }
}

export default StartScreen;
