"""
Template Manager Module

Manages CRUD operations for custom templates with Supabase Storage integration.
"""

from __future__ import annotations

import io
import uuid
from typing import Optional

from PIL import Image
from supabase import Client


class TemplateManager:
    """Manages custom template operations with validation and storage."""

    def __init__(self, supabase_client: Client):
        """
        Initialize TemplateManager with Supabase client.

        Args:
            supabase_client: Authenticated Supabase client instance
        """
        self.supabase = supabase_client
        self.bucket_name = "templates"
        self.default_photo_rect_norm = {"x": 0.39, "y": 0.48, "w": 0.22, "h": 0.22}

    def validate_png(self, buffer: bytes) -> dict:
        """
        Validate PNG file format, dimensions, and size.

        Args:
            buffer: PNG file bytes

        Returns:
            dict with keys: valid (bool), width (int), height (int), error (str)
        """
        # Check file size (10MB limit)
        if len(buffer) > 10 * 1024 * 1024:
            return {
                "valid": False,
                "error": "El archivo excede el límite de 10MB",
            }

        # Try to open as image
        try:
            img = Image.open(io.BytesIO(buffer))
        except Exception as e:
            return {
                "valid": False,
                "error": f"No se pudo abrir el archivo como imagen: {e}",
            }

        # Check format
        if img.format != "PNG":
            return {
                "valid": False,
                "error": f"El archivo debe ser formato PNG. Formato recibido: {img.format}",
            }

        # Check dimensions
        width, height = img.size
        if width < 500 or width > 4000 or height < 500 or height > 4000:
            return {
                "valid": False,
                "error": f"Las dimensiones deben estar entre 500x500 y 4000x4000 píxeles. Recibido: {width}x{height}",
            }

        return {
            "valid": True,
            "width": width,
            "height": height,
        }

    def validate_photo_rect_norm(self, rect: dict) -> dict:
        """
        Validate photoRectNorm metadata structure and values.

        Args:
            rect: Dictionary with x, y, w, h keys

        Returns:
            dict with keys: valid (bool), error (str)
        """
        # Check structure
        required_keys = {"x", "y", "w", "h"}
        if not isinstance(rect, dict):
            return {
                "valid": False,
                "error": "photoRectNorm debe ser un objeto con propiedades x, y, w, h",
            }

        missing_keys = required_keys - set(rect.keys())
        if missing_keys:
            return {
                "valid": False,
                "error": f"photoRectNorm debe contener las propiedades: {', '.join(sorted(missing_keys))}",
            }

        # Validate ranges
        for key in ["x", "y", "w", "h"]:
            try:
                value = float(rect[key])
            except (ValueError, TypeError):
                return {
                    "valid": False,
                    "error": f"photoRectNorm.{key} debe ser un número. Recibido: {rect[key]}",
                }

            if value < 0.0 or value > 1.0:
                return {
                    "valid": False,
                    "error": f"photoRectNorm.{key} debe estar entre 0.0 y 1.0. Recibido: {value}",
                }

        # Validate minimum w and h
        for key in ["w", "h"]:
            value = float(rect[key])
            if value < 0.01:
                return {
                    "valid": False,
                    "error": f"photoRectNorm.{key} debe ser mayor que 0.01. Recibido: {value}",
                }

        return {"valid": True}

    async def upload_template(
        self, user_id: str, file_buffer: bytes, metadata: Optional[dict] = None
    ) -> dict:
        """
        Upload a custom template with validation.

        Args:
            user_id: User identifier
            file_buffer: PNG file bytes
            metadata: Optional dict with filename and photoRectNorm

        Returns:
            dict with template data: id, filename, url, width, height, photoRectNorm, createdAt

        Raises:
            Exception: If validation fails or upload fails
        """
        metadata = metadata or {}

        # Validate PNG
        validation = self.validate_png(file_buffer)
        if not validation["valid"]:
            raise Exception(validation["error"])

        width = validation["width"]
        height = validation["height"]
        file_size = len(file_buffer)

        # Get or apply default photoRectNorm
        photo_rect_norm = metadata.get("photoRectNorm", self.default_photo_rect_norm)
        rect_validation = self.validate_photo_rect_norm(photo_rect_norm)
        if not rect_validation["valid"]:
            raise Exception(rect_validation["error"])

        # Get filename
        filename = metadata.get("filename", "template.png")

        # Generate unique ID
        template_id = str(uuid.uuid4())
        storage_path = f"{user_id}/{template_id}.png"

        # Upload to Supabase Storage
        try:
            result = self.supabase.storage.from_(self.bucket_name).upload(
                storage_path, file_buffer, {"content-type": "image/png"}
            )
            if hasattr(result, "error") and result.error:
                raise Exception(f"Error de almacenamiento: {result.error}")
        except Exception as e:
            error_msg = str(e).lower()
            
            # Log the full error for debugging
            print(f"Storage upload error: {e}")
            print(f"Storage path: {storage_path}")
            print(f"Bucket: {self.bucket_name}")
            
            # Handle specific Storage errors with Spanish messages
            if "bucket not found" in error_msg or "bucket" in error_msg:
                raise Exception("Error de configuración: el bucket de almacenamiento no existe")
            elif "duplicate" in error_msg:
                raise Exception("Error: ya existe un archivo con este nombre en el almacenamiento")
            elif "network" in error_msg or "timeout" in error_msg or "connection" in error_msg:
                raise Exception("Error de red: no se pudo conectar al servicio de almacenamiento. Intenta nuevamente.")
            elif "policy" in error_msg or "permission" in error_msg or "not allowed" in error_msg:
                raise Exception("Error de permisos: verifica que las políticas de Storage estén configuradas correctamente")
            else:
                raise Exception(f"No se pudo subir el archivo a Storage: {e}")

        # Insert metadata into database
        try:
            db_result = self.supabase.table("custom_templates").insert({
                "id": template_id,
                "user_id": user_id,
                "filename": filename,
                "storage_path": storage_path,
                "width": width,
                "height": height,
                "file_size": file_size,
                "photo_rect_norm": photo_rect_norm,
            }).execute()

            if not db_result.data:
                # Rollback: delete from storage
                try:
                    self.supabase.storage.from_(self.bucket_name).remove([storage_path])
                except:
                    pass
                raise Exception("No se pudo guardar los metadatos en la base de datos")

            template_data = db_result.data[0]

        except Exception as e:
            # Rollback: delete from storage
            try:
                self.supabase.storage.from_(self.bucket_name).remove([storage_path])
            except Exception as cleanup_error:
                # Log cleanup failure but don't mask original error
                print(f"Warning: Failed to cleanup storage file after DB error: {cleanup_error}")
            
            # Handle specific PostgreSQL errors with Spanish messages
            error_msg = str(e).lower()
            
            if "20 plantillas" in error_msg or "quota exceeded" in error_msg:
                raise Exception("Límite de 20 plantillas alcanzado. Elimina plantillas existentes antes de subir nuevas.")
            elif "unique" in error_msg and "violation" in error_msg:
                raise Exception("Error: ya existe una plantilla con este identificador")
            elif "foreign key" in error_msg:
                raise Exception("Error: el usuario especificado no existe en el sistema")
            elif "rollback" in error_msg or "transaction" in error_msg:
                raise Exception("Error de transacción: la operación fue revertida. Intenta nuevamente.")
            else:
                raise Exception(f"Error al guardar plantilla: {e}")

        # Generate URL
        try:
            url_result = self.supabase.storage.from_(self.bucket_name).get_public_url(storage_path)
            url = url_result
        except Exception:
            url = f"/{self.bucket_name}/{storage_path}"

        return {
            "id": template_data["id"],
            "filename": template_data["filename"],
            "url": url,
            "width": template_data["width"],
            "height": template_data["height"],
            "photoRectNorm": template_data["photo_rect_norm"],
            "createdAt": template_data["created_at"],
        }

    async def list_templates(self, user_id: str) -> list[dict]:
        """
        List all templates for a user.

        Args:
            user_id: User identifier

        Returns:
            List of template dicts with id, filename, url, width, height, photoRectNorm, createdAt
        """
        try:
            result = self.supabase.table("custom_templates").select("*").eq(
                "user_id", user_id
            ).order("created_at", desc=True).execute()

            templates = []
            for row in result.data:
                try:
                    url = self.supabase.storage.from_(self.bucket_name).get_public_url(
                        row["storage_path"]
                    )
                except Exception:
                    url = f"/{self.bucket_name}/{row['storage_path']}"

                templates.append({
                    "id": row["id"],
                    "filename": row["filename"],
                    "url": url,
                    "width": row["width"],
                    "height": row["height"],
                    "photoRectNorm": row["photo_rect_norm"],
                    "createdAt": row["created_at"],
                })

            return templates

        except Exception as e:
            # Handle database and network errors with Spanish messages
            error_msg = str(e).lower()
            
            if "network" in error_msg or "timeout" in error_msg or "connection" in error_msg:
                raise Exception("Error de red: no se pudo conectar a la base de datos. Intenta nuevamente.")
            
            raise Exception(f"Error al listar plantillas: {e}")

    async def get_template(self, user_id: str, template_id: str) -> Optional[dict]:
        """
        Get a specific template by ID.

        Args:
            user_id: User identifier
            template_id: Template UUID

        Returns:
            Template dict with id, filename, url, width, height, fileSize, photoRectNorm, createdAt
            or None if not found

        Raises:
            Exception: If template not found or doesn't belong to user
        """
        try:
            result = self.supabase.table("custom_templates").select("*").eq(
                "id", template_id
            ).eq("user_id", user_id).execute()

            if not result.data:
                raise Exception("Plantilla no encontrada")

            row = result.data[0]

            try:
                url = self.supabase.storage.from_(self.bucket_name).get_public_url(
                    row["storage_path"]
                )
            except Exception:
                url = f"/{self.bucket_name}/{row['storage_path']}"

            return {
                "id": row["id"],
                "filename": row["filename"],
                "url": url,
                "width": row["width"],
                "height": row["height"],
                "fileSize": row["file_size"],
                "photoRectNorm": row["photo_rect_norm"],
                "createdAt": row["created_at"],
            }

        except Exception as e:
            if "no encontrada" in str(e):
                raise
            
            # Handle database errors with Spanish messages
            error_msg = str(e).lower()
            if "network" in error_msg or "timeout" in error_msg or "connection" in error_msg:
                raise Exception("Error de red: no se pudo conectar a la base de datos. Intenta nuevamente.")
            
            raise Exception(f"Error al obtener plantilla: {e}")

    async def delete_template(self, user_id: str, template_id: str) -> bool:
        """
        Delete a template.

        Args:
            user_id: User identifier
            template_id: Template UUID

        Returns:
            True if deleted successfully

        Raises:
            Exception: If template not found or deletion fails
        """
        # First, get the template to verify ownership and get storage path
        try:
            result = self.supabase.table("custom_templates").select("storage_path").eq(
                "id", template_id
            ).eq("user_id", user_id).execute()

            if not result.data:
                raise Exception("Plantilla no encontrada")

            storage_path = result.data[0]["storage_path"]

        except Exception as e:
            if "no encontrada" in str(e):
                raise
            
            # Handle database errors with Spanish messages
            error_msg = str(e).lower()
            if "network" in error_msg or "timeout" in error_msg or "connection" in error_msg:
                raise Exception("Error de red: no se pudo conectar a la base de datos. Intenta nuevamente.")
            
            raise Exception(f"Error al verificar plantilla: {e}")

        # Delete from database
        try:
            delete_result = self.supabase.table("custom_templates").delete().eq(
                "id", template_id
            ).eq("user_id", user_id).execute()

            if not delete_result.data:
                raise Exception("No se pudo eliminar la plantilla de la base de datos")

        except Exception as e:
            error_msg = str(e).lower()
            
            # Handle specific database errors
            if "foreign key" in error_msg:
                raise Exception("Error: no se puede eliminar la plantilla debido a referencias existentes")
            elif "network" in error_msg or "timeout" in error_msg or "connection" in error_msg:
                raise Exception("Error de red: no se pudo conectar a la base de datos. Intenta nuevamente.")
            
            raise Exception(f"Error al eliminar plantilla de la base de datos: {e}")

        # Delete from storage
        try:
            self.supabase.storage.from_(self.bucket_name).remove([storage_path])
        except Exception as e:
            # Log warning but don't fail - DB record is already deleted
            # This handles orphaned files gracefully
            error_msg = str(e).lower()
            if "not found" not in error_msg and "404" not in error_msg:
                print(f"Warning: Could not delete file from storage: {e}")
            # If file not found, it's already cleaned up - no warning needed

        return True

    async def get_template_for_render(
        self, template_id: str
    ) -> Optional[tuple[bytes, dict]]:
        """
        Get template file and metadata for rendering (no user_id check).

        Args:
            template_id: Template UUID

        Returns:
            Tuple of (file_buffer, metadata_dict) or None if not found
        """
        try:
            # Get metadata
            result = self.supabase.table("custom_templates").select("*").eq(
                "id", template_id
            ).execute()

            if not result.data:
                print(f"Template {template_id} not found in database")
                return None

            row = result.data[0]
            storage_path = row["storage_path"]
            
            print(f"Downloading template from storage: {storage_path}")

            # Download file from storage
            file_result = self.supabase.storage.from_(self.bucket_name).download(
                storage_path
            )
            
            print(f"Downloaded {len(file_result)} bytes")

            metadata = {
                "width": row["width"],
                "height": row["height"],
                "photoRectNorm": row["photo_rect_norm"],
            }

            return (file_result, metadata)

        except Exception as e:
            print(f"Error in get_template_for_render: {e}")
            import traceback
            traceback.print_exc()
            return None
