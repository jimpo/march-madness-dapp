import {action, observable, computed} from 'mobx';


class ContractStore {
  NO_COMMITMENT = "0x0000000000000000000000000000000000000000000000000000000000000000";

  @observable account;
  @observable oracleIsVoter;
  @observable oracleHasVoted;

  @observable entryFee;
  @observable scoringDuration;
  @observable tournamentDataIPFSHash;
  @observable tournamentStartTime;
  @observable contestOverTime;
  @observable timeToTournamentStart;
  @observable timeToContestOver;
  @observable winningScore;
  @observable commitments = new Map();
  @observable scores = new Map();
  @observable collectedWinnings = new Map();

  @computed get tournamentStarted() {
    return this.timeToTournamentStart === 0;
  }

  @computed get contestOver() {
    return this.timeToContestOver === 0;
  }

  @computed get resultsSubmitted() {
    return this.results && this.results !== "0x0000000000000000";
  }
}

export default new ContractStore();
