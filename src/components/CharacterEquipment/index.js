import React from 'react';
import { keyBy } from 'lodash';
import cx from 'classnames';

import {
  BUCKET_ARMOR_HEAD,
  BUCKET_ARMOR_ARMS,
  BUCKET_ARMOR_CHEST,
  BUCKET_ARMOR_LEGS,
  BUCKET_ARMOR_CLASS_ITEM,
  BUCKET_WEAPON_KINETIC,
  BUCKET_WEAPON_ENERGY,
  BUCKET_WEAPON_POWER,
  BUCKET_WEAPON_GHOST
} from 'src/lib/destinyEnums';

import Item from 'src/components/Item';
import CharacterRenderer from 'src/components/CharacterRenderer';

import s from './styles.styl';

export default function CharacterEquipment({ equipment, className }) {
  const buckets = keyBy(equipment.items, item => item.bucketHash);

  return (
    <div className={cx(className, s.root)}>
      <div className={s.weapons}>
        <Item
          className={s.item}
          bucket={BUCKET_WEAPON_KINETIC}
          itemHash={buckets[BUCKET_WEAPON_KINETIC].itemHash}
          itemInstanceId={buckets[BUCKET_WEAPON_KINETIC].itemInstanceId}
        />
        <Item
          className={s.item}
          bucket={BUCKET_WEAPON_ENERGY}
          itemHash={buckets[BUCKET_WEAPON_ENERGY].itemHash}
          itemInstanceId={buckets[BUCKET_WEAPON_ENERGY].itemInstanceId}
        />
        <Item
          className={s.item}
          bucket={BUCKET_WEAPON_POWER}
          itemHash={buckets[BUCKET_WEAPON_POWER].itemHash}
          itemInstanceId={buckets[BUCKET_WEAPON_POWER].itemInstanceId}
        />
        <Item
          className={s.item}
          bucket={BUCKET_WEAPON_GHOST}
          itemHash={buckets[BUCKET_WEAPON_GHOST].itemHash}
          itemInstanceId={buckets[BUCKET_WEAPON_GHOST].itemInstanceId}
        />
      </div>

      <div className={s.armor}>
        <Item
          className={s.item}
          bucket={BUCKET_ARMOR_HEAD}
          itemHash={buckets[BUCKET_ARMOR_HEAD].itemHash}
          itemInstanceId={buckets[BUCKET_ARMOR_HEAD].itemInstanceId}
        />
        <Item
          className={s.item}
          bucket={BUCKET_ARMOR_ARMS}
          itemHash={buckets[BUCKET_ARMOR_ARMS].itemHash}
          itemInstanceId={buckets[BUCKET_ARMOR_ARMS].itemInstanceId}
        />
        <Item
          className={s.item}
          bucket={BUCKET_ARMOR_CHEST}
          itemHash={buckets[BUCKET_ARMOR_CHEST].itemHash}
          itemInstanceId={buckets[BUCKET_ARMOR_CHEST].itemInstanceId}
        />
        <Item
          className={s.item}
          bucket={BUCKET_ARMOR_LEGS}
          itemHash={buckets[BUCKET_ARMOR_LEGS].itemHash}
          itemInstanceId={buckets[BUCKET_ARMOR_LEGS].itemInstanceId}
        />
        <Item
          className={s.item}
          bucket={BUCKET_ARMOR_CLASS_ITEM}
          itemHash={buckets[BUCKET_ARMOR_CLASS_ITEM].itemHash}
          itemInstanceId={buckets[BUCKET_ARMOR_CLASS_ITEM].itemInstanceId}
        />
      </div>
    </div>
  );
}
