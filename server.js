import express from 'express';
import bodyParser from 'body-parser';
import { Saweria } from './api/index.js'; // Import Saweria class

const app = express();
const port = 3000;

app.use(bodyParser.json());

app.get('/send-payment', async (req, res) => {
    const { email, password, username, text } = req.query;

    const sawer = new Saweria();

    try {
        await sawer.login(email, password);
        const paymentResponse = await sawer.sendPayment(`https://saweria.co/${username}`, 1000, text);
        res.status(200).json(paymentResponse);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
