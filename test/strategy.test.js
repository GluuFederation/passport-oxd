/* global describe, it, expect */
const chai = require('chai');
const nock = require('nock');
const urlEncode = require('urlencode');

const OXDStrategy = require('../lib/strategy');

describe('Strategy', () => {
  const oxdStrategyOptions = {
    oxdID: 'dsadsad-sfd-ger6456-ffhfghf',
    clientID: '@!1736.179E.AA60.16B2!0001!8F7C.B9AB!0008!8A36.24E1.97DE.F4EF',
    clientSecret: 'secret',
    oxdServerURL: 'https://localhost:8443',
    issuer: 'https://gluu.local.org'
  };

  describe('constructed', () => {
    const strategy = new OXDStrategy(oxdStrategyOptions, () => {
    });

    it('should be named oxd-passport', () => {
      expect(strategy.name).to.equal('passport-oxd');
    });
  });

  describe('constructed with undefined options', () => {
    it('should throw', () => {
      expect(() => {
        OXDStrategy(undefined, () => {
        });
      }).to.throw(Error);
    });
  });

  describe('authorization request with requested scopes', () => {
    const strategy = new OXDStrategy(oxdStrategyOptions, () => {
    });

    let url;
    let authURL;
    const requestedScope = ['openid', 'oxd', 'permission', 'profile', 'email'];

    beforeEach((done) => {
      // Mock Get token
      const accessToken = mockClientTokenRequest(oxdStrategyOptions);

      // Mock get authorization url
      authURL = mockGetAuthorizationURL(oxdStrategyOptions, { scope: requestedScope }, accessToken);

      chai.passport
        .use(strategy)
        .redirect((u) => {
          url = u;
          done();
        })
        .req((req) => {
          req.session = {};
        })
        .authenticate({ scope: requestedScope });
    });

    it('should be redirected', () => {
      expect(url).to.equal(authURL);
    });
  });

  describe('authorization request with acr values', () => {
    const strategy = new OXDStrategy(oxdStrategyOptions, () => {
    });

    let url;
    let authURL;

    before((done) => {
      // Mock Get token
      const accessToken = mockClientTokenRequest(oxdStrategyOptions);

      // Mock get authorization url
      authURL = mockGetAuthorizationURL(oxdStrategyOptions, { scope: ['openid'], acr_values: ['basic', 'passport_social', 'duo'] }, accessToken);

      chai.passport
        .use(strategy)
        .redirect((u) => {
          url = u;
          done();
        })
        .authenticate({ acr_values: ['basic', 'passport_social', 'duo'] });
    });

    it('should be redirected', () => {
      expect(url).to.equal(authURL);
    });
  });

  describe('authorization request with prompt', () => {
    const strategy = new OXDStrategy(oxdStrategyOptions, () => {
    });

    let url;
    let authURL;

    before((done) => {
      // Mock Get Token
      const accessToken = mockClientTokenRequest(oxdStrategyOptions);

      // Mock get authorization url
      authURL = mockGetAuthorizationURL(oxdStrategyOptions, { scope: ['openid'], prompt: 'login' }, accessToken);

      chai.passport
        .use(strategy)
        .redirect((u) => {
          url = u;
          done();
        })
        .authenticate({ prompt: 'login' });
    });

    it('should be redirected', () => {
      expect(url).to.equal(authURL);
    });
  });

  describe('authorization request with custom parameters', () => {
    const strategy = new OXDStrategy(oxdStrategyOptions, () => {
    });

    let url;
    let authURL;

    before((done) => {
      // Mock Get Token
      const accessToken = mockClientTokenRequest(oxdStrategyOptions);

      // Mock get authorization url
      authURL = mockGetAuthorizationURL(oxdStrategyOptions, { scope: ['openid'], custom_parameters: { custom1: 'abc', custom2: 'xyz' } }, accessToken);

      chai.passport
        .use(strategy)
        .redirect((u) => {
          url = u;
          done();
        })
        .authenticate({ custom_parameters: { custom1: 'abc', custom2: 'xyz' } });
    });

    it('should be redirected', () => {
      expect(url).to.equal(authURL);
    });
  });
});

function mockClientTokenRequest(oxdStrategyOptions) {
  const clientTokenRequest = {
    op_host: oxdStrategyOptions.issuer,
    client_id: oxdStrategyOptions.clientID,
    client_secret: oxdStrategyOptions.clientSecret,
    scope: ['openid', 'oxd']
  };

  const clientTokenResponse = {
    scope: ['openid', 'oxd'],
    access_token: 'b75434ff-f465-4b70-92e4-b7ba6b6c58f2',
    expires_in: 299,
    refresh_token: 'b75434ff-f465-4b70-92e4-b7ba6b6c58f1'
  };

  nock(oxdStrategyOptions.oxdServerURL)
    .post('/get-client-token', clientTokenRequest)
    .reply(200, clientTokenResponse);

  return clientTokenResponse.access_token;
}

function mockGetAuthorizationURL(oxdStrategyOptions, authURLRequest, accessToken) {
  authURLRequest.oxd_id = oxdStrategyOptions.oxdID; // eslint-disable-line

  const authURLResponse = {
    authorization_url: `${oxdStrategyOptions.issuer}/oxauth/restv1/authorize?response_type=code&client_id=${oxdStrategyOptions.clientID}&redirect_uri=https://localhost&scope=${(authURLRequest.scope && authURLRequest.scope.join('+')) || ['openid', 'oxd'].join('+')}&state=473ot4nuqb4ubeokc139raur13&nonce=lbrdgorr974q66q6q9g454iccm`
  };

  if (authURLRequest.prompt) {
    authURLResponse.authorization_url += `&prompt=${authURLRequest.prompt}`;
  }

  if (authURLRequest.acr_values) {
    authURLResponse.authorization_url += `&acr_values=${authURLRequest.acr_values.join('+')}`;
  }

  if (authURLRequest.custom_parameters) {
    authURLResponse.authorization_url += `&custom_response_headers=${urlEncode(JSON.stringify(authURLRequest.custom_parameters))}`;
  }

  nock(oxdStrategyOptions.oxdServerURL)
    .post('/get-authorization-url', authURLRequest)
    .matchHeader('authorization', `Bearer ${accessToken}`)
    .reply(200, authURLResponse);

  return authURLResponse.authorization_url;
}
