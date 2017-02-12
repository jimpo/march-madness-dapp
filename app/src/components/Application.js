import {observer} from 'mobx-react';
import React from 'react';

import Bracket from './bracket';


const ConnectionDisplay = observer(function ConnectionDisplay({application, tournament}) {
  const checks = [
    {
      key: "ethereum-connection",
      text: "Checking connection to Ethereum network",
      ok: application.ethereumNodeConnected
    },
    {
      key: "ipfs-connection",
      text: "Checking connection to IPFS gateway",
      ok: application.ipfsNodeConnected
    },
    {
      key: "tournament-data",
      text: "Retrieving tournament information",
      ok: false
    }
  ];

  const displayChecks = (checks) => {
    const components = [];
    for (let check of checks) {
      let glyphicon;
      switch (check.ok) {
      case true:
        glyphicon = <span className="glyphicon glyphicon-ok"/>;
        break;
      case false:
        glyphicon = <span className="glyphicon glyphicon-remove"/>;
        break;
      }

      components.push(<div key={check.key}>{check.text}...{' '}{glyphicon}</div>);

      if (!check.ok) {
        break;
      }
    }
    return components;
  };

  return (
    <div className="alert alert-info">
      {displayChecks(checks)}
    </div>
  );
});

const ErrorDisplay = observer(function ErrorDisplay({application}) {
  if (application.errorMessage) {
    return <div className="alert alert-warning">{application.errorMessage}</div>;
  }
  else {
    return null;
  }
});

const Application = observer(function Application({application, bracket}) {
  const tournament = bracket.tournament;

  let mainComponent;
  if (!tournament.ready) {
    mainComponent = <ConnectionDisplay application={application} tournament={tournament}/>;
  }
  else {
    mainComponent = <Bracket bracket={bracket}/>;
  }

  return (
    <div className="container">
      <header className="page-header">
        <h1>Ethereum Bracket Challenge</h1>
      </header>
      <section>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc diam elit, laoreet vel consequat at, sodales ac augue. Nunc accumsan risus et tellus rutrum auctor. Integer sagittis metus elit, quis pharetra arcu consequat volutpat. Pellentesque porttitor ipsum augue, vel molestie urna iaculis at. Pellentesque non faucibus nisi, et consequat purus. Proin tincidunt cursus laoreet. Nam scelerisque consectetur tempus. Nunc luctus mi metus, eget congue nunc iaculis commodo. Morbi commodo, elit sed luctus egestas, mi tortor dignissim nunc, id malesuada mi erat in neque. Nulla fringilla, velit non euismod scelerisque, ipsum nulla semper odio, ut ullamcorper felis mauris in metus. Nunc sit amet nisl tempor, aliquam turpis sed, blandit purus. Etiam nec ex risus. Cras in eros vel orci dignissim scelerisque quis et augue.</p>
      </section>
      <hr/>
      <ErrorDisplay application={application}/>
      {mainComponent}
    </div>
  );
});

export default Application;
