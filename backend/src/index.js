import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import matchRoutes from './routes/match.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/match', matchRoutes);

app.get('/', (req, res) => {
    res.send('BluffBid Arena Backend Running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.PROD === 'true' ? 'One (Testnet)' : 'Localhost (Hardhat)'}`);
});
