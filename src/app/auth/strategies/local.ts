import passport from "passport";
import { Strategy } from "passport-local";
import { consola } from "consola";
import bcrypt from "bcrypt";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line node/no-missing-import
import UserModel from "../../../domain/User/UserModel";

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user: Express.User, done) => {
  consola.log(`Deserializing user ${user}`);
  try {
    const findUser = UserModel.findById(user);
    if (!findUser) {
      consola.error(`User ${user} not found`);
      throw new Error(`User ${user} not found`);
    }
    done(null, findUser);
  } catch (error) {
    consola.error(error);
    done(error);
  }
});

export default passport.use(
  new Strategy(async (username, password, done) => {
    consola.log(`Using local strategy for ${username}`);

    try {
      const user = await UserModel.findOne({ username: username });
      if (!user) {
        consola.error(`User ${username} not found`);
        return done(null, false, { message: "Incorrect username." });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        consola.error(`Incorrect password for ${username}`);
        return done(null, false, { message: "Incorrect password." });
      }

      return done(null, user);
    } catch (error) {
      consola.error(error);
      return done(error);
    }
  }),
);
