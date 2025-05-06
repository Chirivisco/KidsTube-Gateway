import express from 'express';
import axios from 'axios';

const router = express.Router();

// URL del servicio GraphQL
const GRAPHQL_URL = process.env.GRAPHQL_SERVICE_URL || 'http://localhost:4000/graphql';

// Middleware para redirigir peticiones GraphQL
router.use(async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: GRAPHQL_URL,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error forwarding GraphQL request:', error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Internal Server Error' });
  }
});

export const graphqlRouter = router; 