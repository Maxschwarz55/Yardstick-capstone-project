import { Controller, Get } from '@nestjs/common';

@Controller()
export class WebAppController {
  @Get('test')
  testRequest(): string {
    return 'hello world';
  }
}
