import React, { Component } from 'react';
import cx from 'classnames';
import { isArray, intersection } from 'lodash';
import { Link } from 'react-router';
import { connect } from 'react-redux';

import {
  SHADER,
  WEAPON_MODS_ORNAMENTS,
  ARMOR_MODS_ORNAMENTS
} from 'app/lib/destinyEnums';
import { getProfile } from 'src/store/clan';
import Character from 'src/components/Character';
import CharacterEquipment from 'src/components/CharacterEquipment';
import CharacterRenderer from 'src/components/CharacterRenderer';
import Triumphs from 'src/components/Triumphs';

import s from './styles.styl';

const k = ({ membershipType, membershipId }) =>
  [membershipType, membershipId].join(':');

function findSocketOfType(itemDefs, sockets, _types) {
  const types = isArray(_types) ? _types : [_types];

  const found = sockets.find(socket => {
    const plugItem = itemDefs[socket.plugHash];

    return (
      plugItem && intersection(plugItem.itemCategoryHashes, types).length > 0
    );
  });

  return found && found.plugHash;
}

class UserPage extends Component {
  state = { currentCharacter: null };

  componentDidMount() {
    this.props.getProfile(this.props.routeParams);
  }

  getProfile() {
    return this.props.lastProfile;
  }

  renderName() {
    const profile = this.getProfile();
    return profile
      ? profile.profile.data.userInfo.displayName
      : k(this.props.routeParams);
  }

  onCharacterClick = currentCharacter => {
    this.setState({ currentCharacter });
  };

  getCurrentCharacterEquipment = () => {
    const { characterId } = this.props.routeParams;
    const profile = this.getProfile();

    if (!characterId || !profile) {
      return null;
    }

    return profile.characterEquipment.data[characterId];
  };

  render() {
    const profile = this.getProfile();
    const { characterId: activeCharacterId } = this.props.routeParams;
    const currentCharacterEquipment = this.getCurrentCharacterEquipment();

    const {
      DestinyGearAssetsDefinition,
      DestinyInventoryItemDefinition,
      objectiveDefs,
      recordDefs,
      presentationNodeDefs
    } = this.props;

    const setup =
      currentCharacterEquipment &&
      DestinyInventoryItemDefinition &&
      currentCharacterEquipment.items.map(itemInstance => {
        const instanceData =
          profile.itemComponents.sockets.data[itemInstance.itemInstanceId];
        const sockets = (instanceData && instanceData.sockets) || [];

        const shaderHash = findSocketOfType(
          DestinyInventoryItemDefinition,
          sockets,
          [SHADER]
        );

        const ornamentHash = findSocketOfType(
          DestinyInventoryItemDefinition,
          sockets,
          [WEAPON_MODS_ORNAMENTS, ARMOR_MODS_ORNAMENTS]
        );

        return {
          ...itemInstance,
          shaderHash,
          ornamentHash
        };
      });

    return (
      <div className={s.root}>
        <h2>{this.renderName()}</h2>

        {profile && (
          <div className={s.characters}>
            {Object.values(profile.characters.data).map(character => (
              <Link
                key={character.characterId}
                to={`/${profile.profile.data.userInfo.membershipType}/${
                  profile.profile.data.userInfo.membershipId
                }/${character.characterId}`}
                className={cx(
                  s.character,
                  character.characterId === activeCharacterId &&
                    s.activeCharacter
                )}
              >
                <Character character={character} />
              </Link>
            ))}
          </div>
        )}

        {currentCharacterEquipment && (
          <div className={s.equipmentView}>
            <CharacterEquipment
              className={s.characterEquipment}
              equipment={currentCharacterEquipment}
            />

            {DestinyGearAssetsDefinition &&
              DestinyInventoryItemDefinition && (
                <CharacterRenderer
                  key={activeCharacterId}
                  equipment={setup}
                  DestinyGearAssetsDefinition={DestinyGearAssetsDefinition}
                  DestinyInventoryItemDefinition={
                    DestinyInventoryItemDefinition
                  }
                />
              )}
          </div>
        )}

        {profile && (
          <Triumphs
            profile={profile}
            objectiveDefs={objectiveDefs}
            recordDefs={recordDefs}
            presentationNodeDefs={presentationNodeDefs}
          />
        )}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    lastProfile: state.clan.lastProfile,
    DestinyGearAssetsDefinition: state.gearAssets.DestinyGearAssetsDefinition,
    DestinyInventoryItemDefinition:
      state.definitions.DestinyInventoryItemDefinition,
    objectiveDefs: state.definitions.DestinyObjectiveDefinition,
    recordDefs: state.definitions.DestinyRecordDefinition,
    presentationNodeDefs: state.definitions.presentationNodeDefs
  };
}

const mapDispatchToActions = { getProfile };

export default connect(mapStateToProps, mapDispatchToActions)(UserPage);
