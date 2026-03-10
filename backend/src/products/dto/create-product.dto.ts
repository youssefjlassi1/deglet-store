import { IsBoolean, IsInt, IsNumber, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name!: string;

  @IsString()
  slug!: string;

  @IsString()
  description!: string;

  @IsString()
  variety!: string;

  @IsString()
  originRegion!: string;

  @IsInt()
  @Min(2020)
  harvestYear!: number;

  @IsString()
  imageUrl!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsInt()
  @Min(0)
  stock!: number;

  @IsBoolean()
  featured!: boolean;
}