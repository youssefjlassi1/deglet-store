import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductEntity } from './entities/product.entity';

const seedProducts: CreateProductDto[] = [
  {
    name: 'Deglet Nour Signature',
    slug: 'deglet-nour-signature',
    description: 'Dattes translucides premium, très sucrées, parfaites pour la vente en coffret haut de gamme.',
    variety: 'Deglet Nour',
    category: 'Naturelles',
    originRegion: 'Kebili',
    harvestYear: 2025,
    imageUrl: 'https://images.unsplash.com/photo-1603046891744-1d2936b85ef3?auto=format&fit=crop&w=1200&q=80',
    grammage: '500 g',
    price: 18.5,
    stock: 140,
    featured: true,
  },
  {
    name: 'Branches Premium',
    slug: 'branches-premium',
    description: 'Branches entières sélectionnées pour les cadeaux d’entreprise et les coffrets saisonniers.',
    variety: 'Deglet Nour',
    category: 'Naturelles',
    originRegion: 'Tozeur',
    harvestYear: 2025,
    imageUrl: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=1200&q=80',
    grammage: '1 kg',
    price: 24,
    stock: 90,
    featured: true,
  },
  {
    name: 'Pâte de dattes artisanale',
    slug: 'pate-dattes-artisanale',
    description: 'Pâte de dattes souple idéale pour pâtisserie, snacks énergétiques et cuisine créative.',
    variety: 'Dérivés',
    category: 'Dérivés',
    originRegion: 'Gabès',
    harvestYear: 2025,
    imageUrl: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=80',
    grammage: '400 g',
    price: 9.9,
    stock: 180,
    featured: false,
  },
  {
    name: 'Dattes fourrées deluxe',
    slug: 'dattes-fourrees-deluxe',
    description: 'Assortiment festif avec amandes, pistaches et écorces d’orange pour le retail premium.',
    variety: 'Fourrées',
    category: 'Gourmandes',
    originRegion: 'Nefta',
    harvestYear: 2025,
    imageUrl: 'https://images.unsplash.com/photo-1570824104453-508955ab713e?auto=format&fit=crop&w=1200&q=80',
    grammage: '350 g',
    price: 26.5,
    stock: 60,
    featured: true,
  },
  {
    name: 'Pack famille 5kg',
    slug: 'pack-famille-5kg',
    description: 'Conditionnement économique pensé pour les familles, revendeurs et commandes récurrentes.',
    variety: 'Deglet Nour',
    category: 'Naturelles',
    originRegion: 'Douz',
    harvestYear: 2025,
    imageUrl: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=1200&q=80',
    grammage: '5 kg',
    price: 52,
    stock: 45,
    featured: false,
  },
  {
    name: 'Coffret Ramadan Élégance',
    slug: 'coffret-ramadan-elegance',
    description: 'Coffret premium prêt à offrir avec une sélection raffinée pour les périodes de forte demande.',
    variety: 'Coffret',
    category: 'Coffrets',
    originRegion: 'Tunis',
    harvestYear: 2025,
    imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80',
    grammage: '1.5 kg',
    price: 34.5,
    stock: 70,
    featured: true,
  },
];

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productsRepository: Repository<ProductEntity>,
  ) {}

  findAll(): Promise<ProductEntity[]> {
    return this.productsRepository.find({ order: { featured: 'DESC', createdAt: 'DESC' } });
  }

  async findDistinctCategories(): Promise<string[]> {
    const products = await this.productsRepository.find({
      select: ['category'],
      where: {},
    });
    const categories = [...new Set(products.map((p) => p.category).filter((c): c is string => Boolean(c?.trim())))];
    return categories.sort((a, b) => a.localeCompare(b));
  }

  findFeatured(): Promise<ProductEntity[]> {
    return this.productsRepository.find({ where: { featured: true }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<ProductEntity> {
    const product = await this.productsRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException('Produit introuvable.');
    }

    return product;
  }

  async create(createProductDto: CreateProductDto): Promise<ProductEntity> {
    const product = this.productsRepository.create(createProductDto);
    return this.productsRepository.save(product);
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<ProductEntity> {
    const product = await this.findOne(id);
    Object.assign(product, updateProductDto);
    return this.productsRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productsRepository.remove(product);
  }

  async ensureSeedProducts(): Promise<void> {
    const count = await this.productsRepository.count();

    if (count > 0) {
      return;
    }

    await this.productsRepository.save(seedProducts.map((product) => this.productsRepository.create(product)));
  }
}