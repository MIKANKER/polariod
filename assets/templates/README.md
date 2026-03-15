# Templates

Coloca aquí tus plantillas (PNG con transparencia) para que el backend pueda componer la foto dentro del “hueco” y luego superponer el marco.

## Opción A (recomendada para desarrollo): subir la plantilla en cada request

Los backends soportan enviar un archivo `template` (multipart). Así te aseguras de que la plantilla “aparezca” aunque no esté guardada en el servidor.

Campos:
- `image`: tu foto
- `template`: tu plantilla PNG/JPG
- `options`: JSON string

## Opción B: plantilla en disco

Guarda la plantilla como: `assets/templates/<nombre>.png`.

Ejemplo para Sprite:
- `assets/templates/sprite.png`

### Coordenadas del área de foto

El backend soporta dos formas:

1) `photoRectNorm` (recomendado): valores normalizados 0..1 `{ x, y, w, h }` relativos al tamaño de la plantilla.
2) `photoRectPx`: valores en píxeles `{ x, y, w, h }`.

Si no envías rect, se usa un valor por defecto aproximado.