import { Module } from '@nestjs/common';
import { ExampleController } from '../controllers/example/example.controller';
import { PrettyMessagePreviewModule } from '../services/pretty-message-preview/pretty-message-preview.module';
import { GlobalModule } from './global.module';
import { MqttModule } from './mqtt.module';
import { FileTransferModule } from '../services/file-transfer/file-transfer.module';

@Module({
  imports: [
    MqttModule.forRoot({ isGlobal: true }),
    GlobalModule.forRoot({ isGlobal: true }),
    PrettyMessagePreviewModule,
    FileTransferModule, 
  ],
  controllers: [ExampleController], 
  providers: [],
})
export class AppModule {}
