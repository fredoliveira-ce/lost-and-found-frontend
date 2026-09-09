export interface ClaimantResponse {
  userId: number;
  name: string;
  quantity: number;
}

export interface LostItemClaimsReportResponse {
  lostItemId: number;
  itemName: string;
  quantity: number;
  place: string;
  claimants: ClaimantResponse[];
}
