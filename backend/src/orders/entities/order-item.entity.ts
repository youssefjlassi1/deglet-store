import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ProductEntity } from '../../products/entities/product.entity';
import { OrderEntity } from './order.entity';

@Entity({ name: 'order_items' })
export class OrderItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => OrderEntity, (order) => order.items, { onDelete: 'CASCADE' })
  order!: OrderEntity;

  @ManyToOne(() => ProductEntity, (product) => product.orderItems, { eager: true, nullable: false })
  product!: ProductEntity;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ name: 'unit_price', type: 'float' })
  unitPrice!: number;

  @Column({ type: 'float' })
  subtotal!: number;
}