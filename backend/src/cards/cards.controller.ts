import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Cards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post()
  @ApiOperation({ summary: 'Создать карточку ученика' })
  create(@Body() createCardDto: CreateCardDto, @CurrentUser() user: any) {
    return this.cardsService.create(createCardDto, user.id);
  }

  @Get('lesson/:lessonId')
  @ApiOperation({ summary: 'Получить все карточки урока' })
  findByLesson(@Param('lessonId') lessonId: string, @CurrentUser() user: any) {
    return this.cardsService.findByLesson(lessonId, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить карточку по ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.cardsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить карточку' })
  update(
    @Param('id') id: string,
    @Body() updateCardDto: UpdateCardDto,
    @CurrentUser() user: any,
  ) {
    return this.cardsService.update(id, updateCardDto, user.id);
  }
}



