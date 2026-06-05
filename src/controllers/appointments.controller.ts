import type { Request, Response } from 'express';
import prisma from '../database/prisma.js';

const sendResponse = (res: Response, data: any, message: string, success = true, statusCode = 200) => {
  res.status(statusCode).json({ data, message, success });
};

const sendError = (res: Response, message: string, statusCode = 400) => {
  res.status(statusCode).json({ message, statusCode, success: false });
};

export const bookAppointment = async (req: Request, res: Response): Promise<any> => {
  try {
    const { slotId, notes } = req.body;
    const patientId = (req as any).userId;

    const slot = await prisma.availableSlot.findUnique({ where: { id: slotId } });
    if (!slot) return sendError(res, 'Slot não encontrado.', 404);
    if (!slot.available) return sendError(res, 'Este horário já está ocupado.', 409);

    const professional = await prisma.professional.findUnique({
      where: { id: slot.professionalId },
      include: { user: { select: { fullName: true } } }
    });
    if (!professional) return sendError(res, 'Profissional não encontrado.', 404);

    const patient = await prisma.user.findUnique({ where: { id: patientId } });
    if (!patient) return sendError(res, 'Paciente não encontrado.', 404);
    if (patient.role !== 'PATIENT') return sendError(res, 'Apenas pacientes podem marcar consultas.', 403);

    const dateStr = slot.date.toISOString().split('T')[0];
    const startTime = new Date(`${dateStr}T${slot.startTime}:00`);
    const endTime = new Date(`${dateStr}T${slot.endTime}:00`);
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / 60000;
    const platformFee = Number((professional.consultPrice * 0.1).toFixed(2));
    const totalAmount = Number((professional.consultPrice + platformFee).toFixed(2));

    const [appointment] = await prisma.$transaction([
      prisma.appointment.create({
        data: {
          patientId,
          physioId: slot.professionalId,
          physioName: professional.user.fullName,
          physioSpecialty: professional.speciality,
          startTime,
          endTime,
          durationMinutes,
          consultPrice: professional.consultPrice,
          platformFee,
          totalAmount,
          status: 'PENDING_PAYMENT',
          notes: notes ?? null
        }
      }),
      prisma.availableSlot.update({
        where: { id: slotId },
        data: { available: false }
      })
    ]);

    return sendResponse(res, { appointment }, 'Consulta marcada com sucesso!', true, 201);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Erro ao marcar consulta.', 500);
  }
};

export const listMyAppointments = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return sendError(res, 'Usuário não encontrado.', 404);

    let appointments;

    if (user.role === 'PATIENT') {
      appointments = await prisma.appointment.findMany({
        where: { patientId: userId },
        include: { payment: true },
        orderBy: { startTime: 'asc' }
      });
    } else {
      const professional = await prisma.professional.findUnique({ where: { userId } });
      if (!professional) return sendError(res, 'Perfil profissional não encontrado.', 404);
      appointments = await prisma.appointment.findMany({
        where: { physioId: professional.id },
        include: {
          patient: { select: { fullName: true, email: true, avatarUrl: true } },
          payment: true
        },
        orderBy: { startTime: 'asc' }
      });
    }

    return sendResponse(res, { appointments }, 'Consultas listadas com sucesso.');
  } catch (error) {
    console.error(error);
    return sendError(res, 'Erro ao listar consultas.', 500);
  }
};
