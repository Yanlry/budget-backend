export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  currentBalance: number;
  goalAmount: number | null;
  createdAt: Date;
  updatedAt: Date;
}
