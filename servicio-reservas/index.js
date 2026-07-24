import express from 'express';
import axios from 'axios';
import CircuitBreaker from 'opossum';
import axiosRetry from 'axios-retry';

const app = express();
app.use(express.json());

const PAGOS_URL = process.env.PAGOS_URL || 'http://pagos-svc:80';
const INVENTARIO_URL = process.env.INVENTARIO_URL || 'http://inventario-svc:80';
const NOTIFICACIONES_URL = process.env.NOTIFICACIONES_URL || 'http://notificaciones-svc:80';

// 1. REINTENTOS PARA INVENTARIO
axiosRetry(axios, { 
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => error.response && error.response.status >= 500,
    onRetry: (retryCount) => console.warn(`🔄 Reintento #${retryCount} hacia el inventario...`)
});

// 2. CIRCUIT BREAKER PARA PAGOS
const realizarPago = async (monto) => {
    const respuesta = await axios.post(`${PAGOS_URL}/pagar`, { monto });
    return respuesta.data;
};
const breaker = new CircuitBreaker(realizarPago, { timeout: 2000, errorThresholdPercentage: 50, resetTimeout: 10000 });
breaker.fallback(() => ({ status: "fallo_controlado", message: "Cobro pendiente." }));

// 3. FIRE-AND-FORGET PARA NOTIFICACIONES
const dispararNotificacion = (asiento) => {
    // Fíjate que NO usamos "await" aquí. Lo lanzamos en segundo plano.
    axios.post(`${NOTIFICACIONES_URL}/enviar`, { asiento })
        .then(() => console.log("📧 Confirmación: Correo procesado en segundo plano."))
        .catch(err => console.error("⚠️ Fallo no crítico (ignorado): El correo no salió.", err.message));
};

// --- ORQUESTADOR ---
app.post('/reservar', async (req, res) => {
    try {
        console.log(`\n--- Nueva solicitud de reserva para: ${req.body.asiento} ---`);
        
        const respInventario = await axios.post(`${INVENTARIO_URL}/descontar`, { asiento: req.body.asiento });
        const detallePago = await breaker.fire(100);
        
        // Disparamos la notificación de forma asíncrona y no esperamos a que termine
        dispararNotificacion(req.body.asiento);
        
        res.json({ 
            status: "Reserva procesada exitosamente", 
            inventario: respInventario.data,
            pago: detallePago 
        });
    } catch (error) {
        console.error("❌ Error irrecuperable en la orquestación:", error.message);
        res.status(500).json({ error: "Fallo masivo en la reserva" });
    }
});

app.listen(3000, () => console.log('Servicio de Reservas blindado (CB + Retries + Fire&Forget) en puerto 3000'));