import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { graphqlRouter } from './routes/graphql.js';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
const REST_API_URL = process.env.REST_API_URL || 'http://localhost:3001';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Middleware específico para login
app.use('/users/login', async (req, res) => {
  try {
    console.log('Gateway - Login Request:', {
      method: req.method,
      body: req.body,
      headers: req.headers,
      url: `${REST_API_URL}/users/login`
    });

    // Validar que el body tenga los campos necesarios
    if (!req.body.email || !req.body.password) {
      console.error('Gateway - Login Error: Campos faltantes');
      return res.status(400).json({ error: 'Email y password son requeridos' });
    }

    const response = await axios({
      method: 'POST',
      url: `${REST_API_URL}/users/login`,
      data: {
        email: req.body.email,
        password: req.body.password
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000, // Aumentamos el timeout a 10 segundos
      validateStatus: function (status) {
        return status >= 200 && status < 500; // Aceptar cualquier status entre 200 y 499
      }
    });

    console.log('Gateway - Login Response:', {
      status: response.status,
      data: response.data,
      headers: response.headers
    });

    // Enviar la respuesta exactamente como la recibimos del backend
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Gateway - Login Error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack
    });

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: 'El servicio de autenticación no está disponible' });
    }

    if (error.code === 'ETIMEDOUT') {
      return res.status(504).json({ error: 'Tiempo de espera agotado' });
    }

    res.status(error.response?.status || 500).json(
      error.response?.data || { error: 'Error en el gateway de autenticación' }
    );
  }
});

// Middleware específico para perfiles
app.use('/profiles', async (req, res, next) => {
  try {
    console.log('Gateway - Profile Request:', {
      method: req.method,
      originalUrl: req.originalUrl,
      body: req.body,
      headers: req.headers,
      path: req.path
    });

    const targetUrl = `${REST_API_URL}/profiles${req.path === '/' ? '' : req.path}`;
    console.log('Gateway - Target URL:', targetUrl);

    const config = {
      method: req.method,
      url: targetUrl,
      headers: {
        ...req.headers,
        host: new URL(REST_API_URL).host
      },
      timeout: 5000 // 5 segundos de timeout
    };

    if (req.headers['content-type']?.includes('multipart/form-data')) {
      const formData = new FormData();
      for (const [key, value] of Object.entries(req.body)) {
        formData.append(key, value);
      }
      config.data = formData;
      config.headers['Content-Type'] = 'multipart/form-data';
    } else if (req.method !== 'GET') {
      config.data = req.body;
    }

    const response = await axios(config);
    console.log('Gateway - Profile Response:', {
      status: response.status,
      data: response.data
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Gateway - Profile Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Error en el gateway' });
  }
});

// Configuración del proxy para otras rutas
const restProxy = createProxyMiddleware({
  target: REST_API_URL,
  changeOrigin: true,
  secure: false,
  pathRewrite: {
    '^/users': '/users',
    '^/api': '/api'
  },
  proxyTimeout: 5000, // 5 segundos de timeout
  onProxyReq: (proxyReq, req, res) => {
    console.log('Gateway - Proxy Request:', {
      method: req.method,
      originalUrl: req.originalUrl,
      target: `${REST_API_URL}${req.url}`,
      query: req.query,
      body: req.body,
      headers: req.headers
    });
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('Gateway - Proxy Response:', {
      statusCode: proxyRes.statusCode,
      headers: proxyRes.headers
    });
  },
  onError: (err, req, res) => {
    console.error('Gateway - Proxy Error:', err);
    res.status(500).json({ error: 'Error en el proxy' });
  }
});

// Routes
app.use('/graphql', graphqlRouter);
app.use('/users', restProxy);
app.use('/api', restProxy);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
}); 