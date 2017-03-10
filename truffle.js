module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*"
    },
    live: {
      host: "localhost",
      port: 8545,
      network_id: 1,
      gas: 4000000
    }
  }
};
