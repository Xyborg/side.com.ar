# Archivos Desclasificados SIDE (1973–1983)

Sitio web para explorar los 26 documentos desclasificados de la **Secretaría de Inteligencia de Estado (SIDE)** de la República Argentina, correspondientes al período 1973–1983 (Primera Etapa).

## Acerca del proyecto

De acuerdo con lo dispuesto por el Presidente de la Nación, la Secretaría de Inteligencia de Estado comenzó el proceso de desclasificación de su archivo histórico para su publicación, conservación y traspaso al Archivo General de la Nación.

Esta primera entrega comprende **26 documentos oficiales** — resoluciones, directivas, circulares y manuales — distribuidos en **987 páginas escaneadas**, que revelan la estructura, las misiones y los mecanismos de control ideológico de la SIDE durante la última dictadura militar argentina.

## Contenido del archivo

Los documentos están organizados en tres carpetas temáticas:

| Carpeta | Título | Documentos | Descripción |
|---------|--------|------------|-------------|
| 1 | Orgánicas, misiones y funciones | 11 | Resoluciones que estructuran la organización de la Secretaría (1975–1983). Organigramas, misiones y funciones, codificación de dependencias y normas de encubrimiento del personal. |
| 2 | Normativa Interna | 4 | Funcionamiento de delegaciones regionales, circulares y directivas (1974–1980). |
| 3 | Comisión Asesora de Antecedentes (CAA) | 11 | Creación y funcionamiento de la CAA: normas de calificación ideológica de personas, entidades, organizaciones, publicaciones y medios de difusión (1973–1983). |

## Funcionalidades

### Catálogo de documentos
Exploración de los 26 documentos con búsqueda por texto, filtros por carpeta, año, clasificación y etiquetas, y ordenamiento por fecha, título o cantidad de páginas.

### Visor de documentos
Visualización página por página con zoom y paneo. Panel lateral con metadatos, descripción, contexto histórico, etiquetas y documentos relacionados. Incluye transcripción OCR con indicador de confianza.

### Estadísticas
Visualizaciones interactivas construidas con Chart.js y D3.js:
- Documentos por año (barras apiladas por carpeta)
- Clasificación de seguridad (Secreto vs. Estrictamente Secreto y Confidencial)
- Tipos de documento
- Páginas por documento y por carpeta
- Mapa del archivo: barra de 987 páginas con segmentos navegables
- Nube de etiquetas con frecuencia y enlaces
- Grafo de red: documentos como nodos, conexiones por etiquetas y temas compartidos

### Etiquetas
Explorador de etiquetas con búsqueda y vista por frecuencia. Cada etiqueta muestra:
- Etiquetas co-ocurrentes (top 10)
- Distribución temporal (mini línea de tiempo)
- Documentos vinculados

### Explorador de archivo
Navegación continua de las 987 páginas escaneadas con índice lateral por carpeta, búsqueda por documento y controles de paginación y zoom.

### Línea de tiempo
Cronología interactiva con filtros por tipo de evento (documentos, hitos históricos) y navegación por año.

### Transcripción OCR
987 archivos JSON de transcripción (uno por página escaneada) con nivel de confianza, accesibles desde el visor de documentos.

### Documentos relacionados
Sistema de puntuación que sugiere documentos afines según etiquetas compartidas, carpeta, tema transversal, año y clasificación.

## Contexto histórico

- **1946** — Se crea la Coordinación de Informaciones de la Presidencia de la Nación (CIDE) bajo el primer gobierno de Perón (Decreto N° 337/46).
- **1955** — Tras el golpe de Estado se crea la Secretaría de Informaciones de Estado (SIDE) (Decreto "S" N° 776/56).
- **1966** — La Ley de Defensa Nacional N° 16.970 crea la Central Nacional de Inteligencia (CNI).
- **1973** — Las leyes 20.194 y 20.195 reorganizan la Secretaría de Informaciones del Estado.
- **1976** — El Decreto "S" N° 416/76 cambia el nombre a Secretaría de Inteligencia de Estado.

## Estructura del sitio

```
├── index.html                    # Página principal
├── documentos/
│   ├── index.html                # Catálogo de documentos con filtros
│   └── ver/index.html            # Visor de documentos con OCR
├── estadisticas/
│   └── index.html                # Estadísticas y visualizaciones
├── etiquetas/
│   └── index.html                # Explorador de etiquetas
├── explorar-archivos/
│   └── index.html                # Explorador visual de páginas
├── linea-de-tiempo/
│   └── index.html                # Línea de tiempo interactiva
├── acerca-desclasificacion/
│   └── index.html                # Contexto histórico y criterios
├── data/
│   ├── documents.json            # Metadatos de los 26 documentos
│   ├── carpetas.json             # Definición de las 3 carpetas temáticas
│   ├── themes.json               # 5 temas transversales entre documentos
│   ├── timeline.json             # Eventos para la línea de tiempo
│   └── ocr/                      # 987 transcripciones OCR (JSON por página)
├── images/
│   └── ui/                       # Logos e imágenes de interfaz
├── css/styles.css                # Estilos del sitio
├── js/
│   ├── app.js                    # Utilidades compartidas
│   ├── documents.js              # Lógica del catálogo
│   ├── viewer.js                 # Visor de documentos
│   ├── estadisticas.js           # Gráficos y estadísticas
│   ├── network.js                # Grafo de red D3
│   ├── tags.js                   # Explorador de etiquetas
│   └── timeline.js               # Línea de tiempo
├── robots.txt
└── sitemap.xml
```

## Tecnología

Sitio estático construido con HTML, CSS y JavaScript vanilla. Sin paso de compilación.

- [Bootstrap 3](https://getbootstrap.com/docs/3.4/) — Layout y componentes
- [Encode Sans](https://fonts.google.com/specimen/Encode+Sans) — Tipografía
- [Poncho](https://argob.github.io/poncho/) — Sistema de diseño del Gobierno argentino
- [Chart.js 4](https://www.chartjs.org/) — Gráficos estadísticos
- [D3.js 7](https://d3js.org/) — Grafo de red de documentos
- [jQuery 3.7](https://jquery.com/) — Manipulación DOM

Las imágenes de páginas escaneadas se sirven desde CDN. Desplegado en [Cloudflare Pages](https://pages.cloudflare.com/).

## Abreviaturas

| Sigla | Significado |
|-------|-------------|
| "S" | Secreto |
| "ESC" | Estrictamente Secreto y Confidencial |
| SIDE | Secretaría de Inteligencia de Estado |
| CNI | Central Nacional de Inteligencia |
| CAA | Comisión Asesora de Antecedentes |
| FDS | Fondo Documental SIDE |

## Aviso legal

Este no es un sitio oficial del Gobierno de la República Argentina. No se asume responsabilidad alguna por el contenido de los documentos publicados. El único objetivo es facilitar el acceso a información ya publicada por el Estado argentino.

## Fuente

La información proviene de la *Guía sobre la Desclasificación de Documentos Históricos SIDE (1973–1983) — Primera Etapa*, publicada por la Secretaría de Inteligencia de Estado, República Argentina.

## Autor

Sitio creado por [Martin Aberastegue](https://www.martinaberastegue.com).
