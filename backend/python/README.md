# Python backend (FastAPI)

## Requisitos

- Python 3.10+

## Instalar

```bash
pip install -r requirements.txt
```

## Ejecutar

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

## Endpoint

### POST `/api/render`

`multipart/form-data`

- `image` (obligatorio): archivo de imagen
- `template` (opcional): PNG/JPG de plantilla (si lo envías, no necesitas guardarlo en disco)
- `options` (opcional): string JSON

Ejemplo `options`:

```json
{
  "fit": "cover",
  "offsetX": 0,
  "offsetY": 0,
  "photoRectNorm": {"x": 0.39, "y": 0.48, "w": 0.22, "h": 0.22},
  "format": "png"
}
```

Si NO envías `template`, el backend intentará cargar `assets/templates/<template>.png` (por defecto `sprite`).