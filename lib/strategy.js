const passport = require('passport-strategy');
const util = require('util');

const utils = require('./utils');
const AuthorizationError = require('./errors/authorizationError');

function OXDStrategy(options, verify) {
  if (typeof options === 'function') {
    verify = options; // eslint-disable-line
    options = undefined; // eslint-disable-line
  }
  options = options || {}; // eslint-disable-line

  utils.checkValueAndThrowError(verify, 'OXD Strategy requires a verify callback');
  utils.checkValueAndThrowError(options.oxdServerURL, 'OXD Strategy requires a oxdServerURL');
  utils.checkValueAndThrowError(options.issuer, 'OXD Strategy requires a issuer');
  utils.checkValueAndThrowError(options.oxdID, 'OXD Strategy requires a oxdID');
  utils.checkValueAndThrowError(options.clientID, 'OXD Strategy requires a clientID');
  utils.checkValueAndThrowError(options.clientSecret, 'OXD Strategy requires a clientSecret');

  passport.Strategy.call(this);
  this.name = 'passport-oxd';
  this._verify = verify;
  this._scope = options.scope;
  this._oxdServerURL = options.oxdServerURL;
  this._issuer = options.issuer;
  this._oxdID = options.oxdID;
  this._clientID = options.clientID;
  this._clientSecret = options.clientSecret;
  this.protectionToken = { expire: 0 };
}

// Inherit from  `passport.Strategy`.
util.inherits(OXDStrategy, passport.Strategy);

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

        return utils.getTokenByCode(this._oxdServerURL, getTokenByCodeRequest, protectionToken);
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

        return utils.getUserInfo(this._oxdServerURL, getUserInfoRequest, protectionToken);
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
      .catch((err) => {
        console.log(err);
        return this.error(err);
      });
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

      return utils.getAuthorizationURL(this._oxdServerURL, options, token);
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
