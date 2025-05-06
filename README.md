# KidsTube Gateway

API Gateway para KidsTube que maneja el enrutamiento, autenticación y balanceo de carga entre los diferentes servicios.

## 🚀 Características

- Enrutamiento inteligente de peticiones
- Autenticación centralizada
- Balanceo de carga
- Rate limiting
- Caché de respuestas
- Logging centralizado
- Monitoreo de servicios
- Circuit breaker para fallos
- Transformación de respuestas

## 📋 Prerrequisitos

- Node.js (v18 o superior)
- Redis (opcional, para caché)
- npm o yarn

## 🔧 Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/KidsTube-Gateway.git
cd KidsTube-Gateway
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
```
Editar el archivo `.env` con tus configuraciones.

## ⚙️ Configuración

El archivo `.env` debe contener:

```env
PORT=4000
NODE_ENV=development
JWT_SECRET=tu_jwt_secret
REDIS_URL=redis://localhost:6379

# URLs de los servicios
API_URL=http://localhost:4001
GRAPHQL_URL=http://localhost:4002
```

## �� Uso

1. Iniciar el servidor en desarrollo:
```bash
npm run dev
```

2. Iniciar el servidor en producción:
```bash
npm start
```

## 🔄 Rutas Configuradas

### API REST
- `/api/*` -> KidsTube-API
- `/auth/*` -> KidsTube-API

### GraphQL
- `/graphql` -> KidsTube-Query-Service

## 🔒 Autenticación

El Gateway maneja la autenticación JWT y la distribuye a los servicios correspondientes.

### Headers Requeridos
```bash
Authorization: Bearer <token>
```

## ⚡ Rate Limiting

- 100 peticiones por minuto por IP
- 1000 peticiones por hora por usuario autenticado

## 🧪 Testing

```bash
npm test
```

## 📦 Estructura del Proyecto
