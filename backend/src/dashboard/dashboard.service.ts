import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../common/enums/user-role.enum';
import { OrderEntity } from '../orders/entities/order.entity';
import { OrderStatus } from '../orders/enums/order-status.enum';
import { ProductEntity } from '../products/entities/product.entity';
import { UserEntity } from '../users/entities/user.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(ProductEntity)
    private readonly productsRepository: Repository<ProductEntity>,
    @InjectRepository(OrderEntity)
    private readonly ordersRepository: Repository<OrderEntity>,
  ) {}

  async getSummary() {
    const [users, products, orders] = await Promise.all([
      this.usersRepository.find(),
      this.productsRepository.find(),
      this.ordersRepository.find({
        relations: {
          customer: true,
          items: {
            product: true,
          },
        },
        order: { createdAt: 'DESC' },
      }),
    ]);

    const totalRevenue = orders
      .filter((order) => order.status !== OrderStatus.CANCELLED)
      .reduce((sum, order) => sum + order.total, 0);

    const bestSellersMap = new Map<string, { name: string; quantity: number }>();

    for (const order of orders) {
      for (const item of order.items) {
        const current = bestSellersMap.get(item.product.id) ?? {
          name: item.product.name,
          quantity: 0,
        };

        current.quantity += item.quantity;
        bestSellersMap.set(item.product.id, current);
      }
    }

    return {
      metrics: {
        clients: users.filter((user) => user.role === UserRole.CLIENT).length,
        admins: users.filter((user) => user.role === UserRole.ADMIN).length,
        products: products.length,
        totalOrders: orders.length,
        activeOrders: orders.filter((order) => ![OrderStatus.DELIVERED, OrderStatus.CANCELLED].includes(order.status))
          .length,
        totalRevenue,
      },
      lowStockProducts: products.filter((product) => product.stock <= 50),
      recentOrders: orders.slice(0, 5).map((order) => ({
        id: order.id,
        total: order.total,
        status: order.status,
        customerName: order.customer.fullName,
        createdAt: order.createdAt,
      })),
      bestSellers: [...bestSellersMap.values()]
        .sort((left, right) => right.quantity - left.quantity)
        .slice(0, 5),
    };
  }
}