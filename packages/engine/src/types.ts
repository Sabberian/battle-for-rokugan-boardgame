export type PlayerID = string;
export type TokenKind = 'army' | 'navy' | 'shinobi' | 'blessing' | 'raid' | 'diplomacy' | 'bluff';
export interface Token { id: string; kind: TokenKind; strength: number; owner?: string }
export type Special = { kind: 'peace' | 'scorched' | 'shrine' | 'battlefield' | 'harbor' } | { kind: 'honor' | 'defense'; value: number };
export interface Province {
  id: string; name: string; territory: string; neighbors: string[]; coastal: boolean;
  honor: number; defense: number; shadowlands?: boolean; capital?: boolean;
  owner: PlayerID | null; control: number; special?: Special;
  x: number; y: number;
}
export interface Order {
  id: string; player: PlayerID; token: Token; target: string;
  /** undefined = province centre; 'sea' = coastal border; otherwise a source province. */
  from?: string; parent?: string; faceup?: boolean;
}
export interface Player {
  name: string; hand: Token[]; scouts: number; shugenja: number; clan?: string;
  /** Frozen at upkeep, not recalculated after each individual battle. */
  ronin: boolean; knowledge: Record<string, Token>;
}
export interface Battle { province: string; strengths: Record<string, number>; defense: number; previous: string | null; winner: string | null }
export interface RoundState {
  provinces: Record<string, Province>; players: Record<string, Player>; orders: Order[];
  discarded: Token[]; nextOrder: number; revealed: boolean; battles: Battle[];
  removed: { order: string; reason: string }[];
}
export interface Placement { token: string; target: string; from?: string; parent?: string }
export interface PublicOrder extends Omit<Order, 'token'> { token: Token | null }
export interface PlayerView extends Omit<RoundState, 'players' | 'orders'> {
  players: Record<string, Omit<Player, 'hand' | 'knowledge'> & { hand: Token[]; handCount: number; knowledge: Record<string, Token> }>;
  orders: PublicOrder[];
}
