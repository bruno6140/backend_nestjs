import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      // Usuario existente
      const exists = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });
      if (exists) throw new ConflictException('Este correo ya está registrado');

      // Contraseña
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      // Crea
      const user = this.userRepository.create({
        ...createUserDto,
        password: hashedPassword,
      });
      await this.userRepository.save(user);
      return instanceToPlain(user);
    } catch (error) {
      if (error instanceof HttpException) {
        console.error('Error al crear el usuario:', error.message);
        throw error;
      } else {
        console.error('Error al crear el usuario:', error);
        throw new InternalServerErrorException(
          `Error al crear el usuario: ${error.message}`,
        );
      }
    }
  }

  findAll() {
    return this.userRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  /*findOne(id: number) {
    return `This action returns a #${id} user`;
  }*/

  async update(id: number, updateUserDto: UpdateUserDto) {
    try {
      // Busca el usuario
      const user = await this.userRepository.findOne({
        where: { id },
      });
      if (!user) throw new NotFoundException('Usuario no encontrado');

      // Actualiza
      Object.assign(user, updateUserDto);
      await this.userRepository.save(user);
      return instanceToPlain(user);
    } catch (error) {
      if (error instanceof HttpException) {
        console.error('Error al actualizar el usuario:', error.message);
        throw error;
      } else {
        console.error('Error al actualizar el usuario:', error);
        throw new InternalServerErrorException(
          `Error al actualizar el usuario: ${error.message}`,
        );
      }
    }
  }

  async remove(id: number) {
    try {
      // Busca el usuario
      const user = await this.userRepository.findOne({
        where: { id },
      });
      if (!user) throw new NotFoundException('Usuario no encontrado');

      // Elimina
      await this.userRepository.remove(user);
      return { message: 'Usuario eliminado correctamente' };
    } catch (error) {
      if (error instanceof HttpException) {
        console.error('Error al eliminar el usuario:', error.message);
        throw error;
      } else {
        console.error('Error al eliminar el usuario:', error);
        throw new InternalServerErrorException(
          `Error al eliminar el usuario: ${error.message}`,
        );
      }
    }
  }
}
