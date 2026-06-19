import jwt from "jsonwebtoken";

export const generateToken = (user, message, statusCode, res) => {
  const token = user.getJWTToken();

  res.status(statusCode).cookie("token", token).json({
    success: true,
    message,
    user,
    token,
  });
};