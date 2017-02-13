import Web3 from 'web3';

function createWeb3() {
  if (typeof web3 !== 'undefined') {
    return new Web3(web3.currentProvider);
  }
  else {
    return new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  }
}

export default createWeb3();
