export default async function handler(req, res) {
    // 1. Permissões de Segurança e CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Responde rapidamente às checagens de segurança do navegador
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Apenas método POST é permitido' });
    }

    // ==========================================
    // 🔒 CHAVES SECRETAS (Invisíveis no GitHub)
    // Vamos configurar isso no painel da Vercel depois!
    // ==========================================
    const API_KEY = process.env.PARADISE_API_KEY; 
    const PRODUCT_HASH = process.env.PARADISE_PRODUCT_HASH; 

    // Bloqueia se você esquecer de colocar as chaves na Vercel
    if (!API_KEY || !PRODUCT_HASH) {
        console.error("ERRO: Chaves da API não configuradas nas Variáveis de Ambiente.");
        return res.status(500).json({ error: 'Erro de configuração do servidor.' });
    }

    try {
        const { amount, description, customer } = req.body;

        // Monta os dados para a operadora
        const payload = {
            amount: amount,
            description: description,
            reference: 'PEDIDO-' + Date.now(),
            productHash: PRODUCT_HASH,
            customer: {
                name: customer.name,
                email: customer.email,
                document: customer.document, // O index.html vai enviar aquele CPF que você escolheu
                phone: customer.phone
            }
        };

        // Faz o pedido PIX para a Paradise Pags
        const response = await fetch('https://multi.paradisepags.com/api/v1/transaction.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        // Se deu tudo certo, devolve o QR Code para o site
        if (response.ok && data && data.qr_code) {
            res.status(200).json(data);
        } else {
            console.error("Erro da Operadora:", data);
            res.status(400).json({ error: 'Falha ao gerar o PIX.' });
        }
    } catch (error) {
        console.error("Erro no servidor Vercel:", error);
        res.status(500).json({ error: 'Erro interno no servidor Vercel.' });
    }
}
