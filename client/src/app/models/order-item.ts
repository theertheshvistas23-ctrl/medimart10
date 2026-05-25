import { Medicine } from './medicine';

export interface OrderItem {

  id?: number;
  quantity: number;
  price: number;
  medicine: Medicine;
}