import { GoogleGenAI } from '@google/genai';
// di terminal jalankan npm install dotenv
import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// const interaction = await ai.interactions.create({
//   model: model,
//   input: 'what is the capital of indonesia?',
// });
// console.log(interaction.output_text);
const model = process.env.MODEL;
const key = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({
    apiKey: key,
});

const app = express();
const upload = multer();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDir = path.resolve(__dirname, '../client');

const port = 3000;
const floristSignals = [
    'bunga', 'buket', 'bouquet', 'mawar', 'tulip', 'anggrek',
    'wisuda', 'ulang tahun', 'anniversary', 'pernikahan', 'duka',
    'romantis', 'hadiah', 'kartu ucapan', 'warna', 'budget', 'florist',
    'ibu', 'mama', 'pacar', 'pasangan', 'elegan', 'soft', 'formal', 'dekorasi',
];
const unrelatedSignals = [
    'coding', 'javascript', 'nodejs', 'bug', 'matematika', 'hitung',
    'politik', 'presiden', 'berita', 'bola', 'pertandingan', 'cuaca',
    'saham', 'crypto',
];
const floristRedirectMessage =
    'Maaf, aku khusus membantu seputar bunga, buket, rekomendasi hadiah, dan layanan Bunga Cerita. Kalau mau, aku bisa bantu pilih buket berdasarkan acara, budget, warna, atau penerima.';

app.use(
    cors({
        origin: 'http://localhost:5500',
    }),
);
app.use(express.json());
app.use(express.static(clientDir));

app.get('/', (req, res) => {
    res.sendFile(path.join(clientDir, 'index.html'));
});

app.post('/generate-text', async (req, res) => {
    try {
        const { prompt } = req.body;
        console.log(prompt, '<<prompt');
        console.log(key, '<<key');

        const response = await ai.interactions.create({
            model: model,
            input: prompt,
        });

        res.status(200).json({
            output: response.output_text,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating text');
    }
});

app.post(
    '/generate-from-image',
    upload.single('image'),
    async (req, res) => {
        try {
            const { prompt } = req.body;
            const fileBase64 = req.file.buffer.toString('base64');

            const response = await ai.models.generateContent({
                model: model,
                contents: [
                    {
                        text: prompt,
                        type: 'text',
                    },
                    {
                        inlineData: {
                            data: fileBase64,
                            mimeType: req.file.mimetype,
                        },
                    },
                ],
            });

            res.status(200).json({
                output: response.text,
            });
        } catch (error) {
            console.error(error);
            res.status(500).send('Error generating text');
        }
    },
);

app.post(
    '/generate-from-image',
    upload.single('image'),
    async (req, res) => {
        try {
            const { prompt } = req.body;
            const fileBase64 = req.file.buffer.toString('base64');

            const response = await ai.models.generateContent({
                model: model,
                contents: [
                    {
                        text: prompt,
                        type: 'text',
                    },
                    {
                        inlineData: {
                            data: fileBase64,
                            mimeType: req.file.mimetype,
                        },
                    },
                ],
            });

            res.status(200).json({
                output: response.text,
            });
        } catch (error) {
            console.error(error);
            res.status(500).send('Error generating text');
        }
    },
);

app.post(
    '/generate-from-document',
    upload.single('file'),
    async (req, res) => {
        try {
            const { prompt } = req.body;
            const fileBase64 = req.file.buffer.toString('base64');

            const response = await ai.models.generateContent({
                model: model,
                contents: [
                    {
                        text: prompt,
                        type: 'text',
                    },
                    {
                        inlineData: {
                            data: fileBase64,
                            mimeType: req.file.mimetype,
                        },
                    },
                ],
            });

            res.status(200).json({
                output: response.text,
            });
        } catch (error) {
            console.error(error);
            res.status(500).send('Error generating text');
        }
    },
);

app.post(
    '/generate-from-audio',
    upload.single('audio'),
    async (req, res) => {
        try {
            const { prompt } = req.body;
            const fileBase64 = req.file.buffer.toString('base64');

            const response = await ai.models.generateContent({
                model: model,
                contents: [
                    {
                        text: prompt,
                        type: 'text',
                    },
                    {
                        inlineData: {
                            data: fileBase64,
                            mimeType: req.file.mimetype,
                        },
                    },
                ],
            });

            res.status(200).json({
                output: response.text,
            });
        } catch (error) {
            console.error(error);
            res.status(500).send('Error generating text');
        }
    },
);

app.post('/api/chat', async (req, res) => {
    try {
        const { conversation } = req.body;

        if (!Array.isArray(conversation)) throw new Error('Messages must be an array!');

        const latestUserMessage = [...conversation]
            .reverse()
            .find((message) => message.role === 'user')?.text?.toLowerCase() || '';

        const hasFloristSignal = floristSignals.some((keyword) =>
            latestUserMessage.includes(keyword),
        );
        const hasUnrelatedSignal = unrelatedSignals.some((keyword) =>
            latestUserMessage.includes(keyword),
        );

        if (!hasFloristSignal && hasUnrelatedSignal) {
            return res.status(200).json({ result: floristRedirectMessage });
        }

        const contents = conversation.map(({ role, text }) => ({
            role,
            parts: [{ text }],
        }));

        const response = await ai.models.generateContent({
            model: model,
            contents,
            config: {
                temperature: 0.4,
                topP: 0.9,
                topK: 20,
                systemInstruction: `
Kamu adalah Asisten Bunga Cerita, chatbot florist untuk membantu pelanggan memilih buket dan hadiah bunga.

Tugasmu hanya membantu hal-hal yang berkaitan dengan:
- rekomendasi buket
- jenis dan makna bunga
- warna bunga
- acara atau momen pemberian bunga
- budget
- ide kartu ucapan
- gaya rangkaian
- bantuan sederhana terkait layanan florist Bunga Cerita

Aturan:
- Jawab hanya dalam bahasa Indonesia.
- Tetap fokus pada topik florist dan bunga.
- Jika pengguna bertanya di luar topik tersebut, tolak dengan sopan.
- Arahkan kembali pengguna ke topik yang relevan, misalnya rekomendasi buket berdasarkan acara, budget, warna favorit, atau penerima.
- Jangan menjawab pertanyaan umum di luar domain florist, seperti matematika, politik, coding, berita, atau trivia umum.
                `,
            },
        });

        res.status(200).json({ result: response.text });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// app.post('/api/chat', async (req, res) => {
//     try {
//         const { conversation } = req.body;

//         if (!conversation || !Array.isArray(conversation)) {
//             return res.status(400).json({
//                 error: 'conversation must be an array',
//             });
//         }

//         const contents = conversation.map((message) => ({
//             role: message.role,
//             parts: [{ text: message.text }],
//         }));

//         const response = await ai.models.generateContent({
//             model,
//             contents,
//         });

//         res.status(200).json({
//             reply: response.text,
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             error: error.message,
//         });
//     }
// });

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
