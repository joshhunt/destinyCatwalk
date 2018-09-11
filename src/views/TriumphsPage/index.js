import React, { Component } from 'react';
import { get } from 'lodash';
import { connect } from 'react-redux';

import { getProfile } from 'src/store/clan';
import Triumphs from 'src/components/Triumphs';
import PresentationNode from 'src/components/PresentationNode';

import s from './styles.styl';

const k = ({ membershipType, membershipId }) =>
  [membershipType, membershipId].join(':');

const DEFAULT_PRESENTATION_NODE = 1652422747;

const mapRecords = r =>
  Object.entries(r).map(([recordHash, record]) => ({
    recordHash,
    ...record
  }));

class TriumphsPage extends Component {
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

  getTriumphs() {
    const {
      presentationNodeDefs,
      routeParams: { presentationNodeHash: _p }
    } = this.props;

    const presentationNodeHash = _p || DEFAULT_PRESENTATION_NODE;

    const profile = this.getProfile();

    if (!profile) {
      return null;
    }
    const records = get(profile, 'profileRecords.data.records', {});

    // if (!presentationNodeHash) {
    //   return mapRecords(records);
    // }

    const presentationNode = presentationNodeDefs[presentationNodeHash];

    if (!presentationNode) {
      return null;
    }

    const childRecords =
      presentationNode &&
      presentationNode.children &&
      Object.values(presentationNode.children.records).map(
        ({ recordHash }) => ({ recordHash, ...records[recordHash] })
      );

    return childRecords;
  }

  render() {
    const {
      objectiveDefs,
      recordDefs,
      presentationNodeDefs,
      routeParams: { presentationNodeHash: _p, membershipType, membershipId }
    } = this.props;

    const presentationNodeHash = _p || DEFAULT_PRESENTATION_NODE;

    const profile = this.getProfile();

    const records = this.getTriumphs();
    const presentationNode =
      presentationNodeHash &&
      presentationNodeDefs &&
      presentationNodeDefs[presentationNodeHash];

    const childPresentationNodes =
      presentationNode &&
      presentationNode.children &&
      presentationNode.children.presentationNodes.map(
        ({ presentationNodeHash }) => presentationNodeDefs[presentationNodeHash]
      );

    return (
      <div className={s.root}>
        <style
          dangerouslySetInnerHTML={{ __html: `body {background: #1A1A1A}` }}
        />
        <h2>{this.renderName()}'s triumphs</h2>

        {profile && <p>Score: {profile.profileRecords.data.score}</p>}

        {presentationNode && (
          <h3>
            {presentationNode.displayProperties &&
              presentationNode.displayProperties.name}
          </h3>
        )}

        {childPresentationNodes &&
          childPresentationNodes.map(node => (
            <PresentationNode
              presentationNode={node}
              membershipType={membershipType}
              membershipId={membershipId}
            />
          ))}

        {records && (
          <Triumphs
            records={records}
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
    presentationNodeDefs: state.definitions.DestinyPresentationNodeDefinition
  };
}

const mapDispatchToActions = { getProfile };

export default connect(mapStateToProps, mapDispatchToActions)(TriumphsPage);
