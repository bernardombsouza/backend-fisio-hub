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
    const { fullName, email, crefito, password, confirmPassword,speciality, location, city, state, consultPrice, slotDuration, bio, clinicName, tags, avatarUrl
     } = req.body;

    if (password !== confirmPassword) return sendError(res, 'As senhas não coincidem.');

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return sendError(res, 'Este email já está em uso.');

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        avatarUrl: avatarUrl ?? '',
        role: crefito ? "PHYSIO" : "PATIENT",
        professionalProfile: crefito ? {
          create: {
            crefito,
            speciality: speciality ?? '',
            location: location ?? '',
            city: city ?? '',
            state: state ?? '',
            lat: 0,
            lng: 0,
            distanceKm: 0,
            rating: 0,
            reviewCount: 0,
            consultPrice: consultPrice ?? 0,
            slotDuration: slotDuration ?? 0,
            bio: bio ?? '',
            clinicName: clinicName ?? '',
            experienceYears: 0,
            successRate: 0,
            totalPatients: 0,
            tags: tags ?? '',
            isVerified: false
          }
        } : undefined
      },
      select: { id: true, fullName: true, email: true, role: true, avatarUrl: true, createdAt: true, professionalProfile: true }
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

    const user = await prisma.user.findUnique({ where: { email }, include: { professionalProfile: true } });
    if (!user) return sendError(res, 'Credenciais inválidas.', 401);

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return sendError(res, 'Credenciais inválidas.', 401);

    const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    const { password: _, ...userWithoutPassword } = user;
    return sendResponse(res, { accessToken, refreshToken, user: userWithoutPassword }, 'Login efetuado com sucesso!');
  } catch (error) {
    return sendError(res, 'Erro interno ao realizar login.', 500);
  }
};

export const refresh = async (req: Request, res: Response): Promise<any> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return sendError(res, 'Refresh token ausente.', 401);

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored) return sendError(res, 'Refresh token inválido.', 401);

    if (stored.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { token: refreshToken } });
      return sendError(res, 'Refresh token expirado. Faça login novamente.', 401);
    }

    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as jwt.JwtPayload;
    const newAccessToken = jwt.sign({ userId: payload.userId }, JWT_SECRET, { expiresIn: '1h' });

    return sendResponse(res, { accessToken: newAccessToken }, 'Token renovado com sucesso.');
  } catch (error) {
    return sendError(res, 'Refresh token inválido.', 401);
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<any> => {
  return sendResponse(res, { message: 'Se o email existir, as instruções foram enviadas.' }, 'Instruções enviadas.');
};

export const logout = async (req: Request, res: Response): Promise<any> => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    return sendResponse(res, null, 'Logout realizado com sucesso.');
  } catch (error) {
    return sendError(res, 'Erro interno ao realizar logout.', 500);
  }
};