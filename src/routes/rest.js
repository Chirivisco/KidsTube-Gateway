import express from 'express';
import axios from 'axios';
import { URL } from 'url';

const router = express.Router();

// URL del servicio REST
const REST_API_URL = process.env.REST_API_URL || 'http://localhost:3001';

// Middleware para redirigir peticiones REST
router.use(async (req, res) => {
  try {
    // Parsear la URL original para obtener los query parameters
    const originalUrl = new URL(req.originalUrl, `http://${req.headers.host}`);
    const queryString = originalUrl.search;
    
    // Construir la URL completa para la REST API
    const fullUrl = `${REST_API_URL}${req.path}${queryString}`;
    
    console.log('Gateway - Detalles de la petición:', {
      method: req.method,
      originalUrl: req.originalUrl,
      parsedUrl: originalUrl.toString(),
      queryString: queryString,
      fullUrl: fullUrl,
      query: Object.fromEntries(originalUrl.searchParams)
    });

    // Configurar la petición a la REST API
    const config = {
      method: req.method,
      url: fullUrl,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      },
      maxRedirects: 0,
      validateStatus: function (status) {
        return status >= 200 && status < 400;
      }
    };
    
    console.log('Gateway - Configuración de la petición:', config);
    
    const response = await axios(config);

    console.log('Gateway - Respuesta de la REST API:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      config: {
        url: response.config.url,
        method: response.config.method,
        headers: response.config.headers
      }
    });

    // Si la respuesta es una redirección, redirigir al cliente
    if (response.status >= 300 && response.status < 400) {
      console.log('Gateway - Redirigiendo a:', response.headers.location);
      return res.redirect(response.headers.location);
    }

    // Si no es una redirección, enviar la respuesta normal
    res.json(response.data);
  } catch (error) {
    console.error('Gateway - Error detallado:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
    
    // Si el error es una redirección, manejarla
    if (error.response && error.response.status >= 300 && error.response.status < 400) {
      console.log('Gateway - Redirigiendo después de error a:', error.response.headers.location);
      return res.redirect(error.response.headers.location);
    }
    
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Internal Server Error' });
  }
});

export const restRouter = router; 