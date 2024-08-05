import Saweria from './saweria';

export default async function handler(req, res) {
    const { email } = req.query;
    const sawer = new Saweria();

    try {
        const registerResponse = await sawer.register(email);
        res.status(200).json(registerResponse);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
