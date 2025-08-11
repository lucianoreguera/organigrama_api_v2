import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getAppHealth() {
    return this.appService.getHealth();
  }

  @Get('db-status')
  getDatabaseStatus() {
    return this.appService.getDbStatus();
  }
}
