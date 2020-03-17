const passport = require('passport');
const OXDStrategy = require('../../lib/strategy');
const keys = require('./keys');

passport.serializeUser((user, done) => done(null, user));

passport.deserializeUser((user, done) => done(null, user));

passport.use(
  new OXDStrategy(keys.oxd, (req, accessToken, userInfo, done) => {
    if (accessToken.access_token) {
      console.log('------ userinfo -----', userInfo, '----- accessToken ------', accessToken);
      return done(null, { id: userInfo.sub, name: userInfo.name });
    }

    return done({ message: 'Failed to get access_token' }, null);
  })
);
