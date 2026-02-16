import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import matchRoutes from './routes/match.js';
import analyticsRoutes from './routes/analytics.js';
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: [
    'https://bluffbid.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'https://staging.dguu3snce7cd.amplifyapp.com'g
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json());

app.use('/api/match', matchRoutes);
app.use('/api/analytics', analyticsRoutes);


// Swagger setup
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'My API',
      version: '1.0.0',
      description: 'API documentation',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
      },
    ],
  },
  apis: ['./src/routes/*.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.get('/', (req, res) => {
  res.send('BluffBid Arena Backend Running');
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  const isProd = process.env.PROD?.toLowerCase().trim() === 'true';
  console.log(`Environment: ${isProd ? 'Monad Testnet (PROD)' : 'Localhost (Hardhat)'}`);
  if (isProd) {
    console.log(`   RPC: ${process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'}`);
    console.log(`   Contract: ${process.env.CONTRACT_ADDRESS || 'NOT SET'}`);
  }
  console.log('');
});
