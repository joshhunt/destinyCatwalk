import React, { Component } from 'react';
import { uniqBy, debounce } from 'lodash';
import Autosuggest from 'react-autosuggest';

import { searchBungiePlayer, trialsReportPlayerSearch } from 'src/lib/destiny';

import Icon from 'app/components/Icon';

import s from './styles.styl';

const DEFAULT_MEMBERSHIP_TYPE = 2;
const PLATFORM_ICON = {
  1: 'xbox',
  2: 'playstation',
  4: 'windows'
};

function getSuggestionValue(player) {
  return player.displayName;
}

function renderSuggestion(player) {
  return (
    <div style={{ fontWeight: player.bungieResult ? 600 : 400 }}>
      <Icon brand icon={PLATFORM_ICON[player.membershipType]} />{' '}
      {player.displayName}
    </div>
  );
}

export default class Header extends Component {
  constructor(props) {
    super(props);

    this.state = {
      membershipType: DEFAULT_MEMBERSHIP_TYPE,
      playerSearchSuggestions: [],
      playerSearchValue: ''
    };

    this.loadSuggestions = debounce(this.loadSuggestions, 500, {
      leading: true
    });
  }

  componentDidMount() {
    this.mounted = true;

    this.intervalId = setInterval(() => {
      if (window.__THIS_PLAYER) {
        this.setState({ thisPlayer: window.__THIS_PLAYER });
      }
    }, 500);
  }

  componentWillUnmount() {
    this.mounted = false;
    window.clearInterval(this.intervalId);
  }

  onChange = (event, { newValue }) => {
    this.setState({
      playerSearchValue: newValue
    });
  };

  loadSuggestions = ({ value }) => {
    if (!value || value.length === 1) {
      return;
    }

    let trialsReportResults = [];
    let bungieResults = [];

    trialsReportPlayerSearch(value, this.state.membershipType).then(results => {
      trialsReportResults = results;
      const suggestions = uniqBy(
        [...bungieResults, ...trialsReportResults],
        player => {
          return `${player.membershipType}:${player.membershipId}`;
        }
      );
      this.setState({
        playerSearchSuggestions: suggestions
      });
    });

    searchBungiePlayer(value).then(results => {
      bungieResults = results;
      const suggestions = uniqBy(
        [...bungieResults, ...trialsReportResults],
        player => {
          return `${player.membershipType}:${player.membershipId}`;
        }
      );
      this.setState({
        playerSearchSuggestions: suggestions
      });
    });
  };

  clearSuggestions = () => {
    this.setState({ playerSearchSuggestions: [] });
  };

  onSuggestionSelected = (ev, { suggestion }) => {
    const { membershipType, membershipId } = suggestion;
    this.props.router.push(`/${membershipType}/${membershipId}`);
  };

  onMembershipTypeChange = ev => {
    this.setState({ membershipType: ev.target.value });
  };

  render() {
    const {
      membershipType,
      playerSearchValue,
      playerSearchSuggestions,
      thisPlayer
    } = this.state;

    // Autosuggest will pass through all these props to the input.
    const inputProps = {
      placeholder: 'Search for player',
      value: playerSearchValue || (thisPlayer ? thisPlayer.displayName : ''),
      onChange: this.onChange
    };

    return (
      <div className="headerMain">
        <div className="headerPlatform">
          <div className="headerPlatformIcon">
            <Icon brand icon={PLATFORM_ICON[membershipType]} />
          </div>

          <div className="headerPlatformDropdown">
            <Icon icon="chevron-down" />
          </div>

          <select
            className="headerPlatformSelect"
            value={membershipType}
            onChange={this.onMembershipTypeChange}
          >
            <option value={2}>Playstation</option>
            <option value={1}>Xbox</option>
            <option value={4}>Battle.net</option>
          </select>
        </div>

        <Autosuggest
          theme={{
            container: s.headerInputContainer,
            input: s.headerInput,
            suggestionsContainer: s.headerSuggestions
          }}
          suggestions={playerSearchSuggestions}
          onSuggestionsFetchRequested={this.loadSuggestions}
          onSuggestionsClearRequested={this.clearSuggestions}
          getSuggestionValue={getSuggestionValue}
          renderSuggestion={renderSuggestion}
          onSuggestionSelected={this.onSuggestionSelected}
          inputProps={inputProps}
        />
      </div>
    );
  }
}
