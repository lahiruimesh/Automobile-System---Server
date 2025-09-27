import jwt from "jsonwebtoken";

export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};
