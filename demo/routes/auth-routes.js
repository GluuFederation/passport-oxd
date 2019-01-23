const router = require('express').Router();
const passport = require('passport');

// auth login
router.get('/login', (req, res) => {
  res.render('login', { user: req.user });
});

// auth login
router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/auth/login');
});

// auth with gluu
router.get('/gluu', passport.authenticate('oxd', {
  scope: ['email', 'profile', 'openid']
}));

// redirect uri
router.get('/gluu/redirect', passport.authenticate('oxd'), (req, res) => {
  res.redirect('/profile');
});

module.exports = router;
