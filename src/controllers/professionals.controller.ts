import type { Request, Response } from 'express';
import prisma from '../database/prisma.js';

const sendResponse = (res: Response, data: any, message: string, success = true, statusCode = 200) => {
  res.status(statusCode).json({ data, message, success });
};

const sendError = (res: Response, message: string, statusCode = 400) => {
  res.status(statusCode).json({ message, statusCode, success: false });
};

export const listProfessionals = async (req: Request, res: Response): Promise<any> => {
  try {
    const { city, state, speciality } = req.query;

    const professionals = await prisma.professional.findMany({
      where: {
        ...(city ? { city: { contains: String(city) } } : {}),
        ...(state ? { state: String(state) } : {}),
        ...(speciality ? { speciality: { contains: String(speciality) } } : {}),
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, avatarUrl: true } }
      },
      orderBy: { rating: 'desc' }
    });

    return sendResponse(res, { professionals }, 'Profissionais listados com sucesso.');
  } catch (error) {
    console.error(error);
    return sendError(res, 'Erro ao listar profissionais.', 500);
  }
};

export const getProfessional = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;

    const professional = await prisma.professional.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true, avatarUrl: true } }
      }
    });

    if (!professional) return sendError(res, 'Profissional não encontrado.', 404);

    return sendResponse(res, { professional }, 'Profissional encontrado.');
  } catch (error) {
    console.error(error);
    return sendError(res, 'Erro ao buscar profissional.', 500);
  }
};

export const getCalendar = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { date } = req.query;

    const professional = await prisma.professional.findUnique({
      where: { id },
      include: { user: { select: { fullName: true, avatarUrl: true } } }
    });

    if (!professional) return sendError(res, 'Profissional não encontrado.', 404);

    let dateFilter: any;
    if (date) {
      const targetDate = new Date(String(date));
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      dateFilter = { date: { gte: targetDate, lt: nextDay } };
    } else {
      dateFilter = { date: { gte: new Date() } };
    }

    const slots = await prisma.availableSlot.findMany({
      where: { professionalId: id, ...dateFilter },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
    });

    return sendResponse(res, { professional, slots }, 'Calendário carregado com sucesso.');
  } catch (error) {
    console.error(error);
    return sendError(res, 'Erro ao buscar calendário.', 500);
  }
};

export const addSlots = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const userId = (req as any).userId;
    const { slots } = req.body;

    const professional = await prisma.professional.findUnique({ where: { id } });
    if (!professional) return sendError(res, 'Profissional não encontrado.', 404);
    if (professional.userId !== userId) return sendError(res, 'Acesso negado.', 403);

    if (!Array.isArray(slots) || slots.length === 0) {
      return sendError(res, 'Informe ao menos um slot.');
    }

    const created = await prisma.availableSlot.createMany({
      data: slots.map((slot: { date: string; startTime: string; endTime: string }) => ({
        professionalId: id,
        date: new Date(slot.date),
        startTime: slot.startTime,
        endTime: slot.endTime,
        available: true
      }))
    });

    return sendResponse(res, { count: created.count }, 'Slots adicionados com sucesso.', true, 201);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Erro ao adicionar slots.', 500);
  }
};
