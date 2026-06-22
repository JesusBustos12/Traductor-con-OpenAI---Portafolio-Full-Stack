# Traductor con OpenAI - Portafolio Full-Stack

## Descripción
Aplicación web full-stack que implementa un traductor inteligente utilizando la API de Chat Completions de OpenAI, respaldado por una base de datos en la nube. El sistema permite traducciones de texto a varios idiomas, cuenta con un límite de peticiones seguro por IP para evitar abusos, muestra mensajes diferenciados por rol y tiene un diseño moderno tipo Glassmorphism con efectos neón. Construido con Node.js, Express, MySQL2 (TiDB Cloud), JavaScript vanilla y CSS puro, sin frameworks. Ideal para demostrar habilidades full-stack.

## Objetivo
Este proyecto fue desarrollado con el propósito de:
Demostrar dominio avanzado de Node.js y Express en el backend.
Integrar APIs externas avanzadas (OpenAI Chat Completions con prompts personalizados).
Implementar y gestionar una base de datos SQL en la nube (TiDB Cloud).
Establecer un límite de peticiones (Rate Limiting) seguro basado en direcciones IP.
Implementar interacciones multi-turno con respuestas en tiempo real.
Diseñar una interfaz interactiva y responsiva con animaciones CSS.
Aplicar buenas prácticas de seguridad (.env, .gitignore, variables de entorno).
Construir un portafolio profesional listo para despliegue en producción.

## Características
Traducciones directas: Soporta idiomas como inglés, español, francés, italiano, alemán, japonés y ruso.
Rate Limiting: Límite de 20 traducciones validado de forma segura desde el servidor y base de datos, protegido contra borrado de caché local.
Base de Datos en la Nube: Registro de límite de usuarios y peticiones utilizando TiDB Cloud (MySQL).
Prompts inteligentes: Sistema de prompts para traducciones precisas y directas, sin respuestas adicionales.
Mensajes diferenciados: Usuario (azul oscuro) y bot (violeta translúcido) con formato de burbuja tipo Glassmorphism.
Diseño moderno: Tema oscuro, tipografía clara, sombras neón, transiciones suaves y validaciones visuales.
Entrada por teclado: Enviar mensaje con botón o entrada de texto.
Seguridad: API key y credenciales de base de datos protegidas con dotenv y nunca expuestas en GitHub.
Despliegue listo: Configurado para Render, Vercel o Hostinger.

## Tecnologías utilizadas
Node.js + Express: Servidor backend y rutas API.
OpenAI Chat Completions API: Gestión de prompts y traducciones.
TiDB Cloud (MySQL2): Base de datos serverless en la nube y driver para Node.
JavaScript (vanilla): Manipulación del DOM, eventos, fetch asíncrono.
HTML5 + CSS3: Estructura semántica, Flexbox, Glassmorphism, animaciones con @keyframes.
dotenv: Gestión segura de variables de entorno.
Git & GitHub: Control de versiones y colaboración.
Render / Vercel (opcional): Despliegue en producción.

## Estructura del proyecto
traductor-openai/
├── app.js                       # Servidor Express, lógica OpenAI y conexión DB
├── package.json                 # Dependencias y scripts
├── .env.example                 # Plantilla de variables (sin claves)
├── .gitignore                   # Protege .env, node_modules
├── vercel.json                  # Configuración de despliegue
├── test-db.js                   # Script de prueba de conexión a base de datos
├── front-end/
│   ├── index.html               # Estructura del traductor y UI de límite
│   └── Assets/
│       ├── CSS/styles.css       # Diseño neón, burbujas y Glassmorphism
│       ├── Js/main.js           # Lógica del frontend (DOM, límites, fetch)
│       ├── Imgs/                # Logo principal (traductor.png)
│       └── Fonts/Montserrat/    # Tipografía local
└── README.markdown              # Esta documentación

## Competencias Técnicas y Arquitectura
Este proyecto refleja las siguientes competencias de ingeniería de software:
Backend: Arquitectura de rutas API, operaciones asíncronas seguras y manejo robusto de errores.
Frontend: Manipulación de DOM dinámico, gestión de eventos, UX fluida y componentes UI modernos.
APIs externas: Integración avanzada con OpenAI (ingeniería de prompts, completions).
Arquitectura limpia: Separación estricta de responsabilidades (backend/frontend).
Seguridad: Gestión segura de variables de entorno, control de accesos y Rate Limiting por IP.
Bases de Datos: Integración fluida con bases de datos SQL serverless (TiDB Cloud).
Despliegue e Integración: Estructura preparada para entornos de producción (Vercel, Render, AWS).

## Demo en vivo
Prueba el traductor en tiempo real:
https://traductor-con-open-ai-portafolio-fu.vercel.app/
(Desplegado como función Serverless de Vercel, respuesta inmediata)

## Pregunta:
"¿Hola cómo estás? a inglés"
"Traduce 'apple' a japonés"
"Convierte 'bonjour' a español"

## Aspectos Destacados
- Integración de APIs complejas en entornos de producción.
- Dominio sólido de backend y frontend utilizando tecnologías core (sin dependencia exclusiva de frameworks).
- Enfoque prioritario en seguridad, rendimiento y experiencia de usuario.
- Patrones de arquitectura orientados a escalabilidad y mantenimiento ágil.
- Resolución de problemas complejos (como el Rate Limiting seguro con bases de datos en la nube) de forma eficiente.

## Contacto
Para oportunidades profesionales, consultas o colaboraciones, puedes encontrarme en:
GitHub: github.com/JesusBustos12
LinkedIn: linkedin.com/in/jesus-bustos-arizmendi-325329283
Correo: jesusbustosarizmendi0@gmail.com