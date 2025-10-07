import "dotenv/config"
import passport from "passport";
import { Strategy, Profile, VerifyCallback } from "passport-google-oauth20";
import { userService } from "../../services/userService.js";
import { UserDB } from "../../types/user.js";
import { CustomError } from "../../utils/customError.js";

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new CustomError("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in environment variables.", 400);
}

const strategyConfig = {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/users/oauth2/redirect/accounts.google.com",
    scope: ["profile", "email"],
    state: true
}

const registerOrLogin = async (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
    try {
        const email = profile._json?.email;
        if (!email) return done(null, false, { messages: "Email not found" });

        const user = await userService.getByEmail(email);
        if (user) return done(null, user);

        const fullName = `${profile._json.given_name || ''} ${profile._json.family_name || ''}`.trim();
        
        const newUser = await userService.register({
            name: fullName || profile.displayName || "",
            email,
            password: null,
            isGoogle: true,
            profileImage: profile._json.picture || ""
        });

        return done(null, newUser);
    } catch (error) {
        done(error as Error);
    }
};

passport.use("google", new Strategy(strategyConfig, registerOrLogin));

passport.serializeUser((user: UserDB, done) => {
    try {
        done(null, user._id);
    } catch (error) {
        done(error);
    }
});

passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await userService.getById(id);
        return done(null, user);
    } catch (error) {
        done(error);
    }
});