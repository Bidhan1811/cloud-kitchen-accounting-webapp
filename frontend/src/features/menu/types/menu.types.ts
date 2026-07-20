export interface MenuItem {
  _id: string;
  name: string;
  category: string;
  price: number;
  halfPrice?: number;
  isActive: boolean;
  description?: string;
  createdAt: string;
}

export interface MenuFilters {
  search?: string;
  category?: string;
  isActive?: boolean;
  activeOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateMenuItemPayload {
  name: string;
  category: string;
  price: number;
  halfPrice?: number;
  isActive?: boolean;
  description?: string;
}
