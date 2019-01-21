/* global describe, it, expect */
const chai = require('chai');
const nock = require('nock');

const OXDStrategy = require('../lib/strategy');

describe('Strategy Success', () => {
  const oxdStrategyOptions = {
    oxdID: 'dsadsad-sfd-ger6456-ffhfghf',
    clientID: '@!1736.179E.AA60.16B2!0001!8F7C.B9AB!0008!8A36.24E1.97DE.F4EF',
    clientSecret: 'secret',
    oxdServerURL: 'https://localhost:8443',
    issuer: 'https://gluu.local.org'
  };

  const state = '473ot4nuqb4ubeokc139raur13';
  const code = 'as324trghh345fghhh';

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
    const strategy = new OXDStrategy(oxdStrategyOptions, (req, accessTokenRespose, userInfoResponse, done) => {
      if (accessTokenRespose.access_token === '1397f6e0-e9b5-4ba2-9ec1-dc64bbddf2c7') {
        return done(null, { id: userInfoResponse.claims.sub[0] }, { scope: 'read' });
      }
      return done({ error: 'Failed to get token' });
    });

    let user;
    let info;
    let ATToken;
    let UserInfo;
    const requestedScope = ['openid', 'oxd', 'permission', 'profile', 'email'];

    before((done) => {
      // Mock Get token
      const accessToken = mockClientTokenRequest(oxdStrategyOptions);

      // Mock get authorization url
      ATToken = mockGetTokenByCode(oxdStrategyOptions, { code, state }, accessToken);

      // Mock get user info
      UserInfo = mockGetUserInfo(oxdStrategyOptions, { access_token: ATToken.access_token }, accessToken);

      chai.passport
        .use(strategy)
        .success((u, i) => {
          user = u;
          info = i;
          done();
        })
        .req((req) => {
          req.session = {};
          req.query = {
            code,
            state
          };
        })
        .authenticate({ scope: requestedScope });
    });

    it('should be redirected', () => {
      expect(user.id).to.equal(UserInfo.claims.sub[0]);
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

function mockGetTokenByCode(oxdStrategyOptions, request, accessToken) {
  request.oxd_id = oxdStrategyOptions.oxdID; // eslint-disable-line

  const getTokenByCodeResponse = {
    access_token: '1397f6e0-e9b5-4ba2-9ec1-dc64bbddf2c7',
    expires_in: 299,
    id_token: 'eyJraWQiOiJjMTVlMjE2Mi0wZGMwLTRiYWUtYmRiZi1lODgyMmQxOGUwZTkiLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJodHRwczovL2dsdXUubG9jYWwub3JnIiwiYXVkIjoiQCFGQkE0LjlFREQuMjRFNy45MDlGITAwMDEhNjRFMC40OTNBITAwMDghMzkxMS40OTdCLjVFMzEuQ0Y1QSIsImV4cCI6MTU0ODA1OTkwOCwiaWF0IjoxNTQ4MDU2MzA4LCJub25jZSI6InQ4MWFvYTl1bW1hYXVtcnNlZWRiamx2bDcyIiwiYXV0aF90aW1lIjoxNTQ4MDU2Mjk3LCJhdF9oYXNoIjoiMHlieEw3VEgyaEZUUUcwaTFsTWN2ZyIsIm94T3BlbklEQ29ubmVjdFZlcnNpb24iOiJvcGVuaWRjb25uZWN0LTEuMCIsInN1YiI6Ikw5V19Wb2lPNHJKa1lLaS1aU3ZGWTlZUFMyRWVBcVFmazE4SUNOSndvS2cifQ.bjcteRZObVozT1agcZinHSZUBa38D6hkmRHMeikV_LZIwxPpHE6e0ksDvnhGkmeukEQIVJUIDzD603LQehiv0IwDyFXa6OOT7Sl7kWXfgyFXVHfqNaXpIxOLh0-YF4ska3OqNWeWk5RuEAvKEktWrW4OvW5Gx133JpHc2-girz2nVYuc7-E7EPECkW93LEhngbfATG0nwbw7495fpEH9iqNQVAqWVPhLx9W53rh_UZsePiM5kL3dPNXj7cgnAY5BFa-QLKOS6PR_DHqq83r0yo_I4-LB-Pd83K9O6ALSq3WCd1e0w4POOuvM0_bt2M3dIjF9QXxIeMyQcTF7ZQJgUw',
    refresh_token: '382b96a6-ccc7-4400-bb2c-443a57248298',
    id_token_claims: {
      at_hash: [
        '0ybxL7TH2hFTQG0i1lMcvg'
      ],
      aud: [
        '@!FBA4.9EDD.24E7.909F!0001!64E0.493A!0008!3911.497B.5E31.CF5A'
      ],
      sub: [
        'L9W_VoiO4rJkYKi-ZSvFY9YPS2EeAqQfk18ICNJwoKg'
      ],
      auth_time: [
        '1548056297'
      ],
      iss: [
        'https://gluu.local.org'
      ],
      exp: [
        '1548059908'
      ],
      iat: [
        '1548056308'
      ],
      nonce: [
        't81aoa9ummaaumrseedbjlvl72'
      ],
      oxOpenIDConnectVersion: [
        'openidconnect-1.0'
      ]
    }
  };

  nock(oxdStrategyOptions.oxdServerURL)
    .post('/get-tokens-by-code', request)
    .matchHeader('authorization', `Bearer ${accessToken}`)
    .reply(200, getTokenByCodeResponse);

  return getTokenByCodeResponse;
}

function mockGetUserInfo(oxdStrategyOptions, request, accessToken) {
  request.oxd_id = oxdStrategyOptions.oxdID; // eslint-disable-line

  const getUserInfoResponse = {
    claims: {
      sub: [
        'L9W_VoiO4rJkYKi-ZSvFY9YPS2EeAqQfk18ICNJwoKg'
      ],
      email_verified: [
        'false'
      ],
      name: [
        'virat kohli'
      ],
      given_name: [
        'virat'
      ],
      family_name: [
        'virat kohli'
      ],
      email: [
        'virat@gluu.org'
      ]
    }
  };

  nock(oxdStrategyOptions.oxdServerURL)
    .post('/get-user-info', request)
    .matchHeader('authorization', `Bearer ${accessToken}`)
    .reply(200, getUserInfoResponse);

  return getUserInfoResponse;
}
