import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GradeDto {
  @ApiProperty({ description: 'Reference text' })
  @IsString()
  reference_text: string;

  @ApiProperty({ description: 'Transcribed text' })
  @IsString()
  transcribed_text: string;
}