import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const BASE_URL = "https://backend.saweria.co";

export default async (req: VercelRequest, res: VercelResponse) => {
    const { email, password } = req.body;

    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, { email, password });
        res.status(200).json({
            authorization: response.headers.authorization,
            ...response.data,
        });
    } catch (error) {
        res.status(400).json({ error: "Incorrect Email Or Password" });
    }
};
