import { TopicForSubscriptionCollection } from "../../configs/env";
import { MqttClientService } from "../mqtt-client/mqtt-client.service";

export class FileHelper {

    constructor(private mqttClientService: MqttClientService) {}

    async uploadFileInChunksAndSubscribe(originalExtension, fileBuffer, fileName) {
        try {
            const chunkSize = 100 * 1024; // 100KB per chunk
            const totalChunks = Math.ceil(fileBuffer.length / chunkSize);

            const chunkPromises = [];

            for (let i = 0; i < totalChunks; i++) {
                const start = i * chunkSize;
                const end = start + chunkSize;
                const chunk = fileBuffer.slice(start, end);

                chunkPromises.push(
                    this.sendChunk(TopicForSubscriptionCollection.fileUploadRequest, {
                        fileName,
                        fileChunk: chunk.toString('base64'),
                        chunkIndex: i,
                        totalChunks,
                        originalExtension
                    })
                );           
            }

            await Promise.all(chunkPromises);
        } catch (error) {
            throw new Error(`Failed to upload file chunks: ${error.message}`);
        }
    }

    async sendChunk(topic, data) {
        try {
            await this.mqttClientService.send(topic, data);
        } catch (error) {
            throw error; 
        }
    }

}
