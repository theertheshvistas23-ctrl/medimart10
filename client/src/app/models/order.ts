import { OrderItem } from './order-item';

export interface Order {

  id?: number;
  orderDate?: Date;
  totalAmount?: number;
  orderItems: OrderItem[];
}