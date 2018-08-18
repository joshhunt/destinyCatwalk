import React from 'react';
import cx from 'classnames';

import { bungieUrl } from 'src/lib/destinyUtils';
import { CLASSES, GENDERS, RACES } from 'src/lib/destinyEnums';

import s from './styles.styl';

export default function Character({ character, className, onClick }) {
  return (
    <div
      className={cx(className, s.root)}
      onClick={onClick}
      style={{
        backgroundImage: `url("${bungieUrl(character.emblemBackgroundPath)}")`
      }}
    >
      <div className={s.inner}>
        <div className={s.title}>{CLASSES[character.classType]}</div>
        <div className={s.subtitle}>
          {GENDERS[character.genderType]} {RACES[character.raceType]}
        </div>
        <div className={s.light}>{character.light}</div>
      </div>
    </div>
  );
}
