import ApplicationStore from './ApplicationStore';
import BracketStore from './BracketStore';
import ContractStore from './ContractStore';
import TournamentStore from './TournamentStore';

export const applicationStore = new ApplicationStore();
export const contractStore = new ContractStore();
export const tournamentStore = new TournamentStore();
export const bracketStore = new BracketStore(tournamentStore);
