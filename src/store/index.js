import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';

import { getAllDefinitions } from 'src/lib/definitions';

import app from './app';
import auth from './auth';
import clan from './clan';

import definitions, {
  setBulkDefinitions,
  SET_BULK_DEFINITIONS
} from './definitions';

import gearAssets, {
  setBulkGearAssets,
  SET_BULK_GEAR_ASSETS
} from './gearAssets';

const rootReducer = combineReducers({
  app,
  auth,
  clan,
  definitions,
  gearAssets
});

const composeEnhancers =
  typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
        actionsBlacklist: [SET_BULK_DEFINITIONS, SET_BULK_GEAR_ASSETS],
        stateSanitizer: state => ({
          ...state,
          definitions: state.definitions ? '[hidden]' : state.definitions
        })
      })
    : compose;

const enhancer = composeEnhancers(applyMiddleware(thunk));

const store = createStore(rootReducer, enhancer);
window.__store = store;

getAllDefinitions()
  .then(defs => {
    store.dispatch(setBulkDefinitions(defs));
  })
  .catch(err => {
    console.log('Error loading definitions');
    console.error(err);
  });

getAllDefinitions(() => {}, 'mobileGearAssetDataBases')
  .then(defs => {
    console.log('got bulk gear assets', defs);
    store.dispatch(setBulkGearAssets(defs));
  })
  .catch(err => {
    console.log('Error loading definitions');
    console.error(err);
  });

export default store;
