// @flow

import _ from 'underscore';


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

export function waitForCondition(predicate: () => Promise<boolean>): Promise<void> {
  return new Promise((resolve, reject) => {
    let intervalId;
    const check = () => {
      predicate()
        .then((result) => {
          if (result) {
            clearInterval(intervalId);
            resolve();
          }
        })
        .catch((err) => {
          clearInterval(intervalId);
          reject(err);
        });
    };
    intervalId = setInterval(check, 1000);
    check();
  });
}
