from __future__ import annotations

import io
import json
import logging
import os
from dataclasses import dataclass
from typing import Any, Literal, Optional, Tuple

from fastapi import FastAPI, File, Form, HTTPException, UploadFile, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from PIL import Image
from supabase import create_client, Client
import traceback
from dotenv import load_dotenv

from template_manager import TemplateManager

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


TEMPLATES_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "assets", "templates")
)

FitMode = Literal["cover", "contain"]


@dataclass
class Rect:
    x: int
    y: int
    w: int
    h: int


def clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


def parse_options(raw: Optional[str]) -> dict[str, Any]:
    if not raw:
        return {}
    try:
        data = json.loads(raw)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"options JSON inválido: {e}")
    if not isinstance(data, dict):
        raise HTTPException(status_code=400, detail="options debe ser un objeto JSON")
    return data


def template_path(name: str) -> str:
    safe = name.replace("..", "").replace("\\", "/").strip("/")
    return os.path.abspath(os.path.join(TEMPLATES_DIR, f"{safe}.png"))


def load_template_from_disk(name: str) -> Image.Image:
    path = template_path(name)
    if not path.startswith(TEMPLATES_DIR):
        raise HTTPException(status_code=400, detail="template inválido")
    if not os.path.exists(path):
        raise HTTPException(
            status_code=404,
            detail=(
                f"template '{name}' no existe. O súbelo como campo 'template' (multipart) o colócalo como PNG en {TEMPLATES_DIR} (ej: {name}.png)."
            ),
        )
    try:
        return Image.open(path).convert("RGBA")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"No se pudo abrir template: {e}")


def load_template_from_upload(file: UploadFile) -> Image.Image:
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El campo 'template' debe ser una imagen")
    data = file.file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Template vacío")
    try:
        return Image.open(io.BytesIO(data)).convert("RGBA")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"No se pudo abrir el template: {e}")


def rect_from_options(template_size: Tuple[int, int], options: dict[str, Any]) -> Rect:
    tw, th = template_size

    rect_px = options.get("photoRectPx")
    if isinstance(rect_px, dict):
        try:
            return Rect(
                x=int(rect_px["x"]),
                y=int(rect_px["y"]),
                w=int(rect_px["w"]),
                h=int(rect_px["h"]),
            )
        except Exception:
            raise HTTPException(status_code=400, detail="photoRectPx debe tener x,y,w,h numéricos")

    rect_norm = options.get("photoRectNorm")
    if isinstance(rect_norm, dict):
        try:
            x = float(rect_norm["x"])
            y = float(rect_norm["y"])
            w = float(rect_norm["w"])
            h = float(rect_norm["h"])
        except Exception:
            raise HTTPException(status_code=400, detail="photoRectNorm debe tener x,y,w,h numéricos")

        return Rect(
            x=int(round(x * tw)),
            y=int(round(y * th)),
            w=int(round(w * tw)),
            h=int(round(h * th)),
        )

    # Default aproximado para la plantilla del ejemplo (ajustable desde la app)
    return Rect(
        x=int(round(0.39 * tw)),
        y=int(round(0.48 * th)),
        w=int(round(0.22 * tw)),
        h=int(round(0.22 * th)),
    )


