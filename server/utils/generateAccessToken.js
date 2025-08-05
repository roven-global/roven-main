const jwt = require("jsonwebtoken");

const generateAccessToken = async (userId) => {
  return (token = await jwt.sign(
    { id: userId },
    process.env.SECRET_KEY_ACCESS_TOKEN,
    { expiresIn: "5h" }
  ));
};

module.exports = generateAccessToken;

