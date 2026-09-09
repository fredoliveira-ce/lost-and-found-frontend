export interface ClaimRequest {
  quantity: number;
}

export interface ClaimResponse {
  id: number;
  lostItemId: number;
  userId: number;
  quantity: number;
  claimedAt: string; // ISO Instant
}
