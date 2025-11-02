import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { LoginDto, LogOutDto } from './dto/create-auth.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ActiveToken } from './entities/active-token.entity';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ActiveToken)
    private activeTokenRepository: Repository<ActiveToken>,
  ) {}

  async login(loginDto: LoginDto): Promise<any> {
    try {
      // Buscar el usuario
      const user = await this.userRepository.findOne({
        where: { email: loginDto.email },
      });
      if (!user || !user.password) {
        throw new UnauthorizedException('Usuario o contraseña no encontrados.');
      }

      // Valida la contraseña
      const isMatch = await bcrypt.compare(loginDto.password, user.password);
      if (!isMatch) throw new UnauthorizedException('Credenciales inválidas');

      // Token
      const payload = {
        sub: user.id,
        email: user.email,
      };
      const access_token = this.jwtService.sign(payload);

      // Guardar el token
      const activeToken = this.activeTokenRepository.create({
        email: user.email,
        token: access_token,
      });
      await this.activeTokenRepository.save(activeToken);

      return {
        access_token: access_token,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        console.error('Error al iniciar sesión:', error.message);
        throw error;
      } else {
        console.error('Error al iniciar sesión:', error);
        throw new InternalServerErrorException(
          `Error al iniciar sesión: ${error.message}`,
        );
      }
    }
  }

  async logout(logoutDto: LogOutDto): Promise<any> {
    try {
      // Busca el token activo
      const activeToken = await this.activeTokenRepository.findOne({
        where: { email: logoutDto.email, token: logoutDto.token },
      });
      if (!activeToken) throw new UnauthorizedException('Sesión no encontrada');

      // Elimina
      await this.activeTokenRepository.remove(activeToken);

      return { message: 'Sesión cerrada exitosamente.' };
    } catch (error) {
      if (error instanceof HttpException) {
        console.error('Error al cerrar sesión:', error.message);
        throw error;
      } else {
        console.error('Error al cerrar sesión:', error);
        throw new InternalServerErrorException(
          `Error al cerrar sesión: ${error.message}`,
        );
      }
    }
  }
}
