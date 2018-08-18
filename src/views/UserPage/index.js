import React, { Component } from 'react';
import cx from 'classnames';
import { Link } from 'react-router';
import { connect } from 'react-redux';

import { getProfile } from 'src/store/clan';
import Character from 'src/components/Character';
import CharacterEquipment from 'src/components/CharacterEquipment';

import s from './styles.styl';

const k = ({ membershipType, membershipId }) =>
  [membershipType, membershipId].join(':');

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
          </div>
        )}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    lastProfile: state.clan.lastProfile
  };
}

const mapDispatchToActions = { getProfile };

export default connect(mapStateToProps, mapDispatchToActions)(UserPage);
