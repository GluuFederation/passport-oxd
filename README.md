# passport-oxd

Passport strategy using the OXD OpenID Connect client middleware.

It provides facility to authenticate using OpenID Connect Server in your NodeJS application. By plugging into [Passport.js](http://passportjs.org), OpenID Connect authentication can be easily and unobtrusively integrated into any application or framework that supports [Connect](https://github.com/senchalabs/connect#readme)-style middleware, including [Express](http://expressjs.com/).

## Prerequisites

- Node >= 10.x.x and NPM >= 6.x.x
- OXD Server >= 4.x.x
- Gluu CE Server >= 4.1.0

## Install

```
$ npm install passport-oxd
```

## Usage

### Create a Client

You need to first create a client using OXD Server **register-site** API. To register client take a look on [OXD Documentation](https://gluu.org/docs/oxd/4.0.beta/api/#register-site).

Example for oxd regiser-site request.
```
curl -X POST \
  https://<your-oxd-server.com>:8443/register-site \
  -H 'Content-Type: application/json' \
  -d '{
    "op_host" : "https://<your_op_server.com>",
    "redirect_uris": ["https://localhost:1338/auth/gluu/redirect"],
    "scope" : ["openid", "oxd", "profile", "email", "address"],
    "grant_types": ["authorization_code", "client_credentials"],
    "client_name": "<client_name>"
}'
```

**register-site** API returns oxd_id, client_id and client_secret in response. which you need to use in passport-oxd configuration.

**redirect_uris** is your client application **callbackURL**. After authnetication, OP server will redirect you on this URL.

### Configure Strategy

```
const passport = require('passport');
const OXDStrategy = require('passport-oxd');

passport.use(
  new OXDStrategy({
   // options
      clientID: 'OXD_OP_CLIENT_ID',
      clientSecret: 'OXD_OP_CLIENT_SECRET',
      oxdID: 'OXD_ID',
      issuer: 'OP_SERVER_URL',
      oxdServer: 'OXD_SERVER_URL'
  }, 
  // verify callback 
  (req, accessTokenResponse, userInfoResponse, done) => {
    
  })
);
```

OXD Strategy need two parameter.

1. Options:

| Options | Description |
|---------|-------------|
|oxdID|OXD Client's oxd_id, which you get from register-site API. register-site API make new client for you and return client credentials (oxd_id, client_id, client_secret, etc...).|
|clientID|OXD OP CLient's client ID|
|clientSecret|OXD OP CLient's client Secret|
|issuer|Your OP Server URL. example: `https://your.server.org`|
|oxdServer|Your OXD server URL. example: `https://your.oxd.org:8443`|
|scope(optional)|example: `['openid', 'email', 'profile']`|
|acr_values(optional)|example: `['passport_social', 'basic']`|
|redirect_uri(optional)|example: `https://localhost:4200/auth/gluu/redirect`|
|params(optional)|example: `params: { max_age: 1000 }`|
|prompt(optional)|example: `prompt: 'login'`|
|custom_parameters(optional)|Used to pass custom parameters|

2. Verify callback

Applications must supply a `verify` callback which accepts an `req`, `accessTokenResponse`, and `userInfoResponse`, and then calls the `done` callback supplying a `user`, which should be set to `false` if the credentials are not valid. If an exception occurred, `err` should be set.

### Authenticate Requests

Use `passport.authenticate()` with strategy name `oxd` to authenticate request.

Example, as route middleware in an [Express](http://expressjs.com/) application:

```
const router = require('express').Router();
const passport = require('passport');

app.get('/auth/gluu',
  passport.authenticate('oxd', OPTIONS));

app.get('/auth/gluu/callback',
  passport.authenticate('oxd', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/profile');
  });
```

**OPTIONS** are optional. There are some OPTIONS to request to OP Server.

| Options | Description |
|---------|-------------|
|scope|It is the OAuth Scope. example: `{ scope: ['openid', 'email', 'profile'] }`|
|acr_values|It is the acr_values, which you want to request to external OP to serve a specific authentication strategy. example: `{ acr_values: ['passport_social', 'basic']` }|
|custom_parameters|You can some custome paramaeter in request as your OP Configuration. example: `{ custom_parameters: {param1: '1', param2: '2'} }`|
|redirect_uri(optional)|example: `https://localhost:4200/auth/gluu/redirect`|
|params(optional)|example: `params: { max_age: 1000 }`|
|prompt(optional)|example: `prompt: 'login'`|

### Demo

The demo is in [passport-oxd](https://github.com/GluuFederation/passport-oxd/) repository in demo folder. Run below command in `/demo` directive to install dependencies.

```
npm install
```

Update your OXD Client configuration in `/demo/config/keys.js` file.

The demo runs on port 4200. you can change port in `./demo/app.js` file.

As per demo configuration, you need to register client in OXD with `https://localhost:4200/auth/gluu/redirect` authorization_redirect_uri.

### License

[The AGPL-3.0 LICENSE](https://raw.githubusercontent.com/GluuFederation/passport-oxd/master/LICENSE) 

