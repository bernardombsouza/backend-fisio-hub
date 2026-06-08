import type { Request, Response } from 'express';
import prisma from '../database/prisma.js';

const sendResponse = (res: Response, data: any, message: string, success = true, statusCode = 200) => {
  res.status(statusCode).json({ data, message, success });
};

const sendError = (res: Response, message: string, statusCode = 400) => {
  res.status(statusCode).json({ message, statusCode, success: false });
};

// Utilitário: verifica se o usuário autenticado é dono do slot
async function ownsSlot(slotId: string, userId: string) {
  const slot = await prisma.availableSlot.findUnique({
    where: { id: slotId },
    include: { professional: { select: { userId: true } } }
  });
  return { slot, isOwner: slot?.professional.userId === userId };
}

// GET /api/available-slots?professionalId=&date=&available=
export const listSlots = async (req: Request, res: Response): Promise<any> => {
  try {
    const { professionalId, date, available } = req.query;

    let dateFilter: any = {};
    if (date) {
      const targetDate = new Date(String(date));
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      dateFilter = { date: { gte: targetDate, lt: nextDay } };
    }

    const slots = await prisma.availableSlot.findMany({
      where: {
        ...(professionalId ? { professionalId: String(professionalId) } : {}),
        ...(available !== undefined ? { available: available === 'true' } : {}),
        ...dateFilter
      },
      include: {
        professional: {
          select: { id: true, speciality: true, user: { select: { fullName: true, avatarUrl: true } } }
        }
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
    });

    return sendResponse(res, { slots }, 'Slots listados com sucesso.');
  } catch (error) {
    console.error(error);
    return sendError(res, 'Erro ao listar slots.', 500);
  }
};

// GET /api/available-slots/:id
export const getSlot = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;

    const slot = await prisma.availableSlot.findUnique({
      where: { id },
      include: {
        professional: {
          select: { id: true, speciality: true, consultPrice: true, user: { select: { fullName: true, avatarUrl: true } } }
        }
      }
    });

    if (!slot) return sendError(res, 'Slot não encontrado.', 404);

    return sendResponse(res, { slot }, 'Slot encontrado.');
  } catch (error) {
    console.error(error);
    return sendError(res, 'Erro ao buscar slot.', 500);
  }
};

// POST /api/available-slots  — cria um único slot
export const createSlot = async (req: Request, res: Response): Promise<any> => {
  try {
    console.log(req.body);
    const userId = req.body.userId;
    const { date, startTime, endTime } = req.body;

    if (!date || !startTime || !endTime) {
      return sendError(res, 'Informe date, startTime e endTime.');
    }

    const professional = await prisma.professional.findUnique({ where: { userId } });
    if (!professional) return sendError(res, 'Perfil profissional não encontrado.', 404);

    const slot = await prisma.availableSlot.create({
      data: {
        professionalId: professional.id,
        date: new Date(date),
        startTime,
        endTime,
        available: true
      }
    });

    return sendResponse(res, { slot }, 'Slot criado com sucesso.', true, 201);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Erro ao criar slot.', 500);
  }
};

// POST /api/available-slots/bulk  — cria múltiplos slots de uma vez
export const createManySlots = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).userId;
    const { slots } = req.body;

    if (!Array.isArray(slots) || slots.length === 0) {
      return sendError(res, 'Informe ao menos um slot.');
    }

    const professional = await prisma.professional.findUnique({ where: { userId } });
    if (!professional) return sendError(res, 'Perfil profissional não encontrado.', 404);

    const created = await prisma.availableSlot.createMany({
      data: slots.map((s: { date: string; startTime: string; endTime: string }) => ({
        professionalId: professional.id,
        date: new Date(s.date),
        startTime: s.startTime,
        endTime: s.endTime,
        available: true
      }))
    });

    return sendResponse(res, { count: created.count }, `${created.count} slot(s) criado(s) com sucesso.`, true, 201);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Erro ao criar slots.', 500);
  }
};

// PUT /api/available-slots/:id  — atualiza horário ou disponibilidade
export const updateSlot = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const userId = (req as any).userId;
    const { date, startTime, endTime, available } = req.body;

    const { slot, isOwner } = await ownsSlot(id, userId);
    if (!slot) return sendError(res, 'Slot não encontrado.', 404);
    if (!isOwner) return sendError(res, 'Acesso negado.', 403);

    if (slot.available === false && available !== true) {
      return sendError(res, 'Não é possível editar um slot já reservado.', 409);
    }

    const updated = await prisma.availableSlot.update({
      where: { id },
      data: {
        ...(date ? { date: new Date(date) } : {}),
        ...(startTime ? { startTime } : {}),
        ...(endTime ? { endTime } : {}),
        ...(available !== undefined ? { available: Boolean(available) } : {})
      }
    });

    return sendResponse(res, { slot: updated }, 'Slot atualizado com sucesso.');
  } catch (error) {
    console.error(error);
    return sendError(res, 'Erro ao atualizar slot.', 500);
  }
};

// DELETE /api/available-slots/:id
export const deleteSlot = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const userId = (req as any).userId;

    const { slot, isOwner } = await ownsSlot(id, userId);
    if (!slot) return sendError(res, 'Slot não encontrado.', 404);
    if (!isOwner) return sendError(res, 'Acesso negado.', 403);

    if (!slot.available) {
      return sendError(res, 'Não é possível excluir um slot já reservado.', 409);
    }

    await prisma.availableSlot.delete({ where: { id } });

    return sendResponse(res, null, 'Slot removido com sucesso.');
  } catch (error) {
    console.error(error);
    return sendError(res, 'Erro ao remover slot.', 500);
  }
};
