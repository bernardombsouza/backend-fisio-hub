import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../database/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super-refresh-secret';

// Helpers internos
const sendResponse = (res: Response, data: any, message: string, success = true, statusCode = 200) => {
  res.status(statusCode).json({ data, message, success });
};

const sendError = (res: Response, message: string, statusCode = 400) => {
  res.status(statusCode).json({ message, statusCode, success: false });
};

export const register = async (req: Request, res: Response): Promise<any> => {
  try {
    const { fullName, email, crefito, password, confirmPassword } = req.body;

    if (password !== confirmPassword) return sendError(res, 'As senhas não coincidem.');

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return sendError(res, 'Este email já está em uso.');

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        crefito,
        role: crefito ? "PHYSIO" : "PATIENT",
      },
      select: { id: true, fullName: true, email: true, role: true, crefito: true, avatarUrl: true, createdAt: true }
    });

    return sendResponse(res, { user }, 'Cadastro realizado com sucesso!', true, 201);
  } catch (error) {
    console.log(error)
    return sendError(res, 'Erro interno ao registrar usuário.', 500);
  }
};

export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return sendError(res, 'Credenciais inválidas.', 401);

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return sendError(res, 'Credenciais inválidas.', 401);

    const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    const { password: _, ...userWithoutPassword } = user;

    return sendResponse(res, { accessToken, refreshToken, user: userWithoutPassword }, 'Login efetuado com sucesso!');
  } catch (error) {
    return sendError(res, 'Erro interno ao realizar login.', 500);
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<any> => {
  return sendResponse(res, { message: 'Se o email existir, as instruções foram enviadas.' }, 'Instruções enviadas.');
};

export const logout = async (req: Request, res: Response): Promise<any> => {
  return sendResponse(res, null, 'Logout realizado com sucesso.');
};