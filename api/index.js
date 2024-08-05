import axios from 'axios';
import cheerio from 'cheerio'; // Pastikan 'cheerio' di-install jika digunakan

class Saweria {
    constructor() {
        this.BASE_URL = "https://saweria.co";
        this.BACKEND = "https://backend.saweria.co";
        this.token = "";
        this.saweria = "";
    }

    async login(email, password) {
        try {
            const res = await axios.post(this.BACKEND + "/auth/login", {
                email,
                password,
            });
            this.setToken(res.headers.authorization);
            this.setSaweria(res.data.data.username);
            return {
                authorization: res.headers.authorization,
                ...res.data,
            };
        } catch (e) {
            throw new Error("Incorrect Email Or Password");
        }
    }

    async register(email) {
        try {
            const res = await axios.post(this.BACKEND + "/auth/register", {
                email,
                currency: "IDR",
            }, {
                headers: {
                    origin: this.BASE_URL,
                },
            });
            return {
                success: true,
                data: "Check Email On " + res.data.data.email,
                email: res.data.data.email,
            };
        } catch (e) {
            throw new Error("Email Is Taken");
        }
    }

    async getUser() {
        if (!this.token) throw new Error("Please login first or setup token manually");
        try {
            const res = await axios.get(this.BACKEND + "/users", {
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

    async getSaweria(url) {
        if (!/saweria\.co\/\w+/gi.test(url)) throw new Error("Invalid URL");
        try {
            const html = await axios
                .get(url)
                .then((v) => v.data)
                .then((v) => cheerio.load(v)("script#__NEXT_DATA__").text().trim())
                .then((v) => JSON.parse(v))
                .then((v) => v.props.pageProps.data);
            return html;
        } catch (e) {
            throw e;
        }
    }

    async setToken(token) {
        this.token = token;
    }

    async setSaweria(username) {
        this.saweria = "https://saweria.co/" + username;
    }

    async createPayment(amount = 1000, message = "hi", token = this.token) {
        if (!this.token) throw new Error("Login Required");
        if (amount < 1000) throw new Error("Invalid Amount Of Money, Enter More Or Equal To 1000 RP");
        try {
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
        } catch (e) {
            throw e;
        }
    }

    async sendPayment(url, amount = 1000, message = "hi") {
        try {
            const pay = await this.getSaweria(url);
            return await this.createPayment(amount, message, pay.id);
        } catch (e) {
            throw e;
        }
    }

    async status(id) {
        try {
            const data = await axios
                .get(this.BACKEND + "/donations/qris/" + id)
                .then((v) => v.data);
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

export default async function handler(req, res) {
    const { email, password, username, text } = req.query;

    const sawer = new Saweria();

    try {
        await sawer.login(email, password);
        const paymentResponse = await sawer.sendPayment(`https://saweria.co/${username}`, 1000, text);
        res.status(200).json(paymentResponse);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
