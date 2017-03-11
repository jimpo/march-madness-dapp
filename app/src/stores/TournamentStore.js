// @flow

import {observable, computed} from 'mobx';

import type Team from '../models/Team';

const SEEDS = [1, 16, 8, 9, 5, 12, 4, 13, 6, 11, 3, 14, 7, 10, 2, 15];

type Region = {number: number, name: string};


export default class TournamentStore {
  @observable name: string;
  @observable teams: Team[];
  @observable regions: Region[];

  @computed get ready(): boolean {
    return !!(this.teams && this.regions);
  }

  setRegions(regions: string[]) {
    this.regions = regions.map((name, number) => {
      return {
        number: number,
        name: name
      };
    });
  }

  setTeams(teams: {name: string}[]) {
    this.teams = teams.map((team, number) => {
      return {
        number: number,
        seed: SEEDS[number % 16],
        ...team
      };
    });
  }
}
