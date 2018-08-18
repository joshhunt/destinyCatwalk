import React, { Component } from 'react';
import { connect } from 'react-redux';

import destinyAuth from 'src/lib/destinyAuth';
import { setAuth, getMembership } from 'src/store/auth';

import s from './styles.styl';

const CLIENT_ID = process.env.REACT_APP_BUNGIE_CLIENT_ID;
const AUTH_URL = `https://www.bungie.net/en/OAuth/Authorize?client_id=${CLIENT_ID}&response_type=code`;

export default function App({ children }) {
  return (
    <div className={s.root}>
      <div className={s.header}>
        <h1>the catwalk</h1>
      </div>

      {children}
    </div>
  );
}

class _AuthRequired extends Component {
  componentDidMount() {
    destinyAuth((err, result) => {
      this.props.setAuth({ err, result });

      if (result.isFinal && result.isAuthenticated) {
        this.props.getMembership();
      }
    });
  }

  render() {
    return this.props.isAuthenticated ? (
      this.props.children
    ) : (
      <a href={AUTH_URL}>Login with Bungie.net to continue</a>
    );
  }
}

function mapStateToProps(state) {
  return {
    isAuthenticated: state.auth.isAuthenticated
  };
}

const mapDispatchToActions = { setAuth, getMembership };

export const AuthRequired = connect(mapStateToProps, mapDispatchToActions)(
  _AuthRequired
);
