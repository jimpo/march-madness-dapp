import {action, observable, computed} from 'mobx';

const SEEDS = [1, 16, 8, 9, 5, 12, 4, 13, 6, 11, 3, 14, 7, 10, 2, 15];


class TournamentStore {
  @observable teams;
  @observable regions;

  @computed get ready() {
    return !!(this.teams && this.regions);
  }

  regionDetails(regionNumber) {
    return {
      number: regionNumber,
      name: this.regions[regionNumber]
    };
  }

  getTeam(number) {
    return {
      number: number,
      seed: SEEDS[number % 16],
      ...this.teams[number]
    };
  }
}

export default new TournamentStore();
