import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import matchRoutes from './routes/match.js';
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/match', matchRoutes);


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
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.PROD === 'true' ? 'One (Testnet)' : 'Localhost (Hardhat)'}`);
});
