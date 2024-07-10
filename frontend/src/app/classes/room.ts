export interface Room {
  id: string;
  users: string[];
  spectators: string[];
  environment: string;
  preferredRounds: number;
}
