import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const BASE_URL = "https://backend.saweria.co";

export default async (req: VercelRequest, res: VercelResponse) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(400).json({ error: "Please login first or setup token manually" });
    }

    try {
        const response = await axios.get(`${BASE_URL}/users`, {
            headers: {
                Authorization: token,
                origin: "https://saweria.co",
            },
        });
        res.status(200).json(response.data.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
