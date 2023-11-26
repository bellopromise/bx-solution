import { Test, TestingModule } from '@nestjs/testing';
import { FileTransferService } from './file-transfer.service';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import * as AWS from 'aws-sdk';
import { Readable } from 'stream';

jest.mock('aws-sdk', () => {
  const mockS3Instance = {
    upload: jest.fn().mockReturnThis(),
    promise: jest.fn(),
    getObject: jest.fn().mockReturnThis(),
    createReadStream: jest.fn(),
    headObject: jest.fn().mockReturnThis(),
  };

  return {
    S3: jest.fn(() => mockS3Instance),
    Endpoint: jest.fn(),
  };
});

describe('FileTransferService', () => {
  let service: FileTransferService;
  let mockLogger;
  let mockS3;

  beforeEach(async () => {
    mockS3 = new AWS.S3();
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key) => {
        switch (key) {
          case 'AWS_ACCESS_KEY_ID':
            return 'test_access_key';
          case 'AWS_SECRET_ACCESS_KEY':
            return 'test_secret_key';
          case 'AWS_S3_ENDPOINT':
            return 'http://localhost:9000';
          case 'AWS_BUCKET_NAME':
            return 'test_bucket';
          default:
            return null;
        }
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileTransferService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: WINSTON_MODULE_NEST_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<FileTransferService>(FileTransferService);
  });

  it('should upload file successfully', async () => {
    const mockFileName = 'testfile.txt';
    const mockBuffer = Buffer.from('test');
    const mockExtension = '.txt';

    mockS3.upload().promise.mockResolvedValue({
        // Mocked resolved value, which simulates successful file upload
        ETag: '"mocked-etag"',
        Location: 'http://example.com/mocked-url',
        key: mockFileName,
        Bucket: 'mocked-bucket',
      });
    

    await service.uploadFile({ fileName: mockFileName, buffer: mockBuffer, originalExtension: mockExtension });

    expect(mockS3.upload).toHaveBeenCalledWith({
      Bucket: expect.any(String),
      Key: mockFileName,
      Body: mockBuffer,
      Metadata: {
        'original-extension': mockExtension,
      },
    });
    expect(mockLogger.log).toHaveBeenCalledWith(`Uploading file: ${mockFileName} to S3`);
    expect(mockLogger.log).toHaveBeenCalledWith(`File uploaded successfully: ${mockFileName}`);
  });


  it('should retrieve file successfully', async () => {
    const mockFileName = 'testfile.txt';
    const mockReadStream = new Readable();
  
    // Set up the mock behavior for getObject
    mockS3.getObject.mockImplementation(() => ({
      createReadStream: jest.fn().mockReturnValue(mockReadStream),
    }));
  
    const result = await service.getFile(mockFileName);
  
    expect(mockS3.getObject).toHaveBeenCalledWith({
      Bucket: expect.any(String),
      Key: mockFileName,
    });
    expect(result).toBe(mockReadStream);
  });
  

  it('should retrieve file metadata successfully', async () => {
    const mockFileName = 'testfile.txt';
    const mockMetadata = { Metadata: { 'original-extension': '.txt' } };

    // Set up the mock behavior for headObject
    mockS3.headObject.mockImplementation(() => ({
        promise: jest.fn().mockResolvedValue(mockMetadata),
    }));

    const result = await service.getFileMetadata(mockFileName);

    expect(mockS3.headObject).toHaveBeenCalledWith({
        Bucket: expect.any(String),
        Key: mockFileName,
    });
    expect(result).toEqual(mockMetadata);
  });

  it('should handle upload error', async () => {
    const mockFileName = 'testfile.txt';
    const mockBuffer = Buffer.from('test');
    const mockExtension = '.txt';
    const mockError = new Error('Upload failed');
  
    // Set up the mock behavior for upload to reject
    mockS3.upload.mockImplementation(() => ({
      promise: jest.fn().mockRejectedValue(mockError),
    }));
  
    await expect(service.uploadFile({ fileName: mockFileName, buffer: mockBuffer, originalExtension: mockExtension }))
      .rejects.toThrow('File upload failed: Upload failed');
  
    expect(mockS3.upload).toHaveBeenCalledWith({
      Bucket: expect.any(String),
      Key: mockFileName,
      Body: mockBuffer,
      Metadata: {
        'original-extension': mockExtension,
      },
    });
    expect(mockLogger.error).toHaveBeenCalledWith(`File upload failed for ${mockFileName}: ${mockError.message}`);
  });

});
