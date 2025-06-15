import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { db } from './db.js';
import { users, socialAccounts } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

// Check if Google OAuth credentials are available
const hasGoogleCredentials = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

if (hasGoogleCredentials) {
  // Configure Google OAuth Strategy only if credentials are available
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3001/auth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('Google OAuth Profile:', profile);
      
      // Check if user already exists with this Google ID
      const existingSocialAccount = await db
        .select()
        .from(socialAccounts)
        .where(eq(socialAccounts.providerId, profile.id))
        .limit(1);

      if (existingSocialAccount.length > 0) {
        // Update existing user with latest Google profile info
        const updatedUser = await db
          .update(users)
          .set({
            fullName: profile.displayName,
            avatarUrl: profile.photos?.[0]?.value,
            isEmailVerified: true
          })
          .where(eq(users.id, existingSocialAccount[0].userId))
          .returning();
        
        console.log(`✅ Refreshed existing Google user:`, {
          userId: existingSocialAccount[0].userId,
          fullName: profile.displayName,
          avatarUrl: profile.photos?.[0]?.value
        });
        
        return done(null, updatedUser[0] || false);
      }

      // Check if user exists with same email
      const existingEmailUser = await db
        .select()
        .from(users)
        .where(eq(users.email, profile.emails?.[0]?.value || ''))
        .limit(1);

      if (existingEmailUser.length > 0) {
        // Update existing user with Google profile info
        const updatedUser = await db
          .update(users)
          .set({
            fullName: profile.displayName || existingEmailUser[0].fullName,
            avatarUrl: profile.photos?.[0]?.value || existingEmailUser[0].avatarUrl,
            isEmailVerified: true
          })
          .where(eq(users.id, existingEmailUser[0].id))
          .returning();

        // Link Google account to existing user
        await db.insert(socialAccounts).values({
          userId: existingEmailUser[0].id,
          provider: 'google',
          providerId: profile.id,
          email: profile.emails?.[0]?.value
        });

        console.log(`✅ Updated existing user with Google profile:`, {
          userId: existingEmailUser[0].id,
          fullName: profile.displayName,
          avatarUrl: profile.photos?.[0]?.value
        });

        return done(null, updatedUser[0]);
      }

      // User không tồn tại - return false với profile info
      console.log(`⚠️ No existing user found for ${profile.emails?.[0]?.value}`);
      
      return done(null, false, { 
        message: 'no_user_found',
        profile: {
          id: profile.id,
          email: profile.emails?.[0]?.value,
          displayName: profile.displayName,
          avatarUrl: profile.photos?.[0]?.value
        }
      });
    } catch (error) {
      console.error('Google OAuth error:', error);
      return done(error, false);
    }
  }));

  console.log('✅ Google OAuth strategy configured');
} else {
  console.log('⚠️  Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
}

// Passport session serialization with detailed logging
passport.serializeUser((user: any, done) => {
  console.log(`🔄 Serializing user:`, { id: user?.id, email: user?.email });
  
  // Only serialize real user objects with valid ID
  if (!user || !user.id || typeof user.id !== 'number') {
    console.error(`❌ Cannot serialize user without valid ID:`, user);
    return done(new Error('User has no valid ID'), null);
  }
  
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    console.log(`🔍 Deserializing user ID:`, id);
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    
    if (user[0]) {
      console.log(`✅ User deserialized:`, { id: user[0].id, email: user[0].email });
      done(null, user[0]);
    } else {
      console.log(`❌ User not found for ID:`, id);
      done(null, false);
    }
  } catch (error) {
    console.error(`❌ Deserialize error:`, error);
    done(error, false);
  }
});

export { passport, hasGoogleCredentials }; 