import * as dotenv from 'dotenv';

dotenv.config();

export enum EnvironmentNames {
  local = 'local',
  develop = 'develop',
  staging = 'staging',
  production = 'production',
}

export const APP_NAME = 'bx-file-transfer-service';
export const LOG_COLOR = process.env.LOG_COLOR === 'true' ? true : false;
export const ENV_NAME = process.env.ENV_NAME;

export enum TopicForSubscriptionCollection {
  example = '/example/+',
  fileUploadRequest = 'file/upload/request',
  fileDownloadRequest = 'file/download/request'
}

export const SERVER_PORT = process.env.SERVER_PORT;
export const SERVER_HOST = process.env.SERVER_HOST;

export const MQTT_HOST = process.env.MQTT_HOST;
export const MQTT_PORT = process.env.MQTT_PORT;
export const MQTT_PROTOCOL = process.env.MQTT_PROTOCOL;
export const MQTT_URL = `${MQTT_PROTOCOL}://${MQTT_HOST}:${MQTT_PORT}`;
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
export const AWS_S3_FORCE_PATH_STYLE = process.env.AWS_S3_FORCE_PATH_STYLE;
export const AWS_S3_ENDPOINT = process.env.AWS_S3_ENDPOINT;
