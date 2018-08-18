import { has } from 'lodash';
import { queue } from 'async';

const log = require('src/lib/log')('http');

const GET_CONCURRENCY = 50;

function getWorker({ url, opts }, cb) {
  fetch(url, opts)
    .then(res => res.json())
    .then(result => {
      cb(null, result);
    })
    .catch(err => cb(err));
}

const getQueue = queue(getWorker, GET_CONCURRENCY);

export function get(url, opts) {
  return new Promise((resolve, reject) => {
    getQueue.push({ url, opts }, (err, result) => {
      err ? reject(err) : resolve(result);
    });
  });
}

export function getDestiny(_pathname, opts = {}, postBody) {
  const url = `https://www.bungie.net/Platform${_pathname}`;
  const { pathname } = new URL(url);

  opts.headers = opts.headers || {};
  opts.headers['x-api-key'] = process.env.REACT_APP_API_KEY;

  if (opts.accessToken) {
    opts.headers['Authorization'] = `Bearer ${opts.accessToken}`;
  }

  if (postBody) {
    opts.method = 'POST';
    if (typeof postBody === 'string') {
      opts.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      opts.body = postBody;
    } else {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(postBody);
    }
  }

  log(`REQUEST: ${pathname}`, opts);

  return get(url, opts).then(resp => {
    log(`RESPONSE: ${pathname}`, resp);

    if (resp.ErrorStatus === 'DestinyAccountNotFound') {
      return null;
    }

    if (has(resp, 'ErrorCode') && resp.ErrorCode !== 1) {
      const cleanedUrl = url.replace(/\/\d+\//g, '/_/');
      const err = new Error(
        'Bungie API Error ' +
          resp.ErrorStatus +
          ' - ' +
          resp.Message +
          '\nURL: ' +
          cleanedUrl
      );

      err.data = resp;
      throw err;
    }

    const result = resp.Response || resp;

    return result;
  });
}

export function getCurrentMembership(accessToken) {
  return getDestiny('/User/GetMembershipsForCurrentUser/', { accessToken });
}

const GROUP_TYPE_CLAN = 1;
const GROUP_FILTER_ALL = 0;
export function getClansForUser({ membershipType, membershipId }, accessToken) {
  return getDestiny(
    `/GroupV2/User/${membershipType}/${membershipId}/${GROUP_FILTER_ALL}/${GROUP_TYPE_CLAN}/`,
    { accessToken }
  );
}

export function getClan(groupId, accessToken) {
  return getDestiny(`/GroupV2/${groupId}/`, { accessToken });
}

export function getClanMembers(groupId, accessToken) {
  return getDestiny(`/GroupV2/${groupId}/Members/`, { accessToken });
}

// https://www.bungie.net/Platform/Destiny2/2/Profile/4611686018469271298/
export function getProfile({ membershipType, membershipId }, accessToken) {
  return getDestiny(
    `/Destiny2/${membershipType}/Profile/${membershipId}/?components=100,200,203,205,305`,
    {
      accessToken
    }
  );
}

const ACTIVITY_LIMIT = 1;
export function getRecentActivities(
  { membershipType, membershipId, characterId },
  accessToken
) {
  return getDestiny(
    `/Destiny2/${membershipType}/Account/${membershipId}/Character/${characterId}/Stats/Activities/?mode=0&count=${ACTIVITY_LIMIT}`,
    {
      accessToken
    }
  );
}