def fit_image_to_rect(
    photo: Image.Image, rect: Rect, fit: FitMode, offset_x: float, offset_y: float
) -> Image.Image:
    ox = clamp(float(offset_x), -1.0, 1.0)
    oy = clamp(float(offset_y), -1.0, 1.0)

    if fit == "contain":
        img = photo.copy()
        img.thumbnail((rect.w, rect.h), Image.Resampling.LANCZOS)
        out = Image.new("RGBA", (rect.w, rect.h), (0, 0, 0, 0))
        out.paste(img, ((rect.w - img.width) // 2, (rect.h - img.height) // 2))
        return out

    # cover
    pw, ph = photo.size
    scale = max(rect.w / pw, rect.h / ph)
    rw = max(1, int(round(pw * scale)))
    rh = max(1, int(round(ph * scale)))
    resized = photo.resize((rw, rh), Image.Resampling.LANCZOS)

    max_left = max(0, rw - rect.w)
    max_top = max(0, rh - rect.h)

    left = int(round((ox + 1) * 0.5 * max_left))
    top = int(round((oy + 1) * 0.5 * max_top))

    return resized.crop((left, top, left + rect.w, top + rect.h))


def compose_template(photo: Image.Image, template: Image.Image, options: dict[str, Any]) -> Image.Image:
    rect = rect_from_options(template.size, options)
    if rect.w <= 0 or rect.h <= 0:
        raise HTTPException(status_code=400, detail="Rect inválido")

    fit_value = options.get("fit")
    fit: FitMode = fit_value if fit_value in ("cover", "contain") else "cover"
    offset_x = float(options.get("offsetX", 0))
    offset_y = float(options.get("offsetY", 0))

    photo_rgba = photo.convert("RGBA")
    fitted = fit_image_to_rect(photo_rgba, rect, fit, offset_x, offset_y)

    base = Image.new("RGBA", template.size, (0, 0, 0, 0))
    base.paste(fitted, (rect.x, rect.y), fitted)

    return Image.alpha_composite(base, template)


def encode_output(img: Image.Image, options: dict[str, Any]) -> tuple[bytes, str]:
    fmt = str(options.get("format") or "png").lower()
    if fmt not in ("png", "jpeg", "jpg"):
        raise HTTPException(status_code=400, detail="format debe ser png o jpeg")

    if fmt in ("jpeg", "jpg"):
        quality = int(options.get("quality", 92))
        quality = max(1, min(95, quality))
        bg = str(options.get("jpegBackground", "#ffffff"))
        rgb = Image.new("RGB", img.size, bg)
        rgb.paste(img, mask=img.split()[-1])
        buf = io.BytesIO()
        rgb.save(buf, format="JPEG", quality=quality, optimize=True)
        return buf.getvalue(), "image/jpeg"

    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue(), "image/png"


app = FastAPI(title="Polaroid Template API", version="0.2.0")

# Add exception handler middleware
@app.middleware("http")
async def log_exceptions(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        logger.error(f"Unhandled exception: {e}")
        logger.error(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"detail": f"Error interno: {str(e)}"}
        )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

supabase_client: Optional[Client] = None
if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
    supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def get_user_id_from_token(authorization: Optional[str]) -> str:
    """
    Extract user_id from Supabase Auth token.
    
    Args:
        authorization: Authorization header value
        
    Returns:
        User ID string
        
    Raises:
        HTTPException: If token is invalid or missing
    """
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Token de autenticación requerido")
        
        if not supabase_client:
            raise HTTPException(status_code=500, detail="Supabase no configurado")
        
        # Extract token from "Bearer <token>" format
        token = authorization.replace("Bearer ", "").strip()
        if not token:
            raise HTTPException(status_code=401, detail="Token de autenticación requerido")
        
        try:
            # Verify token and get user
            user_response = supabase_client.auth.get_user(token)
            if not user_response or not user_response.user:
                raise HTTPException(status_code=401, detail="Token inválido")
            
            return user_response.user.id
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Token inválido: {e}")
    except HTTPException:
        raise
    except Exception as e:
        # Log the full error for debugging
        import traceback
        print(f"ERROR in get_user_id_from_token: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error al verificar token: {str(e)}")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/templates", status_code=201)
async def create_template(
    file: UploadFile = File(...),
    metadata: Optional[str] = Form(None),
    authorization: Optional[str] = Header(None)
) -> JSONResponse:
    """
    Upload a new custom template.
    
    Args:
        file: PNG file (required)
        metadata: JSON string with optional filename and photoRectNorm
        authorization: Bearer token for authentication
        
    Returns:
        201: Template created successfully
        400: Validation error
        401: Authentication required
        413: File too large
        429: Quota exceeded
    """
    try:
        # Authenticate user
        user_id = get_user_id_from_token(authorization)
        
        if not supabase_client:
            raise HTTPException(status_code=500, detail="Supabase no configurado")
        
        # Extract token for authenticated Supabase client
        token = authorization.replace("Bearer ", "").strip() if authorization else ""
        
        # Create authenticated Supabase client for this user
        user_supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        user_supabase.auth.set_session(token, token)  # Set the user's session
        
        # Parse metadata
        metadata_dict = {}
        if metadata:
            try:
                metadata_dict = json.loads(metadata)
                if not isinstance(metadata_dict, dict):
                    raise HTTPException(status_code=400, detail="El campo metadata debe ser un objeto JSON")
            except json.JSONDecodeError as e:
                raise HTTPException(status_code=400, detail=f"El campo metadata debe ser JSON válido: {e}")
        
        # Validate file type
        if file.content_type and not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="El campo 'file' debe ser una imagen")
        
        # Read file
        try:
            file_buffer = await file.read()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"No se pudo leer el archivo: {e}")
        
        if not file_buffer:
            raise HTTPException(status_code=400, detail="Archivo vacío")
        
        # Check file size before processing
        if len(file_buffer) > 10 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="El archivo excede el límite de 10MB")
        
        # Upload template with user's authenticated client
        manager = TemplateManager(user_supabase)
        try:
            template = await manager.upload_template(user_id, file_buffer, metadata_dict)
            return JSONResponse(
                status_code=201,
                content={"success": True, "template": template}
            )
        except Exception as e:
            error_msg = str(e)
            
            # Check for quota error
            if "20 plantillas" in error_msg or "quota" in error_msg.lower():
                raise HTTPException(status_code=429, detail=error_msg)
            
            # Check for file size error
            if "10mb" in error_msg.lower():
                raise HTTPException(status_code=413, detail=error_msg)
            
            # Other validation errors
            raise HTTPException(status_code=400, detail=error_msg)
    except HTTPException:
        raise
    except Exception as e:
        # Log the full error for debugging
        import traceback
        print(f"ERROR in create_template: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@app.get("/api/templates")
async def list_templates(
    authorization: Optional[str] = Header(None)
) -> JSONResponse:
    """
    List all templates for the authenticated user.
    
    Args:
        authorization: Bearer token for authentication
        
    Returns:
        200: List of templates
        401: Authentication required
    """
    try:
        # Authenticate user
        user_id = get_user_id_from_token(authorization)
        
        if not supabase_client:
            raise HTTPException(status_code=500, detail="Supabase no configurado")
        
        # List templates
        manager = TemplateManager(supabase_client)
        try:
            templates = await manager.list_templates(user_id)
            return JSONResponse(
                status_code=200,
                content={"success": True, "templates": templates}
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al listar plantillas: {e}")
    except HTTPException:
        raise
    except Exception as e:
        # Log the full error for debugging
        import traceback
        print(f"ERROR in list_templates: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@app.get("/api/templates/{template_id}")
async def get_template(
    template_id: str,
    authorization: Optional[str] = Header(None)
) -> JSONResponse:
    """
    Get details of a specific template.
    
    Args:
        template_id: Template UUID
        authorization: Bearer token for authentication
        
    Returns:
        200: Template details
        401: Authentication required
        404: Template not found
    """
    # Authenticate user
    user_id = get_user_id_from_token(authorization)
    
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    
    # Get template
    manager = TemplateManager(supabase_client)
    try:
        template = await manager.get_template(user_id, template_id)
        return JSONResponse(
            status_code=200,
            content={"success": True, "template": template}
        )
    except Exception as e:
        error_msg = str(e)
        if "no encontrada" in error_msg:
            raise HTTPException(status_code=404, detail=error_msg)
        raise HTTPException(status_code=500, detail=f"Error al obtener plantilla: {e}")


@app.delete("/api/templates/{template_id}")
async def delete_template(
    template_id: str,
    authorization: Optional[str] = Header(None)
) -> JSONResponse:
    """
    Delete a template.
    
    Args:
        template_id: Template UUID
        authorization: Bearer token for authentication
        
    Returns:
        200: Template deleted successfully
        401: Authentication required
        404: Template not found
    """
    # Authenticate user
    user_id = get_user_id_from_token(authorization)
    
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    
    # Delete template
    manager = TemplateManager(supabase_client)
    try:
        await manager.delete_template(user_id, template_id)
        return JSONResponse(
            status_code=200,
            content={"success": True, "message": "Plantilla eliminada exitosamente"}
        )
    except Exception as e:
        error_msg = str(e)
        if "no encontrada" in error_msg:
            raise HTTPException(status_code=404, detail=error_msg)
        raise HTTPException(status_code=500, detail=f"Error al eliminar plantilla: {e}")


@app.post("/api/render")
async def render(
    image: UploadFile = File(...),
    template: Optional[UploadFile] = File(None),
    options: Optional[str] = Form(None),
) -> Response:
    try:
        opts = parse_options(options)

        if image.content_type and not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="El campo 'image' debe ser una imagen")

        data = await image.read()
        if not data:
            raise HTTPException(status_code=400, detail="Archivo vacío")

        try:
            photo = Image.open(io.BytesIO(data))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"No se pudo abrir la imagen: {e}")

        # Check for templateId in options (precedence: templateId > multipart > assets)
        template_id = opts.get("templateId")
        if template_id:
            # Load template from custom templates
            if not supabase_client:
                raise HTTPException(status_code=500, detail="Supabase no configurado")
            
            manager = TemplateManager(supabase_client)
            template_result = await manager.get_template_for_render(template_id)
            
            if not template_result:
                raise HTTPException(status_code=404, detail=f"Plantilla con ID '{template_id}' no encontrada")
            
            template_buffer, template_metadata = template_result
            
            try:
                template_img = Image.open(io.BytesIO(template_buffer)).convert("RGBA")
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"No se pudo abrir la plantilla personalizada: {e}")
            
            # Apply photoRectNorm from template metadata if not overridden in options
            if "photoRectNorm" not in opts and "photoRectPx" not in opts:
                opts["photoRectNorm"] = template_metadata["photoRectNorm"]
        elif template is not None:
            # Use multipart template
            template_img = load_template_from_upload(template)
        else:
            # Use template from assets/templates/
            template_name = str(opts.get("template") or "sprite")
            template_img = load_template_from_disk(template_name)

        out = compose_template(photo, template_img, opts)
        payload, mime = encode_output(out, opts)
        return Response(content=payload, media_type=mime)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in render endpoint: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error al renderizar: {str(e)}")