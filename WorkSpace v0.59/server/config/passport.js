const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

const initializePassport = (app) => {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3001/auth/google/callback",
    passReqToCallback: true,
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      const existingUser = await User.findOne({ googleId: profile.id });
      if (existingUser) {
        existingUser.refreshToken = refreshToken || existingUser.refreshToken;
        await existingUser.save();
        return done(null, existingUser);
      }
      const newUser = await new User({
        googleId: profile.id,
        fullName: profile.displayName,
        username: profile.emails[0].value.split('@')[0],
        email: profile.emails[0].value,
        refreshToken: refreshToken || null
      }).save();
  
      done(null, newUser);
    } catch (error) {
      console.error('Error during Google authentication:', error);
      done(error, null);
    }
  }));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id).then(user => {
      done(null, user);
    });
  });

  app.use(passport.initialize());
  app.use(passport.session());
};

module.exports = initializePassport;
