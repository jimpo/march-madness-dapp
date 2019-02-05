module.exports = {
  networks: {
    development: {
     host: "127.0.0.1",
     port: 8545,
     network_id: "*"
    }
  },

  mocha: {
    timeout: 10000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.5.3",
      evmVersion: "byzantium"
    }
  }
};
