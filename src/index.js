const express = require('express');
const client = require('prom-client');

// Opprett et register for å samle metrikker
const register = new client.Registry();

// Legg til en standard-label (appnavn) på alle metrikker
register.setDefaultLabels({
   app: 'vardr-api'
});

// Aktiver innsamling av standard metrikker (CPU-bruk, minne, etc.)
client.collectDefaultMetrics({ register });

// Lag en egendefinert teller-metrikk
const httpRequestCounter = new client.Counter({
   name: 'http_requests_total',
   help: 'Total number of HTTP requests',
   labelNames: ['method', 'route', 'status_code']
});

// Registrer den egendefinerte metrikken
register.registerMetric(httpRequestCounter);

// Les konfigurasjon fra miljøvariabler
const PORT = process.env.PORT || 3000;
const PG_HOST = process.env.PG_HOST || 'Not Configured';
const INFLUX_URL = process.env.INFLUX_URL || 'Not Configured';

const app = express();

// Middleware for å telle alle innkommende forespørsler
app.use((req, res, next) => {
   res.on('finish', () => {
     // Øk telleren med relevante labels
    httpRequestCounter.inc({
       method: req.method,
       route: req.path,
       status_code: res.statusCode
     });
   });
   next();
});

// Hovedruten for applikasjonen
app.get('/', (req, res) => {
   res.writeHead(200, { 'Content-Type': 'text/plain' });
   res.end(
     `Hello from odd from the Observable VARDR-API!\n\n` +
     `DATABASE_CONFIG:\n` +
     `PostgreSQL Host: ${PG_HOST}\n` +
     `InfluxDB URL: ${INFLUX_URL}\n`
  );
});

// Endepunktet som eksponerer metrikkene for Prometheus
app.get('/metrics', async (req, res) => {
   try {
     res.set('Content-Type', register.contentType);
     res.end(await register.metrics());
   } catch (ex) {
     res.status(500).end(ex);
   }
});

app.listen(PORT, () => {
   console.log(`Server running on port ${PORT}`);
   console.log(`Connecting to PostgreSQL at: ${PG_HOST}`);
   console.log(`Connecting to InfluxDB at: ${INFLUX_URL}`);
});
