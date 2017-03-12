// @flow

import {action, observable, computed} from 'mobx';
import type BigNumber from 'bignumber';


export default class ContractStore {
  NO_COMMITMENT = "0x0000000000000000000000000000000000000000000000000000000000000000";

  @observable account: string;
  @observable oracleIsVoter: boolean;
  @observable oracleHasVoted: boolean;

  @observable entryFee: BigNumber;
  @observable scoringDuration: BigNumber;
  @observable tournamentDataIPFSHash: string;
  @observable tournamentStartTime: BigNumber;
  @observable contestOverTime: BigNumber;
  @observable timeToTournamentStart: BigNumber;
  @observable timeToContestOver: BigNumber;
  @observable winningScore: BigNumber;
  @observable totalSubmissions: number;
  @observable results: string;
  @observable commitments: Map<string, string> = new Map();
  @observable scores: Map<string, BigNumber> = new Map();
  @observable collectedWinnings: Map<string, boolean> = new Map();

  @computed get tournamentStarted(): boolean {
    return this.timeToTournamentStart === 0;
  }

  @computed get contestOver(): boolean {
    return this.timeToContestOver === 0;
  }

  @computed get resultsSubmitted(): boolean {
    return this.results != null && this.results !== "0x0000000000000000";
  }
}
