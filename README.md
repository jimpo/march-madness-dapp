# Ethereum Bracket Challenge

This an NCAA tournament bracket pool application running on the Ethereum platform. The bracket pool smart contract allows entrants to pay an entry fee and submit bracket picks, and the entrant with the highest scoring bracket when the tournament is over wins all of the entry fees.

## Rules of the contest

The contest has five phases:

- **Setup**. Before the contract is deployed, N human oracles are preselected to accurately report the results of the NCAA tournament to the contract after the tournament ends. When the contract is deployed, the entry fee, timeline, and oracles are specified by the creator.
- **Submission**. During the submission phase, entrants pay the entry fee to submit a cryptographic commitment to their bracket picks without publicly revealing their actual bracket picks. Each address may only make one submission. The users will be given a *submission key* by the UI encoding their bracket picks that they *must keep* in order to later reveal their bracket and be eligible to win.
- **Tournament**. Once the tournament starts, no further submissions are allowed. Games outcomes are not reported until the entire tournament is over to simplify the process for the oracles. When the tournament ends, the oracles each submit the outcome and if M of them agree, the next phase begins. If the oracles cannot reach consenus in the aftermath of the tournament, entry fees will be returned to the entrants.
- **Scoring**. During the scoring period, entrants may reveal their bracket picks and score their brackets. The highest scoring bracket revealed is recorded. After the scoring period ends, all entrants with a highest scoring bracket split the pot and may withdraw their winnings. There are no tiebreakers.
- **Contest over**. When the scoring period ends after a fixed amount of time, all entrants with a highest scoring bracket split the pot and may withdraw their winnings.

## Deployment

### Tournament Data

The smart contracts commit to the teams playing in the tournament so that all particants are clear on which teams they have picked. The first step is to create a JSON file of the tournament details and make it available over IPFS.

1. Create a JSON configuration file of the tournament details. Examples can be found in the `app/configs/` directory of this repository.
2. Run the [IPFS daemon](https://ipfs.io/docs/getting-started/) locally.
3. Run `ipfs add <FILE>`, with the filepath to the JSON file created in step 1.
4. That command should print to the terminal an IPFS hash. Keep track of this; you will need it when deploying the contracts.

### The Contracts

The project uses [Truffle](http://truffleframework.com/) for development and deployment of the smart contracts.

1. Install Truffle by running `npm install -g truffle`.
2. Edit `migrations/2_deploy_contracts.js` specifying the desired contract parameters. The `tournamentDataIPFSHash` is the output from step 4 above.
3. Run a local Ethereum node exposing RPC with an unlocked account.
4. Run `truffle migrate --network live`.
5. Use the truffle console to add the oracles to the deployed FederatedOracleBytes8 contract.

### Choosing Oracles

After deploying the contracts, you will need to register the N preselected oracles.

1. Obtain from each oracle to provide you their Ethereum account address.
2. Obtain from each oracle a PGP-signed statement of the form "I, [name], am willing to be an Oracle in the Ethereum Bracket Challenge. My account address is [their address] and the address of the oracle contract is [address of FederatedOracleBytes8 contract]." They can generate the signed statement using `gpg --clear-sign`.
3. Run `ipfs add <FILE>` with the filepath of each PGP-signed statement.
4. For each oracle, execute the `addVoter` method on the `FederatedOracleBytes8` contract, providing the Ethereum account address and IPFS hash of the signed statement as arguments.

### The Client

1. Change to the `app` directory: `cd app`.
2. Build the static files for the client and upload to IPFS by running `./deploy.sh`.

## Issues

To report bugs or request enhancements, please use GitHub issues.

## License

Copyright 2017 Jim Posen

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
