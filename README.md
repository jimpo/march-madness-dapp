# Ethereum Bracket Challenge

This an NCAA tournament bracket pool application running on the Ethereum platform. The bracket pool smart contract allows entrants to pay an entry fee and submit bracket picks, and the entrant with the highest scoring bracket when the tournament is over wins all of the entry fees.

## Rules of the contest

The contest has five phases:

- **Setup**. Before the contract is deployed, N human oracles are preselected to accurately report the results of the NCAA tournament to the contract after the tournament ends. When the contract is deployed, the entry fee, timeline, and oracles are specified by the creator.
- **Submission**. During the submission phase, entrants pay the entry fee to submit a cryptographic commitment to their bracket picks without publicly revealing their actual bracket picks. Each address may only make one submission. The users will be given a *submission key* by the UI encoding their bracket picks that they *must keep* in order to later reveal their bracket and be eligible to win.
- **Tournament**. Once the tournament starts, no further submissions are allowed. Games outcomes are not reported until the entire tournament is over to simplify the process for the oracles. When the tournament ends, the oracles each submit the outcome and if M of them agree, the next phase begins. If the oracles cannot reach consenus in the aftermath of the tournament, entry fees will be returned to the entrants.
- **Scoring**. During the scoring period, entrants may reveal their bracket picks and score their brackets. The highest scoring bracket revealed is recorded. After the scoring period ends, all entrants with a highest scoring bracket split the pot and may withdraw their winnings. There are no tiebreakers.
- **Contest over**. When the scoring period ends after a fixed amount of time, all entrants with a highest scoring bracket split the pot and may withdraw their winnings.

## Development

This is the recommended setup for local development. If you prefer to use other tools, be my guest.

1. Install [NodeJS](https://nodejs.org/en/).
2. Install [Parity Ethereum](https://www.parity.io/ethereum/), an Ethereum node.
3. Run a development chain using Parity Ethereum. This is a local testnet. Be sure to unlock the preconfigured account that owns the initial supply of coins on this chain. Also, the node has to allow CORS requests from MetaMask.
  ```bash
$ echo "\n" > /tmp/blank_password
$ parity --chain dev \
    --unlock 0x00a329c0648769a73afac7f9381e08fb43dbea72 \
    --password /tmp/blank_password \
    --jsonrpc-cors "chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn"
  ```
4. Install [Google Chrome](https://www.google.com/chrome/) and [MetaMask](https://metamask.io/), a Chrome extension that serves as an Ethereum wallet and adapter to the Ethereum network. Set up a MetaMask account if you don't have one. The account does not need to be secure if you only use it for this testnet, but keep in mind that MetaMask may use the same account if you switch to mainnet at a later time.
5. Connect MetaMask to your local network running on localhost:8545.
6. Install [IPFS](https://docs.ipfs.io/introduction/install/).
7. Initialize your IPFS node and start the daemon. See [Basic Usage](https://docs.ipfs.io/introduction/usage/) instructions for more information on IPFS setup.
  ```bash
$ ipfs init
$ ipfs daemon
  ```
8. Change to this directory.
9. Add the tournament config data to IPFS. The tournament config is a JSON file specifying which teams are playing in a tournament, their region/seed, and other metadata. There are some sample config files from recent years in `app/configs`.
  ```bash
$ ipfs add app/configs/mens-2018.json
added QmTb8m7igYRawLAjMQCUXn67KNQu21sjarTfqHV7aCV3eY mens-2018.json
  ```
10. Configure your tournament in the migration file, `migrations/2_deploy_contracts.js`. Ensure that the `tournamentDataIPFSHash` argument in the `MarchMadness` constructor matches the output hash from step 6.
11. Install [Truffle](https://truffleframework.com/docs/truffle/overview), a command line development framework for Ethereum applications.
  ```bash
$ npm install -g truffle
  ```
12. Build and deploy the contracts using Truffle.
  ```bash
$ truffle migrate
  ```
13. Now send some testnet coins to your MetaMask account. First, copy the account address from the extension (eg. 0x87523cfC4Fabc45443a5173a1048a9879a642529). Now, open the truffle console and repeat the following commands, replacing the `to` address with your own. Afterward, verify that your MetaMask balance has increased.
  ```bash
$ truffle console
truffle(development)> web3.eth.getAccounts().then((accounts) => web3.eth.defaultAccount = accounts[0])
truffle(development)> web3.eth.sendTransaction({ to: "0x87523cfC4Fabc45443a5173a1048a9879a642529", value: web3.utils.toWei('1000', 'ether') })
  ```
13. Change to the `app` directory and install dependencies.
  ```bash
$ cd app
$ npm install
  ```
14. Start the development web server and visit [http://localhost:8000](http://localhost:8000/) in Chrome.
  ```bash
$ npm start
  ```

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
