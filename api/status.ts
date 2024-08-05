import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const BASE_URL = "https://backend.saweria.co";

export default async (req: VercelRequest, res: VercelResponse) => {
    const { id } = req.query;

    try {
        const response = await axios.get(`${BASE_URL}/donations/qris/${id}`);
        res.status(200).json({
            id,
            done: response.data.data.qr_string === "" ? true : false,
            ...response.data,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
