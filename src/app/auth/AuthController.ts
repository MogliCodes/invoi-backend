import { Request, Response } from "express";
import bcrypt from "bcrypt";
import UserModel from "../../domain/User/UserModel.ts";
import jwt from "jsonwebtoken";
const jwtSecret = "your-secret-key";

export default class AuthController {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async register(req: Request, res: Response) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { username, email, password } = req.body;

    try {
      const userExists = await UserModel.findOne()
        .where("username")
        .equals(username);

      console.log("userExists", userExists);

      if (userExists) {
        res.status(409).json({
          error: "User already exists",
          message:
            "The provided email address is already registered. Please use a different email or try logging in.",
        });
      } else {
        const newUser = await UserModel.create({ username, email, password });
        res.status(201).json({ newUser });
      }
    } catch (error) {
      console.error(error);
    }
  }
  public async login(req: Request, res: Response) {
    console.log(req.body);
    const { username, password } = req.body;
    const saltRounds = 10;

    const user = await UserModel.findOne().where("username").equals(username);
    if (!user) throw Error("No user found");

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const isPasswordMatch = await bcrypt.compare(
      hashedPassword,
      user?.password || "",
    );

    let token;
    if (isPasswordMatch) {
      console.log("MATCH");
      // Generate a JWT token
      token = jwt.sign({ id: user.id, username: user.username }, jwtSecret, {
        expiresIn: "30d",
      });
      res.status(200).json({ token });
    } else {
      console.log("NOOOO");
    }

    res.status(200).json({ user });
    //
  }
}
