import { Server } from 'node:net';
import { auth } from './routes/index'
import express,{ Request, Response, NextFunction } from 'express';
import cors from 'cors';

const server = express();

const allowedOrigins = ['http://localhost:5174', 'https://seu-dominio.com.br'];

server.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Não permitido pelo CORS'));
    }
  }
}));

server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.disable('x-powered-by');
server.use((request, response, next) => {
  response.set({
    'Access-Control-Allow-Origin': '*'
  })
  next()
})
server.use('/public', express.static('public'));
server.use('/api/auth', auth.default);
server.use(async (request: Request, response: Response, next: NextFunction) => {
  next(response.status(400).json({ error: 'Router do not exists' }));
})

export default server