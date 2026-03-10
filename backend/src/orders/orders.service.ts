import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ProductEntity } from '../products/entities/product.entity';
import { UserEntity } from '../users/entities/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderItemEntity } from './entities/order-item.entity';
import { OrderEntity } from './entities/order.entity';
import { OrderStatus } from './enums/order-status.enum';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly ordersRepository: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity)
    private readonly orderItemsRepository: Repository<OrderItemEntity>,
    @InjectRepository(ProductEntity)
    private readonly productsRepository: Repository<ProductEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async findAll() {
    const orders = await this.ordersRepository.find({
      relations: {
        customer: true,
        items: {
          product: true,
        },
      },
      order: { createdAt: 'DESC' },
    });

    return orders.map((order) => this.toOrderResponse(order));
  }

  async findMine(customerId: string) {
    const orders = await this.ordersRepository.find({
      where: {
        customer: { id: customerId },
      },
      relations: {
        customer: true,
        items: {
          product: true,
        },
      },
      order: { createdAt: 'DESC' },
    });

    return orders.map((order) => this.toOrderResponse(order));
  }

  async create(customerId: string, createOrderDto: CreateOrderDto) {
    const customer = await this.usersRepository.findOne({ where: { id: customerId } });

    if (!customer) {
      throw new NotFoundException('Client introuvable.');
    }

    const uniqueProductIds = [...new Set(createOrderDto.items.map((item) => item.productId))];
    const products = await this.productsRepository.find({ where: { id: In(uniqueProductIds) } });

    if (products.length !== uniqueProductIds.length) {
      throw new BadRequestException('Un ou plusieurs produits sont introuvables.');
    }

    const productMap = new Map(products.map((product) => [product.id, product]));
    let total = 0;

    const items = createOrderDto.items.map((item) => {
      const product = productMap.get(item.productId);

      if (!product) {
        throw new BadRequestException('Produit introuvable.');
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(`Stock insuffisant pour ${product.name}.`);
      }

      product.stock -= item.quantity;
      const subtotal = product.price * item.quantity;
      total += subtotal;

      return this.orderItemsRepository.create({
        product,
        quantity: item.quantity,
        unitPrice: product.price,
        subtotal,
      });
    });

    await this.productsRepository.save(products);

    const order = this.ordersRepository.create({
      customer,
      shippingAddress: createOrderDto.shippingAddress,
      city: createOrderDto.city,
      phone: createOrderDto.phone,
      notes: createOrderDto.notes,
      total,
      items,
      status: OrderStatus.PENDING,
    });

    const savedOrder = await this.ordersRepository.save(order);
    const hydratedOrder = await this.ordersRepository.findOne({
      where: { id: savedOrder.id },
      relations: {
        customer: true,
        items: {
          product: true,
        },
      },
    });

    if (!hydratedOrder) {
      throw new NotFoundException('Commande introuvable après création.');
    }

    return this.toOrderResponse(hydratedOrder);
  }

  async updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto) {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: {
        customer: true,
        items: {
          product: true,
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Commande introuvable.');
    }

    order.status = updateOrderStatusDto.status;
    const savedOrder = await this.ordersRepository.save(order);
    return this.toOrderResponse(savedOrder);
  }

  toOrderResponse(order: OrderEntity) {
    return {
      id: order.id,
      status: order.status,
      total: order.total,
      city: order.city,
      phone: order.phone,
      shippingAddress: order.shippingAddress,
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      customer: {
        id: order.customer.id,
        fullName: order.customer.fullName,
        email: order.customer.email,
        phone: order.customer.phone,
        role: order.customer.role,
      },
      items: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        product: item.product,
      })),
    };
  }
}