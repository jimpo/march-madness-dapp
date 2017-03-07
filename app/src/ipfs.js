const GATEWAY_URL = "http://gateway.ipfs.io";

// This is the IPFS readme that comes with go-ipfs when this code written.
const README_PATH = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/readme";

export function isGatewayAvailable() {
  // Append timestamp to IPFS path to bust browser cache
  const timestamp = (new Date()).getTime();
  return fetch(GATEWAY_URL + `/ipfs/${README_PATH}?timestamp=${timestamp}`)
    .then((response) => response.ok || false)
    .catch(() => false);
}

export function getPath(path) {
  return fetch(GATEWAY_URL + `/ipfs/${path}`)
    .then((response) => response.text());
}
