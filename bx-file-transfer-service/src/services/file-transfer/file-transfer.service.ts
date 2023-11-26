import { Inject, Injectable, Logger } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AWS_ACCESS_KEY_ID, AWS_BUCKET_NAME, AWS_S3_ENDPOINT, AWS_SECRET_ACCESS_KEY } from '../../configs/env';

@Injectable()
export class FileTransferService {
  private s3: AWS.S3;
  constructor(private configService: ConfigService, @Inject(WINSTON_MODULE_NEST_PROVIDER) private _logger: Logger) {
    this.s3 = new AWS.S3({
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey:  AWS_SECRET_ACCESS_KEY, 
      endpoint: new AWS.Endpoint(AWS_S3_ENDPOINT), 
      s3ForcePathStyle: true, // Needed for S3Ninja
    });
  }

  async uploadFile({ fileName, buffer, originalExtension}): Promise<void> {
    const uploadParams = {
      Bucket: AWS_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      Metadata: {
        'original-extension': originalExtension 
      }
    };

    try {
      this._logger.log(`Uploading file: ${fileName} to S3`);
      await this.s3.upload(uploadParams).promise();
      this._logger.log(`File uploaded successfully: ${fileName}`);
    } catch (error) {
      this._logger.error(`File upload failed for ${fileName}: ${error.message}`);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  async getFile(fileName: string): Promise<Readable> {
    const getParams = {
      Bucket: AWS_BUCKET_NAME,
      Key: fileName,
    };

    try {
        return  this.s3.getObject(getParams).createReadStream();
    } catch (error) {
      throw new Error(`File retrieval failed: ${error.message}`);
    }
  }

  async getFileMetadata(fileName: string): Promise<AWS.S3.HeadObjectOutput> {
    try {
        return await this.s3.headObject({
            Bucket: AWS_BUCKET_NAME,
            Key: fileName
        }).promise();
    } catch (error) {
        this._logger.error(`Failed to get metadata for file ${fileName}: ${error.message}`);
        throw error;
    }
  }

}

