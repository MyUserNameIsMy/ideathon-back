import { Body, Controller, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { MessageDTO } from './dto/message.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('message')
  async createThread(@Body() dto: MessageDTO) {
    return await this.appService.createMessage(dto);
  }
}
