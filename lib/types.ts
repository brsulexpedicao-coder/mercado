
export type View = 'lists' | 'history' | 'profile' | 'offers' | 'auth' | 'detail';

export interface UserData {
  id: string;
  name: string;
  email: string;
  password?: string;
  image: string;
}

export interface ListItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  checked: boolean;
  weight?: string;
  unit?: string;
  notes?: string;
  offer?: boolean;
  bulkDiscount?: string;
  wholesalePrice?: number;
  minWholesaleQty?: number;
  importanceLevel?: number;
}

export interface GroceryList {
  id: string;
  name: string;
  status: 'Em andamento' | 'Concluído';
  icon: string;
  color: string;
  items: ListItem[];
  avatars?: string[];
  extra?: number;
  budgetLimit?: number;
  completedAt?: string;
  totalAmount?: number;
  userId?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}
