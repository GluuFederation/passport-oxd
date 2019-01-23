const express = require('express');
const https = require('https');
const fs = require('fs');
const cookie = require('cookie-session');
const passport = require('passport');

const authRoute = require('./routes/auth-routes');
const profileRoute = require('./routes/profile-route');
const passportOXD = require('./config/passport-setup');

// Set the ssl keys files to start server on https
const credentials = {
  key: fs.readFileSync('key.pem').toString(),
  cert: fs.readFileSync('cert.pem').toString()
};

const app = express();

// set session
app.set('trust proxy', 1); // trust first proxy
app.use(cookie({
  maxAge: 24 * 60 * 60 * 1000,
  keys: ['adsfghgjhjrdggfgfdg']
}));

// initialize passport
app.use(passport.initialize());
app.use(passport.session());

// set up view engine
app.set('view engine', 'ejs');

// register auth route
app.use('/auth', authRoute);

// register profile route
app.use('/profile', profileRoute);

// Create route
app.get('/', (req, res) => {
  res.render('home', {user: req.user});
});

// For self-signed certificate.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Start server
https.createServer(credentials, app).listen(1338, () => {
  console.log('Application started successfully https://localhost:1338');
});
