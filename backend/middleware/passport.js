const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { storage } = require('../storage');
const { generateToken } = require('../middleware/auth');

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/api/auth/google/callback",
    passReqToCallback: true
  },
  async function(req, accessToken, refreshToken, profile, done) {
    try {
      // Extract user info from Google profile
      const email = profile.emails[0].value;
      const firstName = profile.name.givenName || profile.displayName.split(' ')[0];
      const lastName = profile.name.familyName || profile.displayName.split(' ')[1] || '';
      const profileImageUrl = profile.photos[0]?.value || '';

      // Check if user already exists
      let user = await storage.getUserByEmail(email);

      if (!user) {
        // Create new user (Google OAuth users don't have passwords)
        user = await storage.createUser({
          email,
          password: '', // No password for OAuth users
          firstName,
          lastName,
          profileImageUrl,
        });
      }

      // Generate JWT token
      const token = generateToken({ userId: user.id, email: user.email });

      return done(null, { user, token });
    } catch (error) {
      return done(error, null);
    }
  }
));

module.exports = passport;
