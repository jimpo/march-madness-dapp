const GATEWAY_URL = "http://localhost:8080";

// This is the IPFS readme that comes with go-ipfs when this code written.
const README_PATH = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/readme";

export function isGatewayAvailable() {
  return fetch(GATEWAY_URL + `/ipfs/${README_PATH}`)
    .then((response) => response.ok || false)
    .catch(() => false);
}

export function getPath(path) {
  return fetch(GATEWAY_URL + `/ipfs/${path}`)
    .then((response) => response.text());
}
