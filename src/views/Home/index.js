import React, { Component } from 'react';
import { Link } from 'react-router';
import { get } from 'lodash';
import { connect } from 'react-redux';

import BungieImage from 'src/components/BungieImage';
import PlayerSearch from 'src/components/PlayerSearch';

import s from './styles.styl';

class Home extends Component {
  render() {
    return (
      <div className={s.root}>
        <PlayerSearch router={this.props.router} />
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    memberships: get(state, 'auth.membership.destinyMemberships', [])
  };
}

const mapDispatchToActions = {};

export default connect(mapStateToProps, mapDispatchToActions)(Home);
