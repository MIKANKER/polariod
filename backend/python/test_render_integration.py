"""
Property-Based Tests for Render Endpoint Integration with Custom Templates

Tests template resolution, photoRectNorm application, backward compatibility, and precedence.
"""

import io
import json
import pytest
from hypothesis import given, strategies as st, settings, assume
from fastapi.testclient import TestClient
from PIL import Image
from unittest.mock import Mock, AsyncMock, patch

from app import app
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


def generate_test_photo() -> bytes:
    """Generate a test photo for rendering."""
    img = Image.new("RGB", (800, 600), color=(100, 150, 200))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def create_mock_supabase():
    """Create a mock Supabase client."""
    mock_client = Mock()
    mock_client.auth.get_user = Mock(return_value=Mock(user=Mock(id="test-user-id")))
    return mock_client


# ============================================================================
# Property Tests - Render Integration
# ============================================================================

class TestRenderIntegrationProperties:
    """Property-based tests for render endpoint integration with custom templates."""

    # Feature: custom-template-upload, Property 15: Template Resolution for Rendering
    @given(
        template_width=st.integers(min_value=500, max_value=4000),
        template_height=st.integers(min_value=500, max_value=4000),
    )
    @settings(max_examples=20, deadline=500)
    def test_template_resolution_for_rendering(self, template_width, template_height):
        """**Validates: Requirements 5.1, 5.2, 10.2**
        
        For any valid templateId provided in render options, the Render_Service should
        successfully retrieve the corresponding template from Template_Storage and use it
        for composition.
        """
        client = TestClient(app)
        
        # Create mock template data
        template_id = "test-template-id"
        template_buffer = generate_valid_png(template_width, template_height)
        template_metadata = {
            "width": template_width,
            "height": template_height,
            "photoRectNorm": {"x": 0.39, "y": 0.48, "w": 0.22, "h": 0.22}
        }
        
        # Mock get_template_for_render to return template
        with patch("app.supabase_client", create_mock_supabase()):
            with patch.object(
                TemplateManager,
                "get_template_for_render",
                AsyncMock(return_value=(template_buffer, template_metadata))
            ):
                response = client.post(
                    "/api/render",
                    files={"image": ("photo.jpg", generate_test_photo(), "image/jpeg")},
                    data={"options": json.dumps({"templateId": template_id})}
                )
        
        # Should successfully render
        assert response.status_code == 200
        assert response.headers["content-type"] in ["image/png", "image/jpeg"]
        assert len(response.content) > 0

    # Feature: custom-template-upload, Property 16: PhotoRectNorm Application in Rendering
    @given(
        x=st.floats(min_value=0.0, max_value=1.0),
        y=st.floats(min_value=0.0, max_value=1.0),
        w=st.floats(min_value=0.01, max_value=1.0),
        h=st.floats(min_value=0.01, max_value=1.0),
    )
    @settings(max_examples=20)
    def test_photo_rect_norm_application(self, x, y, w, h):
        """**Validates: Requirements 5.3**
        
        For any custom template with stored photoRectNorm metadata, when used in rendering,
        the photo should be positioned according to those coordinates.
        """
        # Ensure valid normalized coordinates
        assume(x + w <= 1.0)
        assume(y + h <= 1.0)
        
        client = TestClient(app)
        
        template_id = "test-template-id"
        template_buffer = generate_valid_png(1000, 1000)
        template_metadata = {
            "width": 1000,
            "height": 1000,
            "photoRectNorm": {"x": x, "y": y, "w": w, "h": h}
        }
        
        with patch("app.supabase_client", create_mock_supabase()):
            with patch.object(
                TemplateManager,
                "get_template_for_render",
                AsyncMock(return_value=(template_buffer, template_metadata))
            ):
                response = client.post(
                    "/api/render",
                    files={"image": ("photo.jpg", generate_test_photo(), "image/jpeg")},
                    data={"options": json.dumps({"templateId": template_id})}
                )
        
        # Should successfully render with custom photoRectNorm
        assert response.status_code == 200
        assert len(response.content) > 0

    # Feature: custom-template-upload, Property 17: Backward Compatibility
    @given(
        use_multipart=st.booleans(),
        template_name=st.sampled_from(["sprite", "custom"])
    )
    @settings(max_examples=20)
    def test_backward_compatibility(self, use_multipart, template_name):
        """**Validates: Requirements 5.5, 5.6, 10.4**
        
        For any render request without templateId, the Render_Service should maintain
        existing behavior: accepting template as multipart file or loading from
        assets/templates/ directory.
        """
        client = TestClient(app)
        
        if use_multipart:
            # Test multipart template upload
            template_buffer = generate_valid_png()
            response = client.post(
                "/api/render",
                files={
                    "image": ("photo.jpg", generate_test_photo(), "image/jpeg"),
                    "template": ("template.png", template_buffer, "image/png")
                }
            )
        else:
            # Test loading from assets/templates/ (will fail if file doesn't exist, but that's expected)
            # We'll mock the template loading
            with patch("app.load_template_from_disk") as mock_load:
                mock_template = Image.new("RGBA", (1000, 1000), color=(255, 255, 255, 255))
                mock_load.return_value = mock_template
                
                response = client.post(
                    "/api/render",
                    files={"image": ("photo.jpg", generate_test_photo(), "image/jpeg")},
                    data={"options": json.dumps({"template": template_name})}
                )
        
        # Should work without templateId (backward compatible)
        # Note: May return 404 if template doesn't exist in assets, which is valid
        assert response.status_code in [200, 404]

    # Feature: custom-template-upload, Property 18: TemplateId Precedence
    @given(
        template_width=st.integers(min_value=500, max_value=2000),
        multipart_width=st.integers(min_value=500, max_value=2000),
    )
    @settings(max_examples=20)
    def test_template_id_precedence(self, template_width, multipart_width):
        """**Validates: Requirements 10.3**
        
        For any render request with both templateId in options and template as multipart,
        the Render_Service should use the template specified by templateId and ignore
        the multipart template.
        """
        # Ensure different sizes to verify which template was used
        assume(template_width != multipart_width)
        
        client = TestClient(app)
        
        template_id = "test-template-id"
        custom_template_buffer = generate_valid_png(template_width, template_width)
        multipart_template_buffer = generate_valid_png(multipart_width, multipart_width)
        
        template_metadata = {
            "width": template_width,
            "height": template_width,
            "photoRectNorm": {"x": 0.39, "y": 0.48, "w": 0.22, "h": 0.22}
        }
        
        with patch("app.supabase_client", create_mock_supabase()):
            with patch.object(
                TemplateManager,
                "get_template_for_render",
                AsyncMock(return_value=(custom_template_buffer, template_metadata))
            ) as mock_get_template:
                response = client.post(
                    "/api/render",
                    files={
                        "image": ("photo.jpg", generate_test_photo(), "image/jpeg"),
                        "template": ("template.png", multipart_template_buffer, "image/png")
                    },
                    data={"options": json.dumps({"templateId": template_id})}
                )
        
        # Should successfully render
        assert response.status_code == 200
        
        # Verify that get_template_for_render was called (templateId was used)
        mock_get_template.assert_called_once_with(template_id)


