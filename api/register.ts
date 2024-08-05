import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const BASE_URL = "https://backend.saweria.co";

export default async (req: VercelRequest, res: VercelResponse) => {
    const { email } = req.body;

    try {
        const response = await axios.post(`${BASE_URL}/auth/register`, {
            email,
            currency: "IDR",
        }, {
            headers: { origin: "https://saweria.co" },
        });
        res.status(200).json({
            success: true,
            data: "Check Email On " + response.data.data.email,
            email: response.data.data.email,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            data: "Email Is Taken",
            email: email,
        });
    }
};
