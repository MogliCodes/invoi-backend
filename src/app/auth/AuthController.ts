import { Request, Response } from "express";
import jwt from "jsonwebtoken";

const jwtSecret = "your-secret-key";
const users = [
  { id: "1", username: "user1", password: "password1" },
  { id: "2", username: "user2", password: "password2" },
];

export default class AuthController {
  public async login(req: Request, res: Response) {
    console.log(req.body);
    const { username, password } = req.body;

    // Find the user in the users array (Replace this with a database query in a real application)
    const user = users.find(
      (u) => u.username === username && u.password === password,
    );

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      jwtSecret,
      {
        expiresIn: "1h", // Set an expiration time for the token (e.g., 1 hour)
      },
    );

    res.json({ token });
  }
}
