import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as { userId: string; role?: string };

    req.userId = decoded.userId;
    req.userRole = decoded.role;

    if (!req.userRole) {
      const user = await User.findById(decoded.userId).select("role");
      if (user) {
        req.userRole = user.role;
      }
    }

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

export const recruiterMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.userRole !== "recruiter" && req.userRole !== "admin") {
    return res.status(403).json({
      message: "Forbidden: Recruiter access required",
    });
  }
  next();
};

export default authMiddleware;