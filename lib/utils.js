const httpRequest = require('request-promise');

const EXPIRE_DELTA_MILISECS = 10 * 1000; // 10 Secs

exports.checkValueAndThrowError = (value, errorMessage) => {
  if (!value) {
    throw new TypeError(errorMessage);
  }
};

exports.getClientAccessToken = (config) => {
  const expireFlag = config.protectionToken
    && config.protectionToken.token
    && config.protectionToken.expire > Date.now() + EXPIRE_DELTA_MILISECS;

  if (expireFlag) {
    return Promise.resolve(config.protectionToken.token);
  }

  const requestBody = {
    client_id: config._clientID,
    client_secret: config._clientSecret,
    scope: ['openid', 'oxd'],
    op_host: config._issuer
  };

  const option = {
    method: 'POST',
    uri: `${config._oxdServer}/get-client-token`,
    body: requestBody,
    resolveWithFullResponse: true,
    json: true
  };

  return httpRequest(option)
    .then((response) => {
      const tokenData = response.body;

      if (tokenData.status === 'error') {
        return Promise.reject(tokenData);
      }
      config.protectionToken.token = tokenData.access_token; // eslint-disable-line
      config.protectionToken.expire = Date.now() + (tokenData.expires_in * 1000); // eslint-disable-line
      return Promise.resolve(tokenData.access_token);
    });
};

exports.getAuthorizationURL = (oxdServer, requestBody, clientToken) => {
  const option = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${clientToken}`
    },
    uri: `${oxdServer}/get-authorization-url`,
    body: requestBody,
    resolveWithFullResponse: true,
    json: true
  };

  return httpRequest(option)
    .then((response) => {
      const authData = response.body;

      if (authData.status === 'error') {
        return Promise.reject(authData);
      }

      return Promise.resolve(authData.authorization_url);
    });
};

exports.getTokenByCode = (oxdServer, requestBody, clientToken) => {
  const option = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${clientToken}`
    },
    uri: `${oxdServer}/get-tokens-by-code`,
    body: requestBody,
    resolveWithFullResponse: true,
    json: true
  };

  return httpRequest(option)
    .then((response) => {
      const tokenData = response.body;

      if (tokenData.status === 'error') {
        return Promise.reject(tokenData);
      }

      return Promise.resolve(tokenData);
    });
};

exports.getUserInfo = (oxdServer, requestBody, clientToken) => {
  const option = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${clientToken}`
    },
    uri: `${oxdServer}/get-user-info`,
    body: requestBody,
    resolveWithFullResponse: true,
    json: true
  };

  return httpRequest(option)
    .then((response) => {
      const tokenData = response.body;

      if (tokenData.status === 'error') {
        return Promise.reject(tokenData);
      }

      return Promise.resolve(tokenData);
    });
};
