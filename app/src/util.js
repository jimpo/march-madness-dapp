// @flow

import _ from 'underscore';


export function regionalGamesInRound(regionNumber: number, roundNumber: number): number[] {
  const numGames = totalGamesInRound(roundNumber) / 4;
  const firstGame = firstGameInRound(roundNumber) + numGames * regionNumber;
  return _.range(firstGame, firstGame + numGames);
}

export function totalGamesInRound(roundNumber: number): number {
  return Math.pow(2, 5 - roundNumber);
}

export function firstGameInRound(roundNumber: number): number {
  let gameNumber = 0;
  for (let i = 0; i < roundNumber; i++) {
    gameNumber += totalGamesInRound(i);
  }
  return gameNumber;
}

export function roundOfGame(gameNumber: number): number {
  for (let round = 0; round < 6; round++) {
    gameNumber -= totalGamesInRound(round);
    if (gameNumber < 0) {
      return round;
    }
  }
  throw Error("Game number is out of bounds");
}

export function previousGames(gameNumber: number): [number, number] {
  const round = roundOfGame(gameNumber);
  if (round === 0) {
    throw new Error("First round games have no previous games");
  }
  const firstGame = firstGameInRound(round - 1) + 2 * (gameNumber - firstGameInRound(round));
  return [firstGame, firstGame + 1];
}

export function nextGame(gameNumber: number): number {
  const round = roundOfGame(gameNumber);
  if (round === 5) {
    throw new Error("Last round game has no next game");
  }
  return firstGameInRound(round + 1) + Math.floor((gameNumber - firstGameInRound(round)) / 2);
}

export function dateToTimestamp(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

export function bufferToBitstring(buffer: Buffer): string {
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

export function bitstringToBuffer(bitstring: string): Buffer {
  const bytes = [];
  for (let i = 0; i < bitstring.length; i += 8) {
    bytes.push(parseInt(bitstring.substr(i, 8), 2));
  }
  return Buffer.from(bytes);
}

export function breakDownTimeInterval(seconds: number)
  : {days: number, hours: number, minutes: number, seconds: number}
{
  const secondsInMinute = 60;
  const secondsInHour = 60 * secondsInMinute;
  const secondsInDay = 24 * secondsInHour;

  const days = Math.floor(seconds / secondsInDay);
  seconds = seconds % secondsInDay;
  const hours = Math.floor(seconds / secondsInHour);
  seconds = seconds % secondsInHour;
  const minutes = Math.floor(seconds / secondsInMinute);
  seconds = seconds % secondsInMinute;

  return {days, hours, minutes, seconds};
}
