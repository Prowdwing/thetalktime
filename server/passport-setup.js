const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const DiscordStrategy = require('passport-discord').Strategy;
const db = require('./database');

// Serialization
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    db.get("SELECT * FROM users WHERE id = ?", [id], (err, user) => {
        done(err, user);
    });
});

// Helper to find or create user
const findOrCreateUser = (profile, provider, done) => {
    const providerIdCol = provider === 'google' ? 'google_id' : 'discord_id';
    const email = profile.emails ? profile.emails[0].value : null;
    const avatar = profile.photos ? profile.photos[0].value : 'default_avatar.png';
    const displayName = profile.displayName || profile.username;

    // Check if user exists by provider ID
    db.get(`SELECT * FROM users WHERE ${providerIdCol} = ?`, [profile.id], (err, user) => {
        if (err) return done(err);

        if (user) {
            // Update avatar if changed (optional, but nice)
            db.run("UPDATE users SET avatar = ? WHERE id = ?", [avatar, user.id]);
            return done(null, user);
        }

        // Check if user exists by email (to merge accounts) - skipping for simplicity/security for now

        // Create new user
        // We'll generate a placeholder username if needed
        const username = `${provider}_${profile.id}`;

        db.run(`INSERT INTO users (username, displayName, avatar, ${providerIdCol}, email) VALUES (?, ?, ?, ?, ?)`,
            [username, displayName, avatar, profile.id, email],
            function (err) {
                if (err) return done(err);

                db.get("SELECT * FROM users WHERE id = ?", [this.lastID], (err, newUser) => {
                    done(err, newUser);
                });
            }
        );
    });
};

// Strategies
// GOOGLE
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback"
    }, (accessToken, refreshToken, profile, done) => {
        findOrCreateUser(profile, 'google', done);
    }));
}

// DISCORD
if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
    passport.use(new DiscordStrategy({
        clientID: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET,
        callbackURL: "/api/auth/discord/callback",
        scope: ['identify', 'email']
    }, (accessToken, refreshToken, profile, done) => {
        findOrCreateUser(profile, 'discord', done);
    }));
}

module.exports = passport;
