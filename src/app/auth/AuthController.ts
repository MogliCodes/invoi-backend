import { Request, Response } from "express";
import bcrypt from "bcrypt";
import UserModel from "../../domain/User/UserModel.ts";
import jwt from "jsonwebtoken";
import { consola } from "consola";
import SettingsModel from "../../domain/Settings/SettingsModel.js";
const jwtSecret = process.env.SECRET_KEY || "";

export default class AuthController {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async register(req: Request, res: Response) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { username, email, password } = req.body;

    // Validate request body
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    try {
      const userExists = await UserModel.findOne()
        .where("username")
        .equals(username);

      consola.info("userExists", userExists);

      if (userExists) {
        consola.info(`Username ${username} already exists`);
        res.status(409).json({
          error: "User already exists",
          message:
            "The provided email address is already registered. Please use a different email or try logging in.",
        });
      } else {
        const encryptedPassword = await bcrypt.hash(password, 10);
        const newUser = await UserModel.create({
          username,
          email,
          password: encryptedPassword,
        });
        consola.success(`User ${username} created successfully`);
        const settings = await SettingsModel.create({
          user: newUser.id,
          username: newUser.username,
          email: newUser.email,
        });
        consola.success(`Settings for ${username} created successfully`);
        res.status(201).json({
          message: "Erfolgreich registriert",
          status: 201,
          data: { newUser, settings },
        });
      }
    } catch (error) {
      console.error(error);
    }
  }
  public async login(req: Request, res: Response) {
    const { username, password } = req.body;
    try {
      const user = await UserModel.findOne().where("username").equals(username);
      if (!user) {
        const error = new Error("No user found in database.");
        res.status(404).json({ status: 404, error: error.message });
        return;
      }

      const isPasswordMatch = await bcrypt.compare(
        password,
        user?.password || "",
      );

      let token;
      if (isPasswordMatch) {
        consola.info(`Succesful login by ${username}`);
        // Generate a JWT token
        token = jwt.sign({ id: user.id, username: user.username }, jwtSecret, {
          expiresIn: "30d",
        });
        res.status(200).json({
          status: 200,
          message: "Login successful",
          data: { id: user.id, username: user.username, token: token },
        });
      } else {
        console.log("NOOOO");
        res.status(401).json({ status: 401, error: "Password does not match" });
      }
    } catch (error) {
      console.error(error);
    }
  }
}
