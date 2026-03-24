import { Body, Controller, Delete, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../common/enums/user-role.enum';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

type AuthenticatedRequest = Request & { user: JwtPayload };

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(id, updateUserDto, request.user.sub);
  }

  @Delete(':id')
  remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.usersService.removeUser(id, request.user.sub);
  }
}
