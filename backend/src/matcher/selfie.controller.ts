import { Controller, Post, Body } from '@nestjs/common';
import { SelfieService } from './selfie.service';

@Controller('selfie')
export class SelfieController{
    constructor(private readonly selfieService: SelfieService) {}

    @Post('upload')
    async getSelfieUploadUrl(@Body('personId') personId: string){
        return this.selfieService.createUploadUrl(personId);
    }
}
