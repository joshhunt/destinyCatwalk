import { pickBy } from 'lodash';
import { makePayloadAction } from './utils';

export const SET_BULK_GEAR_ASSETS = 'Set bulk gear assets';

export default function gearAssetsReducer(state = {}, { type, payload }) {
  switch (type) {
    case SET_BULK_GEAR_ASSETS: {
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

export const setBulkGearAssets = makePayloadAction(SET_BULK_GEAR_ASSETS);
