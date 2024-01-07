import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { consola } from "consola";

export const jwtSecret = "your-secret-key";
export const jwtExpiration = "1h";

interface User {
  id: string;
  username: string;
  password: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; username: string }; // Adjust the type according to your user object
    }
  }
}

export function generateToken(user: User): string {
  return jwt.sign(user, jwtSecret, { expiresIn: jwtExpiration });
}

export function verifyToken(token: string): User | null {
  try {
    return jwt.verify(token, jwtSecret) as User;
  } catch (error) {
    return null;
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ message: "Authentication token missing" });
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ message: "Invalid token" });
  }
  req.user = user;
  next();
}
