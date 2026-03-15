"""
Property-Based Tests for Persistence and URL Generation

Tests Properties 21, 23, and 24 from the design document.
"""

import io
import asyncio
import pytest
from hypothesis import given, strategies as st, settings
from PIL import Image
from unittest.mock import Mock, MagicMock, patch
from template_manager import TemplateManager


# Helper to run async functions in sync context
def run_async(coro):
    """Run an async coroutine in a synchronous context."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)


# ============================================================================
# Test Helpers
# ============================================================================

def generate_valid_png(width: int = 1000, height: int = 1000) -> bytes:
    """Generate a valid PNG file buffer."""
    img = Image.new("RGBA", (width, height), color=(255, 255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def create_mock_supabase_client():
    """Create a mock Supabase client for testing."""
    mock_client = Mock()
    
    # Mock storage operations
    mock_storage = MagicMock()
    mock_client.storage.from_.return_value = mock_storage
    
    # Mock table operations
    mock_table = MagicMock()
    mock_client.table.return_value = mock_table
    
    return mock_client


# ============================================================================
# Property 21: Storage Persistence
# **Validates: Requirements 7.1**
# ============================================================================

class TestStoragePersistence:
    """
    Feature: custom-template-upload, Property 21: Storage Persistence
    
    For any template uploaded by a user, the file should persist in Supabase 
    Storage and remain accessible across server restarts or sessions.
    """

    @given(
        width=st.integers(min_value=500, max_value=4000),
        height=st.integers(min_value=500, max_value=4000),
        user_id=st.text(min_size=1, max_size=50, alphabet=st.characters(
            whitelist_categories=('Lu', 'Ll', 'Nd'), whitelist_characters='-_'
        ))
    )
    @settings(max_examples=20)
    def test_uploaded_files_persist_in_storage(self, width, height, user_id):
        """
        Property: Files uploaded to Storage should persist and be retrievable.
        
        This test verifies that:
        1. Files are successfully uploaded to Storage
        2. The storage path is correctly formatted with user_id
        3. Files can be retrieved after upload
        """
        mock_client = create_mock_supabase_client()
        
        # Generate test PNG
        png_buffer = generate_valid_png(width, height)
        
        # Mock successful upload
        mock_upload_result = Mock()
        mock_upload_result.error = None
        mock_client.storage.from_.return_value.upload.return_value = mock_upload_result
        
        # Mock successful DB insert
        mock_db_result = Mock()
        mock_db_result.data = [{
            "id": "test-template-id",
            "user_id": user_id,
            "filename": "template.png",
            "storage_path": f"{user_id}/test-template-id.png",
            "width": width,
            "height": height,
            "file_size": len(png_buffer),
            "photo_rect_norm": {"x": 0.39, "y": 0.48, "w": 0.22, "h": 0.22},
            "created_at": "2024-01-01T00:00:00Z"
        }]
        mock_client.table.return_value.insert.return_value.execute.return_value = mock_db_result
        
        # Mock URL generation
        expected_url = f"https://storage.example.com/custom-templates/{user_id}/test-template-id.png"
        mock_client.storage.from_.return_value.get_public_url.return_value = expected_url
        
        manager = TemplateManager(mock_client)
        
        # Upload template
        result = run_async(manager.upload_template(user_id, png_buffer, {"filename": "template.png"}))
        
        # Verify upload was called with correct path
        upload_call = mock_client.storage.from_.return_value.upload.call_args
        storage_path = upload_call[0][0]
        
        # Storage path should include user_id for isolation
        assert user_id in storage_path
        assert storage_path.endswith(".png")
        
        # Verify file buffer was uploaded
        uploaded_buffer = upload_call[0][1]
        assert uploaded_buffer == png_buffer
        
        # Verify result contains URL
        assert "url" in result
        assert result["url"] == expected_url

    @given(
        num_templates=st.integers(min_value=1, max_value=5)
    )
    @settings(max_examples=20)
    def test_multiple_uploads_persist_independently(self, num_templates):
        """
        Property: Multiple templates uploaded by the same user should all persist.
        
        This verifies that the storage system can handle multiple files
        from the same user without conflicts.
        """
        mock_client = create_mock_supabase_client()
        user_id = "test-user"
        
        uploaded_ids = []
        
        for i in range(num_templates):
            png_buffer = generate_valid_png(1000, 1000)
            template_id = f"template-{i}"
            
            # Mock successful upload
            mock_upload_result = Mock()
            mock_upload_result.error = None
            mock_client.storage.from_.return_value.upload.return_value = mock_upload_result
            
            # Mock successful DB insert
            mock_db_result = Mock()
            mock_db_result.data = [{
                "id": template_id,
                "user_id": user_id,
                "filename": f"template-{i}.png",
                "storage_path": f"{user_id}/{template_id}.png",
                "width": 1000,
                "height": 1000,
                "file_size": len(png_buffer),
                "photo_rect_norm": {"x": 0.39, "y": 0.48, "w": 0.22, "h": 0.22},
                "created_at": "2024-01-01T00:00:00Z"
            }]
            mock_client.table.return_value.insert.return_value.execute.return_value = mock_db_result
            
            # Mock URL generation
            mock_client.storage.from_.return_value.get_public_url.return_value = f"https://example.com/{template_id}.png"
            
            manager = TemplateManager(mock_client)
            result = run_async(manager.upload_template(user_id, png_buffer, {"filename": f"template-{i}.png"}))
            
            uploaded_ids.append(result["id"])
        
        # All templates should have unique IDs
        assert len(set(uploaded_ids)) == num_templates


# ============================================================================
# Property 23: URL Generation
# **Validates: Requirements 7.3**
# ============================================================================

class TestURLGeneration:
    """
    Feature: custom-template-upload, Property 23: URL Generation
    
    For any uploaded template, the Template_Manager should generate and 
    return a valid, accessible URL.
    """

    @given(
        width=st.integers(min_value=500, max_value=4000),
        height=st.integers(min_value=500, max_value=4000)
    )
    @settings(max_examples=20)
    def test_upload_returns_valid_url(self, width, height):
        """
        Property: Every uploaded template should have a URL in the response.
        
        This verifies that URL generation is part of the upload process
        and the URL is included in the response.
        """
        mock_client = create_mock_supabase_client()
        user_id = "test-user"
        png_buffer = generate_valid_png(width, height)
        
        # Mock successful upload
        mock_upload_result = Mock()
        mock_upload_result.error = None
        mock_client.storage.from_.return_value.upload.return_value = mock_upload_result
        
        # Mock successful DB insert
        template_id = "test-template-id"
        storage_path = f"{user_id}/{template_id}.png"
        mock_db_result = Mock()
        mock_db_result.data = [{
            "id": template_id,
            "user_id": user_id,
            "filename": "template.png",
            "storage_path": storage_path,
            "width": width,
            "height": height,
            "file_size": len(png_buffer),
            "photo_rect_norm": {"x": 0.39, "y": 0.48, "w": 0.22, "h": 0.22},
            "created_at": "2024-01-01T00:00:00Z"
        }]
        mock_client.table.return_value.insert.return_value.execute.return_value = mock_db_result
        
        # Mock URL generation
        expected_url = f"https://storage.example.com/custom-templates/{storage_path}"
        mock_client.storage.from_.return_value.get_public_url.return_value = expected_url
        
        manager = TemplateManager(mock_client)
        result = run_async(manager.upload_template(user_id, png_buffer, {"filename": "template.png"}))
        
        # Verify URL is present and non-empty
        assert "url" in result
        assert isinstance(result["url"], str)
        assert len(result["url"]) > 0
        assert result["url"] == expected_url

    @given(
        user_id=st.text(min_size=1, max_size=50, alphabet=st.characters(
            whitelist_categories=('Lu', 'Ll', 'Nd'), whitelist_characters='-_'
        ))
    )
    @settings(max_examples=20)
    def test_list_templates_includes_urls(self, user_id):
        """
        Property: All templates in list response should include URLs.
        
        This verifies that URL generation works for list operations.
        """
        mock_client = create_mock_supabase_client()
        
        # Mock DB query result with multiple templates
        mock_db_result = Mock()
        mock_db_result.data = [
            {
                "id": f"template-{i}",
                "user_id": user_id,
                "filename": f"template-{i}.png",
                "storage_path": f"{user_id}/template-{i}.png",
                "width": 1000,
                "height": 1000,
                "file_size": 100000,
                "photo_rect_norm": {"x": 0.39, "y": 0.48, "w": 0.22, "h": 0.22},
                "created_at": "2024-01-01T00:00:00Z"
            }
            for i in range(3)
        ]
        mock_client.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = mock_db_result
        
        # Mock URL generation for each template
        def mock_get_url(path):
            return f"https://storage.example.com/custom-templates/{path}"
        
        mock_client.storage.from_.return_value.get_public_url.side_effect = mock_get_url
        
        manager = TemplateManager(mock_client)
        templates = run_async(manager.list_templates(user_id))
        
        # All templates should have URLs
        assert len(templates) == 3
        for template in templates:
            assert "url" in template
            assert isinstance(template["url"], str)
            assert len(template["url"]) > 0
            assert "custom-templates" in template["url"]

    @given(
        user_id=st.text(min_size=1, max_size=50, alphabet=st.characters(
            whitelist_categories=('Lu', 'Ll', 'Nd'), whitelist_characters='-_'
        ))
    )
    @settings(max_examples=20)
    def test_get_template_includes_url(self, user_id):
        """
        Property: Individual template retrieval should include URL.
        
        This verifies that URL generation works for get operations.
        """
        mock_client = create_mock_supabase_client()
        template_id = "test-template-id"
        storage_path = f"{user_id}/{template_id}.png"
        
        # Mock DB query result
        mock_db_result = Mock()
        mock_db_result.data = [{
            "id": template_id,
            "user_id": user_id,
            "filename": "template.png",
            "storage_path": storage_path,
            "width": 1000,
            "height": 1000,
            "file_size": 100000,
            "photo_rect_norm": {"x": 0.39, "y": 0.48, "w": 0.22, "h": 0.22},
            "created_at": "2024-01-01T00:00:00Z"
        }]
        mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = mock_db_result
        
        # Mock URL generation
        expected_url = f"https://storage.example.com/custom-templates/{storage_path}"
        mock_client.storage.from_.return_value.get_public_url.return_value = expected_url
        
        manager = TemplateManager(mock_client)
        template = run_async(manager.get_template(user_id, template_id))
        
        # Verify URL is present
        assert template is not None
        assert "url" in template
        assert isinstance(template["url"], str)
        assert template["url"] == expected_url


# ============================================================================
# Property 24: File Integrity
# **Validates: Requirements 7.4**
# ============================================================================

class TestFileIntegrity:
    """
    Feature: custom-template-upload, Property 24: File Integrity
    
    For any PNG file uploaded, when downloaded from Storage, the file should 
    be byte-for-byte identical to the original (no additional compression 
    or modification).
    """

    @given(
        width=st.integers(min_value=500, max_value=2000),
        height=st.integers(min_value=500, max_value=2000)
    )
    @settings(max_examples=20)
    def test_uploaded_file_matches_original(self, width, height):
        """
        Property: Downloaded file should be identical to uploaded file.
        
        This verifies that Storage preserves file integrity without
        additional compression or modification.
        """
        mock_client = create_mock_supabase_client()
        user_id = "test-user"
        template_id = "test-template-id"
        
        # Generate original PNG
        original_buffer = generate_valid_png(width, height)
        
        # Mock successful upload
        mock_upload_result = Mock()
        mock_upload_result.error = None
        mock_client.storage.from_.return_value.upload.return_value = mock_upload_result
        
        # Mock successful DB insert
        storage_path = f"{user_id}/{template_id}.png"
        mock_db_result = Mock()
        mock_db_result.data = [{
            "id": template_id,
            "user_id": user_id,
            "filename": "template.png",
            "storage_path": storage_path,
            "width": width,
            "height": height,
            "file_size": len(original_buffer),
            "photo_rect_norm": {"x": 0.39, "y": 0.48, "w": 0.22, "h": 0.22},
            "created_at": "2024-01-01T00:00:00Z"
        }]
        mock_client.table.return_value.insert.return_value.execute.return_value = mock_db_result
        
        # Mock URL generation
        mock_client.storage.from_.return_value.get_public_url.return_value = f"https://example.com/{template_id}.png"
        
        # Upload template
        manager = TemplateManager(mock_client)
        run_async(manager.upload_template(user_id, original_buffer, {"filename": "template.png"}))
        
        # Mock download - return the same buffer
        mock_client.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_db_result
        mock_client.storage.from_.return_value.download.return_value = original_buffer
        
        # Download template for render
        result = run_async(manager.get_template_for_render(template_id))
        
        assert result is not None
        downloaded_buffer, metadata = result
        
        # Verify byte-for-byte match
        assert downloaded_buffer == original_buffer
        assert len(downloaded_buffer) == len(original_buffer)

    @given(
        width=st.integers(min_value=500, max_value=2000),
        height=st.integers(min_value=500, max_value=2000)
    )
    @settings(max_examples=20)
    def test_file_dimensions_preserved(self, width, height):
        """
        Property: Image dimensions should be preserved after upload/download.
        
        This verifies that the image can be opened and has the same
        dimensions as the original.
        """
        mock_client = create_mock_supabase_client()
        user_id = "test-user"
        template_id = "test-template-id"
        
        # Generate original PNG
        original_buffer = generate_valid_png(width, height)
        
        # Mock successful upload
        mock_upload_result = Mock()
        mock_upload_result.error = None
        mock_client.storage.from_.return_value.upload.return_value = mock_upload_result
        
        # Mock successful DB insert
        storage_path = f"{user_id}/{template_id}.png"
        mock_db_result = Mock()
        mock_db_result.data = [{
            "id": template_id,
            "user_id": user_id,
            "filename": "template.png",
            "storage_path": storage_path,
            "width": width,
            "height": height,
            "file_size": len(original_buffer),
            "photo_rect_norm": {"x": 0.39, "y": 0.48, "w": 0.22, "h": 0.22},
            "created_at": "2024-01-01T00:00:00Z"
        }]
        mock_client.table.return_value.insert.return_value.execute.return_value = mock_db_result
        
        # Mock URL generation
        mock_client.storage.from_.return_value.get_public_url.return_value = f"https://example.com/{template_id}.png"
        
        # Upload template
        manager = TemplateManager(mock_client)
        result = run_async(manager.upload_template(user_id, original_buffer, {"filename": "template.png"}))
        
        # Verify dimensions in response
        assert result["width"] == width
        assert result["height"] == height
        
        # Mock download
        mock_client.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_db_result
        mock_client.storage.from_.return_value.download.return_value = original_buffer
        
        # Download and verify
        download_result = run_async(manager.get_template_for_render(template_id))
        assert download_result is not None
        
        downloaded_buffer, metadata = download_result
        
        # Verify metadata dimensions
        assert metadata["width"] == width
        assert metadata["height"] == height
        
        # Verify actual image dimensions
        img = Image.open(io.BytesIO(downloaded_buffer))
        assert img.size == (width, height)
        assert img.format == "PNG"
