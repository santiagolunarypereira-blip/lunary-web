# lunary-web

Sitio de Lunary: **lunarycol.com**. Colectivo de techno underground, Pereira.

Es un sitio estático (HTML, CSS y JavaScript, sin frameworks) publicado en Replit como deployment **Static**.

## Estructura

```
public/               <- todo lo que se publica
  index.html          home (una pantalla, botón a LuloPass)
  privacidad.html     política de privacidad y cookies
  css/styles.css      estilos (colores y fuentes al inicio, en :root)
  js/main.js          retícula, revelado de píxeles, intro, wireframes, reloj
  assets/             logos, texturas, íconos, imagen para redes
.replit               configuración de vista previa y publicación en Replit
```

## Cambios frecuentes

| Qué | Dónde |
|---|---|
| Link de LuloPass | `public/index.html` -> `<a class="cta" href="...">` |
| Colores | `public/css/styles.css` -> bloque `:root` al inicio |
| Frase bajo el logo | `public/index.html` -> `.tagline__text` (y su `aria-label`) |
| Pixel de Meta | `<head>` de cada `.html` (ID `1382858615883993`, solo PageView) |
| Fuentes de marca (Adobe Fonts) | pegar el `<link>` del Web Project en el `<head>`, donde está el comentario |

## Flujo de trabajo

1. Los cambios se hacen en este repo y se suben a GitHub (push).
2. En Replit: panel **Git** -> **Pull**.
3. En Replit: **Publish** -> **Republish**.

## Vista previa local

```
python -m http.server 8000 --directory public
```

Luego abrir http://localhost:8000
