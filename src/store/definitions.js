import { pickBy } from 'lodash';
import { makePayloadAction } from './utils';

export const SET_BULK_DEFINITIONS = 'Set bulk definitions';

export default function definitionsReducer(state = {}, { type, payload }) {
  switch (type) {
    case SET_BULK_DEFINITIONS: {
      const filtered = pickBy(payload, defs => defs);

      return {
        ...state,
        ...filtered
      };
    }

    default:
      return state;
  }
}

export const setBulkDefinitions = makePayloadAction(SET_BULK_DEFINITIONS);
