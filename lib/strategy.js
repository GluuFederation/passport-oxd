const passport = require('passport-strategy');
const util = require('util');

const utils = require('./utils');

function OXDStrategy(options, verify) {
  if (typeof options === 'function') {
    verify = options; // eslint-disable-line
    options = undefined; // eslint-disable-line
  }
  options = options || {}; // eslint-disable-line

  utils.checkValueAndThrowError(verify, 'OXD Strategy requires a verify callback');
  utils.checkValueAndThrowError(options.oxdServerURL, 'OXD Strategy requires a oxdServerURL');
  utils.checkValueAndThrowError(options.issuer, 'OXD Strategy requires a issuer');
  utils.checkValueAndThrowError(options.oxdId, 'OXD Strategy requires a oxdId');
  utils.checkValueAndThrowError(options.clientId, 'OXD Strategy requires a clientId');
  utils.checkValueAndThrowError(options.clientSecret, 'OXD Strategy requires a clientSecret');

  passport.Strategy.call(this);
  this.name = 'oxd-passport';
  this._verify = verify;
  this._callbackURL = options.callbackURL;
  this._scope = options.scope;
  this._oxdServerURL = options.oxdServerURL;
  this._issuer = options.issuer;
  this._oxdId = options.oxdId;
  this._clientId = options.clientId;
  this._clientSecret = options.clientSecret;
}

// Inherit from  `passport.Strategy`.
util.inherits(OXDStrategy, passport.Strategy);

OXDStrategy.prototype.authenticate = function (req, options) {
  // Get token by Code
  // if (req.query && req.query.code) {
  //
  // }

  // Get authorization URL and redirect to OP server

  // Get Client token to access protected OXD APIs
  const getClientAccessTokenRequest = {
    client_id: this._clientId,
    client_secret: this._clientSecret,
    scope: ['openid', 'oxd'],
    op_host: this._issuer
  };

  utils.getClientAccessToken(this._oxdServerURL, getClientAccessTokenRequest)
    .then((token) => {
      // Get authorization URL
      options.oxd_id = this._oxdId; // eslint-disable-line
      options.scope = options.scope || this._scope || ['openid']; // eslint-disable-line

      return utils.getAuthorizationURL(this._oxdServerURL, options, token);
    })
    // Redirect to OP Server
    .then(authorizationURL => this.redirect(authorizationURL))
    // Catch Error
    .catch((err) => {
      console.log(err);
      return this.error(err);
    });
};

/**
 * Expose `Strategy`.
 */
module.exports = OXDStrategy;
