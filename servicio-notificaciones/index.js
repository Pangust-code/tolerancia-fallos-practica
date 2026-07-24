import express from 'express';

const app = express();
app.use(express.json());

app.post('/enviar', (req, res) => {
    console.log(`[Notificaciones] Preparando correo para asiento ${req.body.asiento}...`);
    
    // Simulamos un retraso horrible del servidor de correos (8 segundos)
    setTimeout(() => {
        console.log(`[Notificaciones] ✅ Correo enviado con éxito.`);
        res.json({ status: "ok", message: "Correo enviado" });
    }, 8000);
});

app.listen(3000, () => console.log('Servicio de Notificaciones en puerto 3000'));