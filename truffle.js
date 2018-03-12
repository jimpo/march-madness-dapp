module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*",
      gas: 4700000
    },
    live: {
      host: "localhost",
      port: 8545,
      network_id: 1,
      gas: 4700000
    }
  }
};
