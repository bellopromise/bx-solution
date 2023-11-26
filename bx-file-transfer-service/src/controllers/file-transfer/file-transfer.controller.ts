import { Controller, Post, Get, Param, Res, UploadedFile, UseInterceptors, HttpStatus, Body, Inject, Logger, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { MqttClientService } from '../../services/mqtt-client/mqtt-client.service';
import { FileUploadDto } from '../../dtos/file-transfer/file-upload.dto';
import { TopicForSubscriptionCollection } from '../../configs/env';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { FileHelper } from '../../services/file-transfer/file-transfer.helper';
import { FileTransferService } from '../../services/file-transfer/file-transfer.service';
import path from 'path';
import { ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('file-transfer')
@Controller('file-transfer')
export class FileTransferController {
  private fileHelper: FileHelper;
  private fileChunks = new Map();
  
  constructor(
    private readonly mqttClientService: MqttClientService,
    private readonly fileTransferService: FileTransferService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private _logger: Logger
  ) {
    this.fileHelper = new FileHelper(mqttClientService);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 250 * 1024 * 1024 }, // 250MB in bytes
  }))
  @ApiOperation({ summary: 'Upload a file' })
  @ApiResponse({ status: 200, description: 'File upload request sent successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File upload',
    required: true,
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to be uploaded'
        },
        fileName: {
          type: 'string',
        },
      },
    },
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File, 
    @Body() fileUploadDto: FileUploadDto, 
    @Res() response: Response
  ) {
    try {
        if (!file) {
            this._logger.error("Upload attempt with no file.");
            return response.status(HttpStatus.BAD_REQUEST).send({ message: 'File is required' });
        }

      this._logger.log(`Uploading file: ${fileUploadDto.fileName}`);

      const originalExtension = path.extname(file.originalname);
      const fileBuffer =  file.buffer.toString('base64');
      await this.fileHelper.uploadFileInChunksAndSubscribe(originalExtension, fileBuffer, fileUploadDto.fileName);

      this._logger.log(`Upload request for ${fileUploadDto.fileName} sent successfully.`);

      return response.status(HttpStatus.OK).send({ message: 'File upload request sent successfully.' });
    } catch (error) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            this._logger.error(`Upload failed for ${fileUploadDto.fileName}: File size cannot exceed 250MB'`);
          return response.status(HttpStatus.BAD_REQUEST).send({ message: 'File size cannot exceed 250MB' });
        }

        this._logger.error(`Upload failed for ${fileUploadDto.fileName}: ${error.message}`);  
        return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: 'Upload failed', error: error.message });
    }
  }

    @Get('download/:fileName')
    @ApiOperation({ summary: 'Download a file' })
    @ApiResponse({ status: 200, description: 'File downloaded successfully.' })
    @ApiResponse({ status: 404, description: 'File not found:' })
    @ApiResponse({ status: 500, description: 'Internal Server Error' })
    @ApiParam({ name: 'fileName', description: 'Name of the file to download' })
    async downloadFile(@Param('fileName') fileName: string, @Res() response: Response) {
        try {
            this._logger.log(`Attempting to download file: ${fileName}`);

            let metadata;
            try {
                metadata = await this.fileTransferService.getFileMetadata(fileName);
            } catch (error) {
                this._logger.error(`Error retrieving metadata for ${fileName}: ${error.message}`);
                throw new NotFoundException(`File not found: ${fileName}`);
            }

            // If metadata is not available, return "Not Found" error
            if (!metadata || !metadata.Metadata) {
                throw new NotFoundException(`File not found: ${fileName}`);
            }

            const originalExtension = metadata.Metadata['original-extension'] || '';
            const downloadFileName = fileName + originalExtension;

            this._logger.log(`Attempting to download file: ${downloadFileName}`);

    
            // Retrieve the file stream from S3Ninja
            const fileStream = await this.fileTransferService.getFile(fileName);

            if (!fileStream) {
                throw new NotFoundException(`File not found: ${downloadFileName}`);
            }
    
            // Set appropriate headers for file download
            response.setHeader('Content-Disposition', `attachment; filename="${downloadFileName}"`);
            response.setHeader('Content-Type', 'application/octet-stream');
    
            // Stream the file directly to the client
            fileStream.pipe(response);
    
            this._logger.log(`File download initiated for: ${fileName}`);
        } catch (error) {
            this._logger.error(`File download failed for ${fileName}: ${error.message}`);

            if (error instanceof NotFoundException) {
                return response.status(HttpStatus.NOT_FOUND).send({ error: error.message });
            }
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ error: error.message });
        }
    }

    @MessagePattern(TopicForSubscriptionCollection.fileUploadRequest)
    async handleFileUploadRequest(@Payload() fileUploadData: any) {
      try {
         // this._logger.log(`Received file chunk for: ${fileUploadData.fileName}`);

          // Extract file information from the payload
          const { fileName, fileChunk, chunkIndex, totalChunks, originalExtension } = fileUploadData;
  
          // Validate incoming data
          if (!fileName || !fileChunk || chunkIndex === undefined || !totalChunks) {
              throw new Error("Missing file upload data");
          }
  
          if (!this.fileChunks.has(fileName)) {
              this.fileChunks.set(fileName, new Array(totalChunks).fill(null));
          }
          
          this.fileChunks.get(fileName)[chunkIndex] = Buffer.from(fileChunk, 'base64');
          
          const allChunksReceived = this.fileChunks.get(fileName).every(chunk => chunk !== null);
          if (allChunksReceived) {
              this._logger.log(`All chunks received for ${fileName}, assembling file.`);
              const completeFile = Buffer.concat(this.fileChunks.get(fileName));
              await this.fileTransferService.uploadFile({ fileName, buffer: completeFile, originalExtension });
              this.fileChunks.delete(fileName);
              this._logger.log(`File upload successful: ${fileName}`);
          }
      } catch (error) {
          this._logger.error(`Error handling file upload request for ${fileUploadData?.fileName}: ${error.message}`);
          throw error;
      }
    }

}
