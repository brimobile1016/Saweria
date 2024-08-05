import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import * as cheerio from 'cheerio';

class Saweria {
    private BASE_URL: string = "https://saweria.co";
    private BACKEND: string = "https://backend.saweria.co";
    private token: string = "";
    private saweria: string = "";

    async login(email: string, password: string): Promise<any> {
        try {
            const res = await axios.post(`${this.BACKEND}/auth/login`, {
                email,
                password,
            });
            this.setToken(res.headers.authorization || "");
            this.setSaweria(res.data.data.username);
            return {
                authorization: res.headers.authorization,
                ...res.data,
            };
        } catch (e) {
            throw new Error("Incorrect Email Or Password");
        }
    }

    async register(email: string): Promise<any> {
        try {
            const res = await axios.post(`${this.BACKEND}/auth/register`, {
                email,
                currency: "IDR",
            }, {
                headers: {
                    origin: this.BASE_URL,
                },
            });
            return {
                success: true,
                data: `Check Email On ${res.data.data.email}`,
                email: res.data.data.email,
            };
        } catch (e) {
            throw new Error("Email Is Taken");
        }
    }

    async getUser(): Promise<any> {
        if (!this.token) {
            throw new Error("Please login first or setup token manually");
        }
        try {
            const res = await axios.get(`${this.BACKEND}/users`, {
                headers: {
                    Authorization: this.token,
                    origin: this.BASE_URL,
                },
            });
            return res.data.data;
        } catch (e) {
            throw e;
        }
    }

    async getSaweria(url: string): Promise<any> {
        if (!/saweria\.co\/\w+/gi.test(url)) {
            throw new Error("Invalid URL");
        }
        try {
            const html = await axios
                .get(url)
                .then(v => v.data)
                .then(v => cheerio.load(v)("script#__NEXT_DATA__").text().trim())
                .then(v => JSON.parse(v))
                .then(v => v.props.pageProps.data);
            return html;
        } catch (e) {
            throw e;
        }
    }

    private async setToken(token: string): Promise<void> {
        this.token = token;
    }

    private async setSaweria(username: string): Promise<void> {
        this.saweria = `${this.BASE_URL}/${username}`;
    }

    async createPayment(amount: number = 1000, message: string = "hi", token: string = this.token): Promise<any> {
        if (!this.token) {
            throw new Error("Login Required");
        }
        if (amount < 1000) {
            throw new Error("Invalid Amount Of Money, Enter More Or Equal To 1000 RP");
        }
        try {
            const user = await this.getUser();
            const res = await axios.post(`${this.BACKEND}/donations/${user.id}`, {
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
                link: `${this.BASE_URL}/qris/${res.data.data.id}`,
                ...res.data,
            };
        } catch (e) {
            throw e;
        }
    }

    async sendPayment(url: string, amount: number = 1000, message: string = "hi"): Promise<any> {
        try {
            const pay = await this.getSaweria(url);
            return await this.createPayment(amount, message, pay.id);
        } catch (e) {
            throw e;
        }
    }

    async status(id: string): Promise<any> {
        try {
            const data = await axios
                .get(`${this.BACKEND}/donations/qris/${id}`)
                .then(v => v.data);
            return {
                id,
                done: data.data.qr_string === "" ? true : false,
                ...data,
            };
        } catch (e) {
            throw e;
        }
    }
}

export default async (req: VercelRequest, res: VercelResponse) => {
    const sawer = new Saweria();

    // Replace these with actual environment variables or request parameters
    const username = process.env.USERNAME || "your_username";
    const password = process.env.PASSWORD || "your_password";
    const nominal = Number(process.env.NOMINAL) || 1000;
    const text = process.env.TEXT || "hi";

    try {
        await sawer.login(username, password);
        const result = await sawer.sendPayment(`https://saweria.co/${username}`, nominal, text);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
