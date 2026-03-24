import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { UserRole } from '../common/enums/user-role.enum';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';

type CreateUserInput = {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({ where: { email: email.toLowerCase() } });
  }

  async findByIdOrNull(id: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findById(id: string): Promise<UserEntity> {
    const user = await this.findByIdOrNull(id);

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    return user;
  }

  async findAll() {
    const users = await this.usersRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });

    return users.map((user) => this.sanitizeUser(user));
  }

  async createClient(input: Omit<CreateUserInput, 'role'>): Promise<UserEntity> {
    return this.createUser({ ...input, role: UserRole.CLIENT });
  }

  async createUser(input: CreateUserInput): Promise<UserEntity> {
    const existingUser = await this.findByEmail(input.email);

    if (existingUser) {
      throw new ConflictException('Un compte existe déjà avec cet email.');
    }

    const user = this.usersRepository.create({
      fullName: input.fullName,
      email: input.email.toLowerCase(),
      phone: input.phone,
      role: input.role,
      passwordHash: await bcrypt.hash(input.password, 10),
    });

    return this.usersRepository.save(user);
  }

  async validateCredentials(email: string, password: string): Promise<UserEntity> {
    const user = await this.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe invalide.');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedException('Email ou mot de passe invalide.');
    }

    return user;
  }

  sanitizeUser(user: UserEntity) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto, currentAdminId: string) {
    const user = await this.findById(id);

    if (updateUserDto.email) {
      const normalizedEmail = updateUserDto.email.trim().toLowerCase();

      if (!normalizedEmail) {
        throw new BadRequestException('L email utilisateur est obligatoire.');
      }

      const existingUser = await this.findByEmail(normalizedEmail);

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Un compte existe déjà avec cet email.');
      }

      user.email = normalizedEmail;
    }

    if (updateUserDto.fullName !== undefined) {
      const fullName = updateUserDto.fullName.trim();

      if (!fullName) {
        throw new BadRequestException('Le nom complet utilisateur est obligatoire.');
      }

      user.fullName = fullName;
    }

    if (updateUserDto.phone !== undefined) {
      const phone = updateUserDto.phone.trim();
      user.phone = phone ? phone : undefined;
    }

    if (updateUserDto.role && updateUserDto.role !== user.role) {
      if (user.id === currentAdminId) {
        throw new BadRequestException('Vous ne pouvez pas modifier votre propre role administrateur.');
      }

      if (user.role === UserRole.ADMIN && updateUserDto.role !== UserRole.ADMIN) {
        await this.ensureAnotherAdminExists();
      }

      user.role = updateUserDto.role;
    }

    const updatedUser = await this.usersRepository.save(user);
    return this.sanitizeUser(updatedUser);
  }

  async removeUser(id: string, currentAdminId: string): Promise<void> {
    if (id === currentAdminId) {
      throw new BadRequestException('Vous ne pouvez pas supprimer votre propre compte.');
    }

    const user = await this.findById(id);

    if (user.role === UserRole.ADMIN) {
      await this.ensureAnotherAdminExists();
    }

    await this.usersRepository.remove(user);
  }

  private async ensureAnotherAdminExists(): Promise<void> {
    const adminsCount = await this.usersRepository.count({
      where: {
        role: UserRole.ADMIN,
      },
    });

    if (adminsCount <= 1) {
      throw new BadRequestException('Au moins un administrateur doit rester actif sur la plateforme.');
    }
  }

  async ensureSeedUsers(): Promise<void> {
    const admin = await this.findByEmail('admin@dhaouidattes.com');
    const client = await this.findByEmail('client@dhaouidattes.com');

    if (!admin) {
      await this.createUser({
        fullName: 'Administrateur Dhaoui Dattes',
        email: 'admin@dhaouidattes.com',
        password: 'Admin123!',
        phone: '+216 20 000 001',
        role: UserRole.ADMIN,
      });
    }

    if (!client) {
      await this.createUser({
        fullName: 'Client Démo',
        email: 'client@dhaouidattes.com',
        password: 'Client123!',
        phone: '+216 20 000 002',
        role: UserRole.CLIENT,
      });
    }
  }
}