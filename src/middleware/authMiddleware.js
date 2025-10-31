import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  let token = req.headers["authorization"];

  if (!token || !token.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  token = token.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // add user payload to request
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};
