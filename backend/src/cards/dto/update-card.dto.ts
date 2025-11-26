import { PartialType } from '@nestjs/swagger';
import { CreateCardDto } from './create-card.dto';
import { IsOptional } from 'class-validator';

export class UpdateCardDto extends PartialType(CreateCardDto) {
  @IsOptional()
  notes?: string;

  @IsOptional()
  recommendation?: string;

  @IsOptional()
  percentCompletion?: number;
}



