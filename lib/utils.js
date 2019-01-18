const httpRequest = require('request-promise');

exports.checkValueAndThrowError = (value, errorMessage) => {
  if (!value) {
    throw new TypeError(errorMessage);
  }
};

exports.getClientAccessToken = (config) => {
  const option = {
    method: 'POST',
    uri: `${config._oxdServerURL}/get-client-token`,
    body: {
      client_id: config._clientId,
      client_secret: config._clientSecret,
      scope: ['openid', 'oxd'],
      op_host: config._issuer
    },
    resolveWithFullResponse: true,
    json: true
  };

  return httpRequest(option)
    .then((response) => {
      const tokenData = response.body;

      if (tokenData.status === 'error') {
        return Promise.reject(tokenData);
      }

      return Promise.resolve(tokenData.access_token);
    });
};

exports.getClientAccessToken = (oxdServerURL, requestBody) => {
  const option = {
    method: 'POST',
    uri: `${oxdServerURL}/get-client-token`,
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

      return Promise.resolve(tokenData.access_token);
    });
};

exports.getAuthorizationURL = (oxdServerURL, requestBody, clientToken) => {
  const option = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${clientToken}`
    },
    uri: `${oxdServerURL}/get-authorization-url`,
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
