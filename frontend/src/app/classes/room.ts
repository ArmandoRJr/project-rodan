export interface Room {
  id: string;
  players: string[];
  spectators: string[];
  environment: string;
  preferredRounds: number;
}
