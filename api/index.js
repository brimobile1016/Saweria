import Saweria from './saweria';

export default async function handler(req, res) {
    const { email, password, username, text } = req.query;
    const sawer = new Saweria();

    try {
        // Login dengan email dan password
        await sawer.login(email, password);

        // Kirim pembayaran
        const paymentResponse = await sawer.sendPayment(`https://saweria.co/${username}`, 1000, text);
        res.status(200).json(paymentResponse);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
