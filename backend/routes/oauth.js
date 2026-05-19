const express = require('express');
const router = express.Router();
const passport = require('passport');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const config = require('../config');

// Configure Passport
const GoogleStrategy = require('passport-google-oauth20').Strategy;

if (config.oauth.google.clientID) {
  passport.use(new GoogleStrategy({
    clientID: config.oauth.google.clientID,
    clientSecret: config.oauth.google.clientSecret,
    callbackURL: config.oauth.google.callbackURL,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ 'oauth.googleId': profile.id });
      
      if (!user) {
        user = await User.create({
          firstName: profile.name.givenName || 'User',
          lastName: profile.name.familyName || 'Google',
          email: profile.emails?.[0]?.value || `${profile.id}@google.local`,
          oauth: {
            provider: 'google',
            googleId: profile.id,
          },
          password: `oauth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          verified: true,
        });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Initialize session
router.use(session({
  secret: config.jwt.secret,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));
router.use(passport.initialize());
router.use(passport.session());

// Helper function to generate JWT
function generateToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expire }
  );
}

// Google OAuth routes
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'] 
}));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/?auth=error' }),
  asyncHandler(async (req, res) => {
    const token = generateToken(req.user);
    const user = req.user.toJSON();
    delete user.password;
    res.redirect(`${config.frontend.url}/?auth=success&token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
  })
);

// Apple OAuth routes
router.get('/apple', asyncHandler(async (req, res) => {
  const clientId = config.oauth.apple.clientID;
  const redirectUri = encodeURIComponent(config.oauth.apple.callbackURL);
  const scope = 'name email';
  const state = Math.random().toString(36).substring(7);
  
  const authUrl = `https://appleid.apple.com/auth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_mode=form_post&state=${state}`;
  
  res.redirect(authUrl);
}));

router.post('/apple/callback', asyncHandler(async (req, res) => {
  const { email, name, user: appleId } = req.body;
  
  let user = await User.findOne({ 'oauth.appleId': appleId });
  
  if (!user && email) {
    const names = (name || '').split(' ');
    user = await User.create({
      firstName: names[0] || 'User',
      lastName: names.slice(1).join(' ') || 'Apple',
      email: email,
      oauth: { provider: 'apple', appleId },
      password: `oauth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      verified: true,
    });
  }
  
  if (user) {
    const token = generateToken(user);
    res.redirect(`${config.frontend.url}/?auth=success&token=${token}`);
  } else {
    res.redirect(`${config.frontend.url}/?auth=error`);
  }
}));

// GitHub OAuth routes  
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/?auth=error' }),
  asyncHandler(async (req, res) => {
    const token = generateToken(req.user);
    res.redirect(`${config.frontend.url}/?auth=success&token=${token}`);
  })
);

// Facebook OAuth routes
router.get('/facebook', asyncHandler(async (req, res) => {
  const appId = config.oauth.facebook.appID;
  const redirectUri = encodeURIComponent(config.oauth.facebook.callbackURL);
  const scope = 'email,public_profile';
  
  res.redirect(`https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`);
}));

router.get('/facebook/callback', asyncHandler(async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.redirect(`${config.frontend.url}/?auth=error`);
  }
  
  const tokenUrl = 'https://graph.facebook.com/v18.0/oauth/access_token';
  const tokenResponse = await fetch(`${tokenUrl}?client_id=${config.oauth.facebook.appID}&client_secret=${config.oauth.facebook.appSecret}&redirect_uri=${config.oauth.facebook.callbackURL}&code=${code}`);
  const tokenData = await tokenResponse.json();
  
  if (tokenData.access_token) {
    const userUrl = 'https://graph.facebook.com/me?fields=id,name,email&access_token=' + tokenData.access_token;
    const userResponse = await fetch(userUrl);
    const userData = await userResponse.json();
    
    if (userData.id) {
      let user = await User.findOne({ 'oauth.facebookId': userData.id });
      
      if (!user) {
        const names = (userData.name || '').split(' ');
        user = await User.create({
          firstName: names[0] || 'User',
          lastName: names.slice(1).join(' ') || 'Facebook',
          email: userData.email || `${userData.id}@facebook.local`,
          oauth: { provider: 'facebook', facebookId: userData.id },
          password: `oauth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          verified: true,
        });
      }
      
      const token = generateToken(user);
      return res.redirect(`${config.frontend.url}/?auth=success&token=${token}`);
    }
  }
  
  res.redirect(`${config.frontend.url}/?auth=error`);
}));

// Get OAuth status
router.get('/status', (req, res) => {
  res.json({
    google: !!config.oauth.google.clientID,
    apple: !!config.oauth.apple.clientID,
    github: !!config.oauth.github.clientID,
    facebook: !!config.oauth.facebook.appID,
  });
});

module.exports = router;