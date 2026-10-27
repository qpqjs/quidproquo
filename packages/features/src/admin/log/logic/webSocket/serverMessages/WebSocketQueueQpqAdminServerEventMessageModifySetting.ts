import { WebSocketQueueEventMessage } from '../../../../../webSocketQueue';
import { WebSocketQueueQpqAdminServerMessageEventType } from './WebSocketQueueQpqAdminServerMessageEventType';

export enum AdminSettingFieldType {
  TextBox = 'TextBox',
  CheckBox = 'CheckBox',
}

export enum AdminSettingDataType {
  Parameter = 'Parameter',
}

export type WebSocketQueueQpqAdminServerEventPayloadModifySetting = {
  label: string;
  tooltip: string;
  service: string;
  fieldType: AdminSettingFieldType;
  dataType: AdminSettingDataType;
  value: string;
};

export type WebSocketQueueQpqAdminServerEventMessageModifySetting = WebSocketQueueEventMessage<
  WebSocketQueueQpqAdminServerEventPayloadModifySetting,
  WebSocketQueueQpqAdminServerMessageEventType.ModifySetting
>;
