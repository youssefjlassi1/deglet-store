import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ProductsService } from './products/products.service';
import { UsersService } from './users/users.service';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly productsService: ProductsService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.usersService.ensureSeedUsers();
    await this.productsService.ensureSeedProducts();
    this.logger.log('Données initiales Dhaoui Dattes prêtes.');
  }
}