import React from 'react';

// <li key={objective.objectiveHash} data-hash={objective.objectiveHash}>
//   {objectiveDefs[objective.objectiveHash].progressDescription || 'Completed'}:{' '}
//   {objective.progress} / {objective.completionValue}
// </li>;

import s from './styles.styl';

export default function Objective({ objective, objectiveDef }) {
  const progress = Math.min(objective.progress / objective.completionValue, 1);
  const percent = progress * 100;

  return (
    <div className={s.root}>
      <div className={s.track} style={{ width: `${percent}%` }} />

      <div className={s.text}>
        <div className={s.name}>
          {objectiveDef.progressDescription || <em>Secret</em>}
        </div>
        <div className={s.progress}>
          {objective.progress}{' '}
          {!objective.complete && <span>/ {objective.completionValue}</span>}
        </div>
      </div>
    </div>
  );
}
