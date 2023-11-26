
import { Module } from '@nestjs/common';
import { FileTransferController } from '../../controllers/file-transfer/file-transfer.controller';
import { FileTransferService } from './file-transfer.service';
import { MqttModule } from '../../modules/mqtt.module';

@Module({
  imports: [MqttModule], 
  controllers: [FileTransferController],
  providers: [FileTransferService],
})
export class FileTransferModule {}