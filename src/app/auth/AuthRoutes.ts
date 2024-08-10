import { Router } from "express";
import AuthController from "./AuthController.ts";
import jwt from "jsonwebtoken";
import { consola } from "consola";
import passport from "passport";

const authController = new AuthController();
const router: Router = Router();

router.post("/register", authController.register);

// Middleware to authenticate the user and generate a token
router.post("/login", passport.authenticate("local"), (req, res) => {
  const user: any = req.user;
  const token = jwt.sign(
    { id: user.id, username: user.username },
    "your-secret-key",
    { expiresIn: "30d" },
  );
  res.status(200).json({
    status: 200,
    message: "Login successful",
    data: { id: user.id, username: user.username, token },
  });
});

router.post("/logout", (req, res) => {
  console.log("Logging out");
  req.logout((error) => {
    console.log("Logging out", error);
    if (error) {
      res.status(500).json({ status: 500, message: "Error logging out" });
    } else {
      res.status(200).json({ status: 200, message: "Logged out" });
    }
  });
});

router.get("/status", (req, res) => {
  consola.info("Checking authentication status");
  if (req.isAuthenticated()) {
    const user: any = req.user;
    res.json({
      authenticated: true,
      user: { username: user.username, email: user.email },
    });
  } else {
    res.json({ authenticated: false });
  }
});

export default router;
