import express from 'express';

const app = express();
app.use(express.json());

app.post('/descontar', (req, res) => {
    const probabilidad = Math.random();
    
    if (probabilidad < 0.4) {
        console.error("💥 Falla crítica simulada en el Inventario (HTTP 503)");
        return res.status(503).json({ error: "Service Unavailable" });
    }
    
    console.log(`✅ Asiento ${req.body.asiento} descontado exitosamente.`);
    res.json({ status: "ok", message: "Asiento reservado en inventario" });
});

app.listen(3000, () => console.log('Inventario en puerto 3000'));