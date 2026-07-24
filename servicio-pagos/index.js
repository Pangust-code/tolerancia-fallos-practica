import express from 'express';

const app = express();
app.use(express.json());

app.post('/pagar', (req, res) => {
    const probabilidad = Math.random();
    console.log("Recibida petición de pago...");

    if (probabilidad < 0.3) {
        console.error("Fallo inyectado: 500");
        return res.status(500).json({ error: "Internal Server Error - Pasarela caída" });
    } else if (probabilidad < 0.6) {
        console.warn("Fallo inyectado: Latencia de 5s");
        setTimeout(() => {
            res.json({ status: "ok", message: "Pago procesado con retraso" });
        }, 5000);
    } else {
        res.json({ status: "ok", message: "Pago procesado exitosamente" });
    }
});

app.listen(3000, () => console.log('Pagos en puerto 3000'));