import _ from 'underscore';


export function regionalGamesInRound(regionNumber, roundNumber) {
  const numGames = totalGamesInRound(roundNumber) / 4;
  const firstGame = firstGameInRound(roundNumber) + numGames * regionNumber;
  return _.range(firstGame, firstGame + numGames);
}

export function totalGamesInRound(roundNumber) {
  return Math.pow(2, 5 - roundNumber);
}

export function firstGameInRound(roundNumber) {
  let gameNumber = 0;
  for (let i = 0; i < roundNumber; i++) {
    gameNumber += totalGamesInRound(i);
  }
  return gameNumber;
}

export function roundOfGame(gameNumber) {
  for (let round = 0; round < 6; round++) {
    gameNumber -= totalGamesInRound(round);
    if (gameNumber < 0) {
      return round;
    }
  }
}

export function previousGames(gameNumber) {
  const round = roundOfGame(gameNumber);
  if (round === 0) {
    throw new Error("First round games have no previous games");
  }
  const firstGame = firstGameInRound(round - 1) + 2 * (gameNumber - firstGameInRound(round));
  return [firstGame, firstGame + 1];
}

export function nextGame(gameNumber) {
  const round = roundOfGame(gameNumber);
  if (round === 5) {
    throw new Error("Last round game has no next game");
  }
  return firstGameInRound(round + 1) + Math.floor((gameNumber - firstGameInRound(round)) / 2);
}

export function bufferToBitstring(buffer) {
  let bitstring = '';
  buffer.forEach((byte) => {
    const byteString = byte.toString(2);
    for (let i = byteString.length; i < 8; i++) {
      bitstring += '0';
    }
    bitstring += byteString;
  });
  return bitstring;
}

export function bitstringToBuffer(bitstring) {
  const bytes = [];
  for (let i = 0; i < bitstring.length; i += 8) {
    bytes.push(parseInt(bitstring.substr(i, 8), 2));
  }
  return Buffer.from(bytes);
}
