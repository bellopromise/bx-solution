import { DynamicModule, Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import mqttConfig from '../configs/mqtt';
import { MqttClientServiceProvider } from '../services/mqtt-client/mqtt-client.provider';
import { PrettyMessagePreviewServiceProvider } from '../services/pretty-message-preview/pretty-message-preview.provider';
import { MqttClientService } from '../services/mqtt-client/mqtt-client.service';

@Module({
  imports: [ClientsModule.register([mqttConfig])],
  providers: [MqttClientServiceProvider, PrettyMessagePreviewServiceProvider, MqttClientService],
  exports: [MqttClientServiceProvider, PrettyMessagePreviewServiceProvider, MqttClientService],
})
export class MqttModule {
  static forRoot(options?): DynamicModule {
    return {
      global: options.isGlobal || false,
      module: MqttModule,
    };
  }
}
