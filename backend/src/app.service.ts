import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getPlatformInfo() {
    return {
      name: 'Dhaoui Dattes API',
      description:
        'Plateforme e-commerce pour la vente de dattes avec espace client et tableau de bord administrateur.',
      endpoints: {
        auth: '/api/auth',
        products: '/api/products',
        orders: '/api/orders',
        dashboard: '/api/dashboard/summary',
      },
    };
  }
}
