const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const UserModel = require("../models/userModel");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists in our db
        let user = await UserModel.findOne({ googleId: profile.id });

        if (user) {
          // If user exists, return them
          return done(null, user);
        } else {
          // If not, check if a user exists with the same email
          user = await UserModel.findOne({ email: profile.emails[0].value });

          if (user) {
            // If email exists, link the Google account
            user.googleId = profile.id;
            user.avatar = user.avatar || profile.photos[0].value;
            await user.save();
            return done(null, user);
          } else {
            // If no user exists, create a new one
            const newUser = new UserModel({
              googleId: profile.id,
              name: profile.displayName,
              email: profile.emails[0].value,
              avatar: profile.photos[0].value,
              verify_email: true, // Email is verified by Google
            });
            await newUser.save();
            return done(null, newUser);
          }
        }
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// These are not strictly needed for JWT, but good practice with Passport
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await UserModel.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
