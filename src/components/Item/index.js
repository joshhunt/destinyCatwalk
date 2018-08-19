import React from 'react';
import { isArray, intersection } from 'lodash';
import cx from 'classnames';
import { connect } from 'react-redux';

import {
  CLASSES,
  SHADER,
  WEAPON_MODS_ORNAMENTS,
  ARMOR_MODS_ORNAMENTS
} from 'app/lib/destinyEnums';
import { getNameForItem } from 'src/lib/destinyUtils';

import BungieImage from 'src/components/BungieImage';

import s from './styles.styl';

function makeItemTypeName(item, type) {
  const _klass = CLASSES[item.classType];
  const klass = _klass ? `${_klass} ` : '';
  const official = item.itemTypeName || item.itemTypeDisplayName;

  return `${klass}${official}`;
}

const NO_ICON = '/img/misc/missing_icon_d2.png';

function Item({ className, item, shader, ornament, reversed }) {
  if (!item) {
    // TODO: return some kind of placeholder?
    return null;
  }

  const name = getNameForItem(item, true) || <em>No name</em>;
  const icon =
    (item.displayProperties && item.displayProperties.icon) || NO_ICON;

  const shaderIcon =
    (shader && shader.displayProperties && shader.displayProperties.icon) ||
    NO_ICON;
  const shaderName = getNameForItem(shader, true) || <em>No name</em>;

  const ornamentIcon =
    (ornament &&
      ornament.displayProperties &&
      ornament.displayProperties.icon) ||
    NO_ICON;
  const ornamentName = getNameForItem(ornament, true) || <em>No name</em>;

  return (
    <div className={cx(s.root, className, reversed && s.reversed)}>
      <div className={s.accessory}>
        <BungieImage className={s.icon} src={icon} />
      </div>

      <div className={s.main}>
        <div className={s.name}>{name}</div>
        <div className={s.itemType}>{makeItemTypeName(item)}</div>
        {shader && (
          <div className={s.itemMod}>
            <BungieImage className={s.itemModIcon} src={shaderIcon} />{' '}
            {shaderName}
          </div>
        )}
        {ornament && (
          <div className={s.itemMod}>
            <BungieImage className={s.itemModIcon} src={ornamentIcon} />{' '}
            {ornamentName}
          </div>
        )}
      </div>
    </div>
  );
}

function findSocketOfType(itemDefs, sockets, _types) {
  const types = isArray(_types) ? _types : [_types];

  const found = sockets.find(socket => {
    const plugItem = itemDefs[socket.plugHash];

    return (
      plugItem && intersection(plugItem.itemCategoryHashes, types).length > 0
    );
  });

  return found && itemDefs[found.plugHash];
}

const mapStateToProps = (state, ownProps) => {
  const { lastProfile } = state.clan;
  const { DestinyInventoryItemDefinition } = state.definitions;

  if (!DestinyInventoryItemDefinition) {
    return {};
  }

  if (!lastProfile) {
    return {
      item: DestinyInventoryItemDefinition[ownProps.itemHash]
    };
  }

  const sockets =
    lastProfile.itemComponents.sockets.data[ownProps.itemInstanceId].sockets;

  const shader = findSocketOfType(DestinyInventoryItemDefinition, sockets, [
    SHADER
  ]);

  const ornament = findSocketOfType(DestinyInventoryItemDefinition, sockets, [
    WEAPON_MODS_ORNAMENTS,
    ARMOR_MODS_ORNAMENTS
  ]);

  return {
    item: DestinyInventoryItemDefinition[ownProps.itemHash],
    shader,
    ornament
  };
};

export default connect(mapStateToProps)(Item);
