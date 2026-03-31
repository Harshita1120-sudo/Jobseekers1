import jwt from "jsonwebtoken";

const generateToken = (res, userId, role) => {
  const token = jwt.sign({ 
    id: userId, 
    role: role
 },
     process.env.JWT_SECRET,
      {
    expiresIn: "30d", 
  });

  // (Optional) Cookie mein set karna security ke liye acha hota hai
  res.cookie("token", token, {
    httpOnly: true, // Frontend JS ise read nahi kar payegi (XSS protection)
    secure: process.env.NODE_ENV !== "development", 
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000, 
  });

  return token;
};

export default generateToken;