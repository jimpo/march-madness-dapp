import {action, observable, computed} from 'mobx';
import React from 'react';
import Web3 from 'web3';

import * as ipfs from '../ipfs';


export default class ApplicationStore {
  @observable error;
  @observable ethereumNodeConnected;
  @observable ipfsNodeConnected;

  constructor() {
    this.web3 = this._createWeb3();
  }

  checkEthereumConnection() {
    this.ethereumNodeConnected = this.web3.isConnected();
    return Promise.resolve();
  }

  checkIpfsConnection() {
    return ipfs.isGatewayAvailable()
      .then((isAvailable) => this.ipfsNodeConnected = isAvailable);
  }

  @computed get errorMessage() {
    if (this.ethereumNodeConnected === false) {
      return (
        <span>I could not find an Ethereum connection. Try installing the <a href="https://metamask.io/">Metamask</a> Chrome extension.</span>
      );
    }
    else if (this.ipfsNodeConnected === false) {
      return (
        <span>You must be running an <a href="https://ipfs.io/">IPFS</a> node.</span>
      );
    }
    else if (this.error) {
      return error.message;
    }
  }

  _createWeb3() {
    if (typeof web3 !== 'undefined') {
      return new Web3(web3.currentProvider);
    }
    else {
      return new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    }
  }
}
