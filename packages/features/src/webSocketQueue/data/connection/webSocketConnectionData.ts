import { askConnectionDeleteByConnectionId } from './askConnectionDeleteByConnectionId';
import { askConnectionGetAll } from './askConnectionGetAll';
import { askConnectionGetById } from './askConnectionGetById';
import { askConnectionGetByUserId } from './askConnectionGetByUserId';
import { askConnectionUpsert } from './askConnectionUpsert';

export const webSocketConnectionData = {
  askConnectionGetByUserId,
  askConnectionGetById,
  askConnectionGetAll,
  askConnectionDeleteByConnectionId,
  askConnectionUpsert,
};
