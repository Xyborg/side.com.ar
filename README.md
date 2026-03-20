# Archivos Desclasificados SIDE (1973–1983)

Sitio web para explorar los 26 documentos desclasificados de la **Secretaría de Inteligencia de Estado (SIDE)** de la República Argentina, correspondientes al período 1973–1983 (Primera Etapa).

## Acerca del proyecto

De acuerdo con lo dispuesto por el Presidente de la Nación, la Secretaría de Inteligencia de Estado comenzó el proceso de desclasificación de su archivo histórico para su publicación, conservación y traspaso al Archivo General de la Nación.

Esta primera entrega comprende **26 documentos oficiales** — resoluciones, directivas, circulares y manuales — distribuidos en **492 páginas**, que revelan la estructura, las misiones y los mecanismos de control ideológico de la SIDE durante la última dictadura militar argentina.

## Contenido del archivo

Los documentos están organizados en tres carpetas temáticas:

| Carpeta | Título | Documentos | Descripción |
|---------|--------|------------|-------------|
| 1 | Orgánicas, misiones y funciones | 11 | Resoluciones que estructuran la organización de la Secretaría (1975–1983). Organigramas, misiones y funciones, codificación de dependencias y normas de encubrimiento del personal. |
| 2 | Normativa Interna | 4 | Funcionamiento de delegaciones regionales, circulares y directivas (1974–1980). |
| 3 | Comisión Asesora de Antecedentes (CAA) | 11 | Creación y funcionamiento de la CAA: normas de calificación ideológica de personas, entidades, organizaciones, publicaciones y medios de difusión (1973–1983). |

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
│   └── ver/index.html            # Visor de documentos página por página
├── explorar-archivos/
│   └── index.html                # Explorador visual de páginas
├── linea-de-tiempo/
│   └── index.html                # Línea de tiempo interactiva
├── acerca-desclasificacion/
│   └── index.html                # Contexto histórico y criterios
├── data/
│   ├── documents.json            # Metadatos de los 26 documentos
│   ├── carpetas.json             # Definición de las 3 carpetas temáticas
│   └── timeline.json             # Eventos para la línea de tiempo
├── images/
│   ├── pages/                    # 988 imágenes de páginas escaneadas
│   └── ui/                       # Logos e imágenes de interfaz
├── css/styles.css                # Estilos del sitio
├── js/
│   └── app.js                    # Lógica de la aplicación
├── robots.txt
└── sitemap.xml
```

## Tecnología

Sitio estático construido con HTML, CSS y JavaScript vanilla. Utiliza [Bootstrap 3](https://getbootstrap.com/docs/3.4/) y la tipografía [Encode Sans](https://fonts.google.com/specimen/Encode+Sans), siguiendo los lineamientos de diseño de [Poncho](https://argob.github.io/poncho/) (sistema de diseño del Gobierno argentino). Desplegado en [Cloudflare Pages](https://pages.cloudflare.com/).

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
