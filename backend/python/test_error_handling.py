"""
Unit Tests for Error Handling

Tests robust error handling for Supabase Storage, PostgreSQL, and resource cleanup.
"""

import io
import pytest
from unittest.mock import Mock, MagicMock, patch
from PIL import Image
from template_manager import TemplateManager


# ============================================================================
# Test Helpers
# ============================================================================

def generate_valid_png(width: int = 1000, height: int = 1000) -> bytes:
    """Generate a valid PNG file buffer."""
    img = Image.new("RGBA", (width, height), color=(255, 255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


# ============================================================================
# Unit Tests - Supabase Storage Error Handling
# ============================================================================

class TestStorageErrorHandling:
    """Tests for Supabase Storage error handling."""

    @pytest.mark.asyncio
    async def test_bucket_not_found_error(self):
        """Should handle bucket not found error with Spanish message."""
        mock_supabase = Mock()
        mock_storage = Mock()
        mock_bucket = Mock()
        
        # Simulate bucket not found error
        mock_bucket.upload.side_effect = Exception("Bucket not found")
        mock_storage.from_.return_value = mock_bucket
        mock_supabase.storage = mock_storage
        
        manager = TemplateManager(mock_supabase)
        buffer = generate_valid_png()
        
        with pytest.raises(Exception) as exc_info:
            await manager.upload_template("user-123", buffer, {})
        
        error_msg = str(exc_info.value)
        assert "storage" in error_msg.lower() or "almacenamiento" in error_msg.lower()

    @pytest.mark.asyncio
    async def test_duplicate_file_error(self):
        """Should handle duplicate file error with Spanish message."""
        mock_supabase = Mock()
        mock_storage = Mock()
        mock_bucket = Mock()
        
        # Simulate duplicate error
        mock_bucket.upload.side_effect = Exception("Duplicate object")
        mock_storage.from_.return_value = mock_bucket
        mock_supabase.storage = mock_storage
        
        manager = TemplateManager(mock_supabase)
        buffer = generate_valid_png()
        
        with pytest.raises(Exception) as exc_info:
            await manager.upload_template("user-123", buffer, {})
        
        error_msg = str(exc_info.value)
        assert "storage" in error_msg.lower() or "almacenamiento" in error_msg.lower()

    @pytest.mark.asyncio
    async def test_network_error_during_upload(self):
        """Should handle network errors with descriptive Spanish message."""
        mock_supabase = Mock()
        mock_storage = Mock()
        mock_bucket = Mock()
        
        # Simulate network error
        mock_bucket.upload.side_effect = Exception("Connection timeout")
        mock_storage.from_.return_value = mock_bucket
        mock_supabase.storage = mock_storage
        
        manager = TemplateManager(mock_supabase)
        buffer = generate_valid_png()
        
        with pytest.raises(Exception) as exc_info:
            await manager.upload_template("user-123", buffer, {})
        
        error_msg = str(exc_info.value)
        assert "storage" in error_msg.lower() or "almacenamiento" in error_msg.lower()


# ============================================================================
# Unit Tests - PostgreSQL Error Handling
# ============================================================================

class TestDatabaseErrorHandling:
    """Tests for PostgreSQL error handling."""

    @pytest.mark.asyncio
    async def test_unique_violation_error(self):
        """Should handle unique constraint violation with Spanish message."""
        mock_supabase = Mock()
        
        # Mock successful storage upload
        mock_storage = Mock()
        mock_bucket = Mock()
        mock_bucket.upload.return_value = Mock(error=None)
        mock_bucket.remove.return_value = None
        mock_storage.from_.return_value = mock_bucket
        mock_supabase.storage = mock_storage
        
        # Mock database unique violation
        mock_table = Mock()
        mock_error = Mock()
        mock_error.code = "23505"  # PostgreSQL unique violation code
        mock_result = Mock()
        mock_result.data = None
        mock_result.error = mock_error
        mock_table.insert.return_value.execute.side_effect = Exception("duplicate key value violates unique constraint")
        mock_supabase.table.return_value = mock_table
        
        manager = TemplateManager(mock_supabase)
        buffer = generate_valid_png()
        
        with pytest.raises(Exception) as exc_info:
            await manager.upload_template("user-123", buffer, {})
        
        error_msg = str(exc_info.value)
        # Should contain error message in Spanish
        assert len(error_msg) > 0

    @pytest.mark.asyncio
    async def test_quota_exceeded_error(self):
        """Should handle quota exceeded error with Spanish message."""
        mock_supabase = Mock()
        
        # Mock successful storage upload
        mock_storage = Mock()
        mock_bucket = Mock()
        mock_bucket.upload.return_value = Mock(error=None)
        mock_bucket.remove.return_value = None
        mock_storage.from_.return_value = mock_bucket
        mock_supabase.storage = mock_storage
        
        # Mock database quota error
        mock_table = Mock()
        mock_table.insert.return_value.execute.side_effect = Exception("Template quota exceeded: maximum 20 plantillas per user")
        mock_supabase.table.return_value = mock_table
        
        manager = TemplateManager(mock_supabase)
        buffer = generate_valid_png()
        
        with pytest.raises(Exception) as exc_info:
            await manager.upload_template("user-123", buffer, {})
        
        error_msg = str(exc_info.value)
        assert "20 plantillas" in error_msg or "quota" in error_msg.lower()

    @pytest.mark.asyncio
    async def test_foreign_key_violation_error(self):
        """Should handle foreign key constraint violation."""
        mock_supabase = Mock()
        
        # Mock successful storage upload
        mock_storage = Mock()
        mock_bucket = Mock()
        mock_bucket.upload.return_value = Mock(error=None)
        mock_bucket.remove.return_value = None
        mock_storage.from_.return_value = mock_bucket
        mock_supabase.storage = mock_storage
        
        # Mock database foreign key error
        mock_table = Mock()
        mock_table.insert.return_value.execute.side_effect = Exception("foreign key constraint violation")
        mock_supabase.table.return_value = mock_table
        
        manager = TemplateManager(mock_supabase)
        buffer = generate_valid_png()
        
        with pytest.raises(Exception) as exc_info:
            await manager.upload_template("user-123", buffer, {})
        
        error_msg = str(exc_info.value)
        assert len(error_msg) > 0


# ============================================================================
# Unit Tests - Resource Cleanup
# ============================================================================

class TestResourceCleanup:
    """Tests for resource cleanup on failures."""

    @pytest.mark.asyncio
    async def test_cleanup_storage_on_db_failure(self):
        """Should delete file from Storage if DB insertion fails."""
        mock_supabase = Mock()
        
        # Mock successful storage upload
        mock_storage = Mock()
        mock_bucket = Mock()
        mock_bucket.upload.return_value = Mock(error=None)
        mock_bucket.remove = Mock(return_value=None)
        mock_storage.from_.return_value = mock_bucket
        mock_supabase.storage = mock_storage
        
        # Mock database failure
        mock_table = Mock()
        mock_table.insert.return_value.execute.side_effect = Exception("Database error")
        mock_supabase.table.return_value = mock_table
        
        manager = TemplateManager(mock_supabase)
        buffer = generate_valid_png()
        
        with pytest.raises(Exception):
            await manager.upload_template("user-123", buffer, {})
        
        # Verify cleanup was attempted
        mock_bucket.remove.assert_called_once()

    @pytest.mark.asyncio
    async def test_cleanup_continues_on_storage_delete_failure(self):
        """Should not fail if storage cleanup fails (orphaned file)."""
        mock_supabase = Mock()
        
        # Mock successful storage upload
        mock_storage = Mock()
        mock_bucket = Mock()
        mock_bucket.upload.return_value = Mock(error=None)
        # Mock storage delete failure
        mock_bucket.remove.side_effect = Exception("Storage delete failed")
        mock_storage.from_.return_value = mock_bucket
        mock_supabase.storage = mock_storage
        
        # Mock database failure
        mock_table = Mock()
        mock_table.insert.return_value.execute.side_effect = Exception("Database error")
        mock_supabase.table.return_value = mock_table
        
        manager = TemplateManager(mock_supabase)
        buffer = generate_valid_png()
        
        # Should still raise the original database error, not the cleanup error
        with pytest.raises(Exception) as exc_info:
            await manager.upload_template("user-123", buffer, {})
        
        assert "database" in str(exc_info.value).lower() or "base de datos" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_delete_handles_missing_storage_file(self):
        """Should handle case where storage file is already deleted."""
        mock_supabase = Mock()
        
        # Mock database query success
        mock_table = Mock()
        mock_select = Mock()
        mock_select.eq.return_value.eq.return_value.execute.return_value = Mock(
            data=[{"storage_path": "user-123/template-id.png"}]
        )
        mock_table.select.return_value = mock_select
        
        # Mock database delete success
        mock_delete = Mock()
        mock_delete.eq.return_value.eq.return_value.execute.return_value = Mock(
            data=[{"id": "template-id"}]
        )
        mock_table.delete.return_value = mock_delete
        mock_supabase.table.return_value = mock_table
        
        # Mock storage delete failure (file not found)
        mock_storage = Mock()
        mock_bucket = Mock()
        mock_bucket.remove.side_effect = Exception("File not found")
        mock_storage.from_.return_value = mock_bucket
        mock_supabase.storage = mock_storage
        
        manager = TemplateManager(mock_supabase)
        
        # Should succeed despite storage error (DB record is deleted)
        result = await manager.delete_template("user-123", "template-id")
        assert result is True


# ============================================================================
# Unit Tests - Validation Error Messages
# ============================================================================

class TestValidationErrorMessages:
    """Tests for descriptive validation error messages in Spanish."""

    def test_invalid_format_error_message(self):
        """Should return descriptive error for invalid format."""
        manager = TemplateManager(None)
        jpeg_buffer = io.BytesIO()
        img = Image.new("RGB", (1000, 1000), color=(255, 0, 0))
        img.save(jpeg_buffer, format="JPEG")
        
        result = manager.validate_png(jpeg_buffer.getvalue())
        
        assert result["valid"] is False
        assert "png" in result["error"].lower()
        assert "formato" in result["error"].lower()

    def test_oversized_file_error_message(self):
        """Should return descriptive error for oversized file."""
        manager = TemplateManager(None)
        buffer = b"x" * (11 * 1024 * 1024)  # 11MB
        
        result = manager.validate_png(buffer)
        
        assert result["valid"] is False
        assert "10mb" in result["error"].lower()

    def test_invalid_dimensions_error_message(self):
        """Should return descriptive error with actual dimensions."""
        manager = TemplateManager(None)
        buffer = generate_valid_png(300, 300)
        
        result = manager.validate_png(buffer)
        
        assert result["valid"] is False
        assert "300x300" in result["error"]
        assert "dimensiones" in result["error"].lower()

    def test_invalid_photo_rect_norm_range_error(self):
        """Should return descriptive error for out-of-range values."""
        manager = TemplateManager(None)
        rect = {"x": 1.5, "y": 0.5, "w": 0.3, "h": 0.3}
        
        result = manager.validate_photo_rect_norm(rect)
        
        assert result["valid"] is False
        assert "0.0 y 1.0" in result["error"]
        assert "1.5" in result["error"]

    def test_invalid_photo_rect_norm_structure_error(self):
        """Should return descriptive error for missing properties."""
        manager = TemplateManager(None)
        rect = {"x": 0.5, "y": 0.5}  # Missing w and h
        
        result = manager.validate_photo_rect_norm(rect)
        
        assert result["valid"] is False
        assert "w" in result["error"] or "h" in result["error"]


# ============================================================================
# Unit Tests - Authorization Errors
# ============================================================================

class TestAuthorizationErrors:
    """Tests for authorization and resource not found errors."""

    @pytest.mark.asyncio
    async def test_get_template_not_found(self):
        """Should return 404-style error for non-existent template."""
        mock_supabase = Mock()
        mock_table = Mock()
        mock_select = Mock()
        mock_select.eq.return_value.eq.return_value.execute.return_value = Mock(data=[])
        mock_table.select.return_value = mock_select
        mock_supabase.table.return_value = mock_table
        
        manager = TemplateManager(mock_supabase)
        
        with pytest.raises(Exception) as exc_info:
            await manager.get_template("user-123", "non-existent-id")
        
        assert "no encontrada" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_delete_template_not_found(self):
        """Should return 404-style error when deleting non-existent template."""
        mock_supabase = Mock()
        mock_table = Mock()
        mock_select = Mock()
        mock_select.eq.return_value.eq.return_value.execute.return_value = Mock(data=[])
        mock_table.select.return_value = mock_select
        mock_supabase.table.return_value = mock_table
        
        manager = TemplateManager(mock_supabase)
        
        with pytest.raises(Exception) as exc_info:
            await manager.delete_template("user-123", "non-existent-id")
        
        assert "no encontrada" in str(exc_info.value).lower()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
