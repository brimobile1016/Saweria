import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const BASE_URL = "https://backend.saweria.co";

export default async (req: VercelRequest, res: VercelResponse) => {
    const { amount = 1000, message = "hi", token } = req.body;

    if (!token) {
        return res.status(400).json({ error: "Login Required" });
    }

    if (amount < 1000) {
        return res.status(400).json({ error: "Invalid Amount Of Money, Enter More Or Equal To 1000 RP" });
    }

    try {
        const userResponse = await axios.get(`${BASE_URL}/users`, {
            headers: {
                Authorization: token,
                origin: "https://saweria.co",
            },
        });

        const user = userResponse.data.data;

        const paymentResponse = await axios.post(`${BASE_URL}/donations/${user.id}`, {
            agree: true,
            amount,
            currency: "IDR",
            customer_info: {
                first_name: user.username,
                email: user.email,
                phone: "",
            },
            message,
            notUnderage: true,
            payment_type: "qris",
            vote: "",
        }, {
            headers: {
                origin: "https://saweria.co",
                Authorization: token,
                "Content-Type": "application/json",
            },
        });

        res.status(200).json({
            link: `https://saweria.co/qris/${paymentResponse.data.data.id}`,
            ...paymentResponse.data,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
