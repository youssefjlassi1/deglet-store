export type UserRole = 'admin' | 'client';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  variety: string;
  category: string;
  originRegion: string;
  harvestYear: number;
  imageUrl: string;
  grammage?: string;
  price: number;
  stock: number;
  featured: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product: Product;
}

export interface Order {
  id: string;
  status: OrderStatus;
  total: number;
  city: string;
  phone: string;
  shippingAddress: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  customer: User;
  items: OrderItem[];
}

export interface DashboardSummary {
  metrics: {
    clients: number;
    admins: number;
    products: number;
    totalOrders: number;
    activeOrders: number;
    totalRevenue: number;
  };
  lowStockProducts: Product[];
  recentOrders: Array<{
    id: string;
    total: number;
    status: OrderStatus;
    customerName: string;
    createdAt: string;
  }>;
  bestSellers: Array<{
    name: string;
    quantity: number;
  }>;
}