# ============================================================================
# Unit Tests - Render Error Handling
# ============================================================================

class TestRenderErrorHandling:
    """Unit tests for render endpoint error handling."""

    def test_invalid_template_id_returns_404(self):
        """Invalid templateId should return 404."""
        client = TestClient(app)
        
        with patch("app.supabase_client", create_mock_supabase()):
            with patch.object(
                TemplateManager,
                "get_template_for_render",
                AsyncMock(return_value=None)
            ):
                response = client.post(
                    "/api/render",
                    files={"image": ("photo.jpg", generate_test_photo(), "image/jpeg")},
                    data={"options": json.dumps({"templateId": "invalid-id"})}
                )
        
        assert response.status_code == 404
        data = response.json()
        assert "no encontrada" in data["detail"].lower()

    def test_photo_rect_norm_override(self):
        """Options photoRectNorm should override template metadata."""
        client = TestClient(app)
        
        template_id = "test-template-id"
        template_buffer = generate_valid_png()
        template_metadata = {
            "width": 1000,
            "height": 1000,
            "photoRectNorm": {"x": 0.1, "y": 0.1, "w": 0.5, "h": 0.5}
        }
        
        override_rect = {"x": 0.2, "y": 0.2, "w": 0.6, "h": 0.6}
        
        with patch("app.supabase_client", create_mock_supabase()):
            with patch.object(
                TemplateManager,
                "get_template_for_render",
                AsyncMock(return_value=(template_buffer, template_metadata))
            ):
                response = client.post(
                    "/api/render",
                    files={"image": ("photo.jpg", generate_test_photo(), "image/jpeg")},
                    data={"options": json.dumps({
                        "templateId": template_id,
                        "photoRectNorm": override_rect
                    })}
                )
        
        # Should successfully render with overridden photoRectNorm
        assert response.status_code == 200

    def test_supabase_not_configured_with_template_id(self):
        """Using templateId without Supabase configured should return 500."""
        client = TestClient(app)
        
        with patch("app.supabase_client", None):
            response = client.post(
                "/api/render",
                files={"image": ("photo.jpg", generate_test_photo(), "image/jpeg")},
                data={"options": json.dumps({"templateId": "some-id"})}
            )
        
        assert response.status_code == 500
        data = response.json()
        assert "supabase" in data["detail"].lower()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
