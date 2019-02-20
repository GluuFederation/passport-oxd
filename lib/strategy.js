const passport = require('passport-strategy');
const util = require('util');

const utils = require('./utils');
const AuthorizationError = require('./errors/authorizationError');

/**
 * Creates an instance of `OXDStrategy`.
 *
 * The OpenID Connect authentication strategy using OXD OpenID Connect client middleware.
 *
 * Applications must supply a `verify` callback which accepts an `req`, `accessTokenResponse`,
 * and `userInfoResponse`, and then calls the `cb`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid. If an exception occurred, `err` should be set.
 *
 * Options:
 *    - oxdID:           OXD Client's oxd_id, which you get from register-site API. register-site API make new client for you and return client credentials (oxd_id, client_id, client_secret, etc...).
 *    - clientID:        Client Id
 *    - clientSecret:    Client secret
 *    - issuer:          Your OP Server URL. example: https://your.server.org
 *    - oxdServer:       Your OXD server URL. example: https://your.oxd.org:8443
 *    - scope(optional): The scope example: ['openid', 'email', 'profile']
 *
 * @constructor
 * @param {Object} options
 * @param {Function} verify
 * @api public
 */
function OXDStrategy(options, verify) {
  if (typeof options === 'function') {
    verify = options; // eslint-disable-line
    options = undefined; // eslint-disable-line
  }
  options = options || {}; // eslint-disable-line

  utils.checkValueAndThrowError(verify, 'OXD Strategy requires a verify callback');
  utils.checkValueAndThrowError(options.oxdServer, 'OXD Strategy requires a oxdServer');
  utils.checkValueAndThrowError(options.issuer, 'OXD Strategy requires a issuer');
  utils.checkValueAndThrowError(options.oxdID, 'OXD Strategy requires a oxdID');
  utils.checkValueAndThrowError(options.clientID, 'OXD Strategy requires a clientID');
  utils.checkValueAndThrowError(options.clientSecret, 'OXD Strategy requires a clientSecret');

  passport.Strategy.call(this);
  this.name = 'oxd';
  this._verify = verify;
  this._scope = options.scope;
  this._oxdServer = options.oxdServer;
  this._issuer = options.issuer;
  this._oxdID = options.oxdID;
  this._clientID = options.clientID;
  this._clientSecret = options.clientSecret;
  this._acr_values = options.acr_values;
  this.protectionToken = { expire: 0 };
}

// Inherit from  `passport.Strategy`.
util.inherits(OXDStrategy, passport.Strategy);

/**
 * Handle authentication request:
 * 1. Get Auth URL and redirect to OP
 * 2. Get token by code and get user info
 *
 * Options:
 *    - scope(optional): example: ['openid', 'email', 'profile', 'address']
 *    - acr_values(optional): example: ['basic', 'passport_social', 'duo']
 *    - custom_parameters(optional): example: { custom1: 'abc', custom2: 'xyz' }
 *
 * @param {Object} req
 * @param {Object} options
 * @api protected
 */
OXDStrategy.prototype.authenticate = function (req, options) {
  const self = this;

  /**
   * Handle access denied
   */
  if (req.query && req.query.error) {
    if (req.query.error === 'access_denied') {
      return this.fail({ error: 'access_denied', message: req.query.error_description });
    }

    return this.error(new AuthorizationError(req.query.error_description, req.query.error, req.query.error_uri));
  }

  /**
   Get token by Code flow
   */
  if (req.query && req.query.code && req.query.state) {
    // Get Client token to access protected OXD APIs
    let accessTokenResponse;
    let state;
    return utils.getClientAccessToken(this)
      .then((protectionToken) => {
        state = req.query.state; // eslint-disable-line
        const getTokenByCodeRequest = {
          oxd_id: this._oxdID,
          code: req.query.code,
          state
        };

        return utils.getTokenByCode(this._oxdServer, getTokenByCodeRequest, protectionToken);
      })
      .then((ATResponse) => {
        accessTokenResponse = ATResponse;
        return utils.getClientAccessToken(this);
      })
      .then((protectionToken) => {
        const getUserInfoRequest = {
          oxd_id: this._oxdID,
          access_token: accessTokenResponse.access_token
        };

        return utils.getUserInfo(this._oxdServer, getUserInfoRequest, protectionToken);
      })
      .then((userInfoResponse) => {
        function verified(err, user, info) {
          if (err) { return self.error(err); }
          if (!user) { return self.fail(info); }

          info = info || {}; // eslint-disable-line
          return self.success(user, info);
        }

        return this._verify(req, accessTokenResponse, userInfoResponse, verified);
      })
      .catch(err => this.error(err));
  }

  /**
   Get authorization URL and redirect to OP server
   */
  // Get Client token to access protected OXD APIs
  return utils.getClientAccessToken(this)
    .then((token) => {
      // Get authorization URL
      options.oxd_id = this._oxdID; // eslint-disable-line
      options.scope = options.scope || this._scope || ['openid']; // eslint-disable-line
      if (this._acr_values) {
        options.acr_values = options.acr_values || this._acr_values; // eslint-disable-line
      }
      return utils.getAuthorizationURL(this._oxdServer, options, token);
    })
    // Redirect to OP Server
    .then(authorizationURL => this.redirect(authorizationURL))
    // Catch Error
    .catch(err => this.error(err));
};

/**
 * Expose `Strategy`.
 */
module.exports = OXDStrategy;
