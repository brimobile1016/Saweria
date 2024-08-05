import Saweria from './saweria';

export default async function handler(req, res) {
    const { id } = req.query;
    const sawer = new Saweria();

    try {
        const statusResponse = await sawer.status(id);
        res.status(200).json(statusResponse);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
