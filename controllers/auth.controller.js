import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Required fields is missing' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword
      }
    });

    if (newUser) {
      res.status(201).json({ message: 'User created successfully' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Failed to create user' });
  }
};
export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: {
        username: username
      }
    });
    if (!user) {
      return res.status(401).json({ message: 'Invalid Credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid Credentials' });
    }

    const age = 1000 * 60 * 60 * 24 * 7;

    const token = jwt.sign({
      id: user.id,
      isAdmin: true
    }, process.env.JWT_SECRET_KEY,
      { expiresIn: age });

    const { password: userPassword, ...userInfo } = user;

    return res
      .cookie("token", token, {
        httpOnly: true,
        // secure:true,
        maxAge: age,
      })
      .status(200)
      .json(userInfo);

  } catch (error) {
    return res.status(500).json({ message: 'Failed to login' });
  }
};
export const logout = (req, res) => {
  return res.clearCookie("token").status(200).json({ message: "Logged out successfully" });
};