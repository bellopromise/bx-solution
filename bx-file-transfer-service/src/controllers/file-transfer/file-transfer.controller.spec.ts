import { Test, TestingModule } from '@nestjs/testing';
import { FileTransferController } from './file-transfer.controller';
import { MqttClientService } from '../../services/mqtt-client/mqtt-client.service';
import { FileTransferService } from '../../services/file-transfer/file-transfer.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Readable } from 'stream';

describe('FileTransferController', () => {
  let controller;
  let mockMqttClientService;
  let mockFileTransferService;
  let mockLogger;
  ;let mockResponse;

  beforeEach(async () => {
    mockMqttClientService = { send: jest.fn()};
    mockFileTransferService = {
         uploadFile: jest.fn(),
         getFile: jest.fn().mockImplementation(() => {
            const readableStream = new Readable();
            readableStream.push('file content');
            readableStream.push(null); 
            return readableStream;
          }),
          getFileMetadata: jest.fn().mockResolvedValue({
            Metadata: { 'original-extension': '.txt' }
          }),
    };
    mockLogger = { log: jest.fn(), error: jest.fn() };
    mockResponse = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        pipe: jest.fn(),
      };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileTransferController],
      providers: [
        {
          provide: MqttClientService,
          useValue: mockMqttClientService,
        },
        {
          provide: FileTransferService,
          useValue: mockFileTransferService,
        },
        {
          provide: WINSTON_MODULE_NEST_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile();

    controller = module.get<FileTransferController>(FileTransferController);
  });

  it('should handle MQTT message and upload file', async () => {
    const mockFileChunkData = {
      fileName: 'test',
      fileChunk: '...', // base64 encoded chunk
      chunkIndex: 0,
      totalChunks: 1,
      originalExtension: '.txt'
    };
  
    await controller.handleFileUploadRequest(mockFileChunkData);
  
    expect(mockFileTransferService.uploadFile).toHaveBeenCalledWith({
      fileName: 'test',
      buffer: expect.any(Buffer),
      originalExtension: '.txt',
    });
    expect(mockLogger.log).toHaveBeenCalledWith(expect.stringContaining('File upload successful: test'));
  });

  

  it('should process the file and send MQTT messages', async () => {
        const mockFile = { originalname: 'test.txt', buffer: Buffer.from('test') };
        const mockResponse = { status: jest.fn().mockReturnThis(), send: jest.fn() };
        const mockFileUploadDto = { fileName: 'test' };
    
        await controller.uploadFile(mockFile as any, mockFileUploadDto, mockResponse as any);
    
        expect(mockLogger.log).toHaveBeenCalledWith(expect.stringContaining('Uploading file'));
        
        // Since the file is small, it should be sent as one chunk
        const expectedNumberOfChunks = 1;
        expect(mockMqttClientService.send).toHaveBeenCalledTimes(expectedNumberOfChunks);
    });

    it('should download file successfully', async () => {
        const fileName = 'test';
        await controller.downloadFile(fileName, mockResponse as any);
    
        expect(mockFileTransferService.getFileMetadata).toHaveBeenCalledWith(fileName);
        expect(mockFileTransferService.getFile).toHaveBeenCalledWith(fileName);
        expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Disposition', `attachment; filename="${fileName}.txt"`);
        expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/octet-stream');
        expect(mockLogger.log).toHaveBeenCalledWith(`Attempting to download file: ${fileName}`);
      });
  
});
