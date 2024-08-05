import express, { Request, Response } from 'express';
import axios from 'axios';
import cheerio from 'cheerio';

const app = express();
const port = 3000;

class Saweria {
    private BASE_URL: string;
    private BACKEND: string;
    private token: string;
    private saweria: string;

    constructor() {
        this.BASE_URL = "https://saweria.co";
        this.BACKEND = "https://backend.saweria.co";
        this.token = "";
        this.saweria = "";
    }

    async login(email: string, password: string): Promise<any> {
    try {
        const res = await axios.post(this.BACKEND + "/auth/login", 
            { email, password },
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Content-Type': 'application/json',
                    'Connection': 'keep-alive'
                }
            }
        );
        console.log('Login Response:', res.data); // Tambahkan ini
        this.setToken(res.headers.authorization);
        this.setSaweria(res.data.data.username);
        return {
            authorization: res.headers.authorization,
            ...res.data,
        };
    } catch (e) {
        console.error('Login Error:', e); // Tambahkan ini
        throw new Error("Incorrect Email Or Password");
    }
}

    async getUser(): Promise<any> {
        if (!this.token) throw new Error("Please login first or setup token manually");
        const res = await axios.get(this.BACKEND + "/users", {
            headers: {
                Authorization: this.token,
                origin: this.BASE_URL,
            },
        });
        return res.data.data;
    }

    async getSaweria(url: string): Promise<any> {
        if (!/saweria\.co\/\w+/gi.test(url)) throw new Error("Invalid URL");
        const html = await axios.get(url)
            .then(v => cheerio.load(v.data)("script#__NEXT_DATA__").text().trim())
            .then(v => JSON.parse(v))
            .then(v => v.props.pageProps.data);
        return html;
    }

    async createPayment(amount: number = 1000, message: string = "hi", token: string = this.token): Promise<any> {
        if (!this.token) throw new Error("Login Required");
        if (amount < 1000) throw new Error("Invalid Amount Of Money, Enter More Or Equal To 1000 RP");
        const user = await this.getUser();
        const res = await axios.post(this.BACKEND + "/donations/" + user.id, {
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
                origin: this.BASE_URL,
                Authorization: this.token,
                "Content-Type": "application/json",
            },
        });
        return {
            link: this.BASE_URL + "/qris/" + res.data.data.id,
            ...res.data,
        };
    }

    async sendPayment(url: string, amount: number = 1000, message: string = "hi"): Promise<any> {
        const pay = await this.getSaweria(url);
        return this.createPayment(amount, message, pay.id);
    }

    async status(id: string): Promise<any> {
        const data = await axios.get(this.BACKEND + "/donations/qris/" + id).then(v => v.data);
        return {
            id,
            done: data.data.qr_string === "" ? true : false,
            ...data,
        };
    }

    // Metode baru untuk mendapatkan status pembayaran
    async getPaymentStatus(id: string): Promise<any> {
        try {
            const data = await axios.get(this.BACKEND + "/donations/qris/" + id).then(v => v.data);
            return {
                id,
                status: data.data.qr_string === "" ? "Completed" : "Pending",
                ...data,
            };
        } catch (e) {
            throw new Error("Failed to retrieve payment status");
        }
    }

    private async setToken(token: string): Promise<void> {
        this.token = token;
    }

    private async setSaweria(username: string): Promise<void> {
        this.saweria = "https://saweria.co/" + username;
    }
}

const sawer = new Saweria();
// Rute untuk halaman utama
app.get('/', (req: Request, res: Response) => {
    res.send('Web Aktif');
});
app.get('/api', async (req: Request, res: Response) => {
    const { email, password, harga, text, username, paymentId } = req.query;

    // Debugging log
    console.log('Query Parameters:', req.query);

    try {
        if (email && password && username && harga && text) {
            await sawer.login(email as string, password as string);
            const paymentResponse = await sawer.sendPayment(`https://saweria.co/${username}`, Number(harga), text as string);
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send(JSON.stringify(paymentResponse, null, 2));
        } else if (paymentId) {
            const statusResponse = await sawer.getPaymentStatus(paymentId as string);
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send(JSON.stringify(statusResponse, null, 2));
        } else {
            res.status(400).json({ error: "Missing required query parameters" });
        }
    } catch (e) {
        // Ensure 'e' is of type 'Error' before calling 'toString()'
        // Logging tambahan untuk membantu debugging
    console.error('Error details:', e);
        if (e instanceof Error) {
            res.status(500).json({ error: e.toString() });
        } else {
            res.status(500).json({ error: 'Unknown error occurred' });
        }
    }
});

export default app;
