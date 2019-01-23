const passport = require('passport');
const OXDStrategy = require('../../lib/strategy');
const keys = require('./keys');

passport.serializeUser((user, done) => done(null, user));

passport.deserializeUser((user, done) => done(null, user));

passport.use(
  new OXDStrategy(keys.oxd, (req, accessToken, userInfo, done) => {
    if (accessToken.access_token) {
      done(null, { id: userInfo.claims.sub[0], name: userInfo.claims.name[0], email: userInfo.claims.email[0] });
    }
  })
);