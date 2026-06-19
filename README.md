# Drive Clone — Taller 3

Aplicación web donde puedes subir archivos mediante drag-and-drop, listar los tres archivos más recientes y descargarlos. El almacenamiento de objetos se simula localmente usando **LocalStack** (implementación local de AWS S3), orquestado con **Docker Compose** y con el bucket aprovisionado mediante **Terraform**.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js + Express + Multer |
| Almacenamiento | AWS S3 (simulado con LocalStack) |
| Infraestructura como código | Terraform |
| Contenedores | Docker + Docker Compose |

---

## Estructura del repositorio

```
drive-clone/
├── backend/              # API REST (Node.js/Express)
│   ├── index.js          # Endpoints: /upload, /files, /download, /health
│   ├── Dockerfile        # Imagen del backend
│   ├── package.json
│   └── .env.example      # Variables de entorno requeridas
├── frontend/             # Interfaz de usuario (React + Vite)
│   └── src/
│       ├── App.jsx       # Componente principal
│       ├── main.jsx      # Entry point
│       └── styles.css    # Estilos
├── terraform/            # Infraestructura como código
│   └── main.tf           # Definición del bucket S3 en LocalStack
├── docker-compose.yml    # Orquesta LocalStack y el backend
└── README.md
```

---

## Endpoints del backend

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Verificación de estado del servidor |
| `POST` | `/upload` | Sube uno o varios archivos al bucket S3 |
| `GET` | `/files` | Lista los 3 archivos más recientes |
| `GET` | `/download?key=<key>` | Descarga un archivo por su key |

---

## Requisitos previos

- [Docker](https://www.docker.com/) y Docker Compose
- [Terraform](https://www.terraform.io/) >= 1.0
- [Node.js](https://nodejs.org/) >= 18 (para desarrollo local sin Docker)

---

## Inicio rápido

### 1. Clonar el repositorio

```bash
git clone https://github.com/Fabrich21/Drive---Taller3.git
cd Drive---Taller3
```

### 2. Levantar LocalStack y el backend con Docker Compose

```bash
docker compose up -d
```

Esto levanta:
- **LocalStack** en el puerto `4566` simulando AWS S3
- **Backend** en el puerto `4000`

### 3. Crear el bucket S3 con Terraform

```bash
cd terraform
terraform init
terraform apply -auto-approve
cd ..
```

Terraform se conecta a LocalStack y crea el bucket `drive-clone-bucket`.

### 4. Levantar el frontend en modo desarrollo

```bash
cd frontend
npm install
npm run dev
```

La app queda disponible en `http://localhost:5173`.

> **Nota:** Si quieres correr el backend fuera de Docker también:
> ```bash
> cd backend
> cp .env.example .env
> npm install
> npm run dev
> ```

---

## Variables de entorno del backend

Copia `.env.example` a `.env` y ajusta según sea necesario:

```env
S3_ENDPOINT=http://localstack:4566
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_REGION=us-east-1
BUCKET=drive-clone-bucket
PORT=4000
```

> Cuando el backend corre dentro de Docker, la URL del endpoint es `http://localstack:4566` (nombre del servicio en Docker Compose). En desarrollo local fuera de Docker, usa `http://localhost:4566`.

---

## Funcionalidades

- **Drag-and-drop:** arrastra uno o varios archivos al área de carga
- **Selección manual:** haz clic en el área para abrir el explorador de archivos
- **Lista de recientes:** muestra los 3 archivos subidos más recientemente con fecha y hora
- **Descarga:** botón de descarga directo por cada archivo listado
- **Refresco manual:** botón ⟳ para actualizar la lista sin recargar la página

