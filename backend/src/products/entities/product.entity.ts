import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, Unique } from 'typeorm';
import { OrderItemEntity } from '../../orders/entities/order-item.entity';

@Entity({ name: 'products' })
@Unique(['slug'])
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  slug!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column()
  variety!: string;

  @Column({ name: 'origin_region' })
  originRegion!: string;

  @Column({ name: 'harvest_year', type: 'int' })
  harvestYear!: number;

  @Column({ name: 'image_url' })
  imageUrl!: string;

  @Column({ type: 'float' })
  price!: number;

  @Column({ type: 'int' })
  stock!: number;

  @Column({ type: 'boolean', default: false })
  featured!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => OrderItemEntity, (item) => item.product)
  orderItems?: OrderItemEntity[];
}