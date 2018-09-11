import React from 'react';
import cx from 'classnames';

import BungieImage from 'src/components/BungieImage';
import Objective from 'src/components/Objective';

import s from './styles.styl';

const flagEnum = (state, flag) => !!(state & flag);

const enumerateState = state => ({
  none: flagEnum(state, 0),
  recordRedeemed: flagEnum(state, 1),
  rewardUnavailable: flagEnum(state, 2),
  objectiveNotCompleted: flagEnum(state, 4),
  obscured: flagEnum(state, 8),
  invisible: flagEnum(state, 16),
  entitlementUnowned: flagEnum(state, 32),
  canEquipTitle: flagEnum(state, 64)
});

function Triumph({ recordInstance, recordDefs, objectiveDefs }) {
  const state = enumerateState(recordInstance.state);
  const completed = !state.objectiveNotCompleted;
  const recordDef = recordDefs[recordInstance.recordHash];
  const name = (recordDef && recordDef.displayProperties.name) || (
    <em>Secret</em>
  );
  const { description, icon } = (
    recordDef || { displayProperties: {} }
  ).displayProperties;

  return (
    <div
      key={recordInstance.recordHash}
      data-hash={recordInstance.recordHash}
      className={cx(
        s.record,
        completed && s.completed,
        state.recordRedeemed && s.redeemed
      )}
    >
      <div className={s.accessory}>
        {icon && <BungieImage className={s.triumpIcon} src={icon} />}
      </div>

      <div className={s.main}>
        <h3>{name}</h3>
        {description && <p className={s.recordDescription}>{description}</p>}

        {recordInstance.objectives && (
          <div className={s.objectives}>
            {recordInstance.objectives.map(objective => (
              <Objective
                objective={objective}
                objectiveDef={objectiveDefs[objective.objectiveHash]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Triumphs({
  records,
  objectiveDefs,
  recordDefs,
  presentationNodeDefs
}) {
  if (!recordDefs || !records) {
    return null;
  }

  return (
    <div className={s.recordList}>
      {records.map(record => (
        <Triumph
          recordInstance={record}
          recordDefs={recordDefs}
          objectiveDefs={objectiveDefs}
        />
      ))}
    </div>
  );
}
