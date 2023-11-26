import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class FileUploadDto {
  @ApiProperty({ description: 'The name of the file to be uploaded' })
  @IsString()
  readonly fileName: string;
}
