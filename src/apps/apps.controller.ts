import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AppsService } from './apps.service';
import { CreateAppDto } from './dto/create-app.dto';
import { UpdateAppDto } from './dto/update-app.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RequireRoles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Aplicaciones')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@RequireRoles('admin')
@ApiBearerAuth('JWT-auth')
@Controller('apps')
export class AppsController {
  constructor(private readonly appsService: AppsService) {}

  @ApiOperation({
    summary: 'Registrar una nueva aplicación (admin)',
    description:
      'Registra una nueva aplicación en el sistema, generando una API Key.',
  })
  @Post()
  create(@Body() createAppDto: CreateAppDto) {
    return this.appsService.create(createAppDto);
  }

  @ApiOperation({
    summary: 'Obtener todas las aplicaciones (admin)',
    description: 'Devuelve una lista de todas las aplicaciones.',
  })
  @Get()
  findAll() {
    return this.appsService.findAll();
  }
}
