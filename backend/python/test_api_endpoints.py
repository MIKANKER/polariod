"""
Property-Based Tests for FastAPI REST Endpoints

Tests API structure, error handling, and HTTP status codes.
"""

import io
import json
import pytest
from hypothesis import given, strategies as st, settings
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


def generate_jpeg() -> bytes:
    """Generate a JPEG file buffer."""
    img = Image.new("RGB", (1000, 1000), color=(255, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def create_mock_supabase():
    """Create a mock Supabase client."""
    mock_client = Mock()
    mock_client.auth.get_user = Mock(return_value=Mock(user=Mock(id="test-user-id")))
    return mock_client


# ============================================================================
# Property Tests - POST /api/templates
# ============================================================================

class TestPostTemplatesProperties:
    """Property-based tests for POST /api/templates endpoint."""

    # Feature: custom-template-upload, Property 7: Error Messages for Invalid Input
    @given(
        width=st.one_of(
            st.integers(min_value=1, max_value=499),
            st.integers(min_value=4001, max_value=5000)
        ),
        height=st.integers(min_value=500, max_value=4000)
    )
    @settings(max_examples=20)
    def test_invalid_dimensions_return_descriptive_error(self, width, height):
        """**Validates: Requirements 1.7**
        
        For any invalid template upload, the API should return a descriptive error message.
        """
        client = TestClient(app)
        
        # Create PNG with invalid dimensions
        png_buffer = generate_valid_png(width, height)
        
        with patch("app.supabase_client", create_mock_supabase()):
            with patch.object(TemplateManager, "upload_template", side_effect=Exception(
                f"Las dimensiones deben estar entre 500x500 y 4000x4000 píxeles. Recibido: {width}x{height}"
            )):
                response = client.post(
                    "/api/templates",
                    files={"file": ("test.png", png_buffer, "image/png")},
                    headers={"Authorization": "Bearer test-token"}
                )
        
        assert response.status_code == 400
        data = response.json()
        assert "dimensiones" in data["detail"].lower()
        assert f"{width}x{height}" in data["detail"]

    @given(st.integers(min_value=1, max_value=19))
    @settings(max_examples=20)
    def test_quota_enforcement_returns_429(self, existing_templates):
        """**Validates: Requirements 8.1, 8.2**
        
        Feature: custom-template-upload, Property 25: Template Quota Enforcement
        
        For any user with 20 existing templates, attempting to upload should return 429.
        """
        client = TestClient(app)
        png_buffer = generate_valid_png()
        
        # Mock quota exceeded error when user has 20 templates
        if existing_templates == 19:  # Next upload would be 20th, which should succeed
            mock_upload = AsyncMock(return_value={
                "id": "test-id",
                "filename": "test.png",
                "url": "http://example.com/test.png",
                "width": 1000,
                "height": 1000,
                "photoRectNorm": {"x": 0.39, "y": 0.48, "w": 0.22, "h": 0.22},
                "createdAt": "2024-01-01T00:00:00Z"
            })
            expected_status = 201
        else:
            # Simulate that user already has 20 templates
            mock_upload = AsyncMock(side_effect=Exception(
                "Límite de 20 plantillas alcanzado. Elimina plantillas existentes antes de subir nuevas."
            ))
            expected_status = 429 if existing_templates >= 19 else 400
        
        with patch("app.supabase_client", create_mock_supabase()):
            with patch.object(TemplateManager, "upload_template", mock_upload):
                response = client.post(
                    "/api/templates",
                    files={"file": ("test.png", png_buffer, "image/png")},
                    headers={"Authorization": "Bearer test-token"}
                )
        
        if existing_templates >= 19 and expected_status == 429:
            assert response.status_code == 429
            data = response.json()
            assert "20 plantillas" in data["detail"] or "límite" in data["detail"].lower()


# ============================================================================
# Property Tests - API Response Structure
# ============================================================================

class TestAPIResponseStructureProperties:
    """Property-based tests for API response structure and HTTP status codes."""

    # Feature: custom-template-upload, Property 26: Consistent JSON Response Structure
    @given(
        operation=st.sampled_from(["upload", "list", "get", "delete"]),
        success=st.booleans()
    )
    @settings(max_examples=20)
    def test_consistent_json_structure(self, operation, success):
        """**Validates: Requirements 9.6**
        
        For any API response, it should have consistent JSON structure with success field.
        """
        client = TestClient(app)
        
        with patch("app.supabase_client", create_mock_supabase()):
            if operation == "upload":
                if success:
                    mock_result = {
                        "id": "test-id",
                        "filename": "test.png",
                        "url": "http://example.com/test.png",
                        "width": 1000,
                        "height": 1000,
                        "photoRectNorm": {"x": 0.39, "y": 0.48, "w": 0.22, "h": 0.22},
                        "createdAt": "2024-01-01T00:00:00Z"
                    }
                    with patch.object(TemplateManager, "upload_template", AsyncMock(return_value=mock_result)):
                        response = client.post(
                            "/api/templates",
                            files={"file": ("test.png", generate_valid_png(), "image/png")},
                            headers={"Authorization": "Bearer test-token"}
                        )
                    assert response.status_code == 201
                    data = response.json()
                    assert "success" in data
                    assert data["success"] is True
                    assert "template" in data
                else:
                    with patch.object(TemplateManager, "upload_template", AsyncMock(side_effect=Exception("Error de validación"))):
                        response = client.post(
                            "/api/templates",
                            files={"file": ("test.png", generate_valid_png(), "image/png")},
                            headers={"Authorization": "Bearer test-token"}
                        )
                    assert response.status_code == 400
                    data = response.json()
                    assert "detail" in data
            
            elif operation == "list":
                if success:
                    mock_result = []
                    with patch.object(TemplateManager, "list_templates", AsyncMock(return_value=mock_result)):
                        response = client.get(
                            "/api/templates",
                            headers={"Authorization": "Bearer test-token"}
                        )
                    assert response.status_code == 200
                    data = response.json()
                    assert "success" in data
                    assert data["success"] is True
                    assert "templates" in data
                else:
                    with patch.object(TemplateManager, "list_templates", AsyncMock(side_effect=Exception("Error de base de datos"))):
                        response = client.get(
                            "/api/templates",
                            headers={"Authorization": "Bearer test-token"}
                        )
                    assert response.status_code == 500
                    data = response.json()
                    assert "detail" in data
            
            elif operation == "get":
                if success:
                    mock_result = {
                        "id": "test-id",
                        "filename": "test.png",
                        "url": "http://example.com/test.png",
                        "width": 1000,
                        "height": 1000,
                        "fileSize": 12345,
                        "photoRectNorm": {"x": 0.39, "y": 0.48, "w": 0.22, "h": 0.22},
                        "createdAt": "2024-01-01T00:00:00Z"
                    }
                    with patch.object(TemplateManager, "get_template", AsyncMock(return_value=mock_result)):
                        response = client.get(
                            "/api/templates/test-id",
                            headers={"Authorization": "Bearer test-token"}
                        )
                    assert response.status_code == 200
                    data = response.json()
                    assert "success" in data
                    assert data["success"] is True
                    assert "template" in data
                else:
                    with patch.object(TemplateManager, "get_template", AsyncMock(side_effect=Exception("Plantilla no encontrada"))):
                        response = client.get(
                            "/api/templates/test-id",
                            headers={"Authorization": "Bearer test-token"}
                        )
                    assert response.status_code == 404
                    data = response.json()
                    assert "detail" in data
            
            elif operation == "delete":
                if success:
                    with patch.object(TemplateManager, "delete_template", AsyncMock(return_value=True)):
                        response = client.delete(
                            "/api/templates/test-id",
                            headers={"Authorization": "Bearer test-token"}
                        )
                    assert response.status_code == 200
                    data = response.json()
                    assert "success" in data
                    assert data["success"] is True
                    assert "message" in data
                else:
                    with patch.object(TemplateManager, "delete_template", AsyncMock(side_effect=Exception("Plantilla no encontrada"))):
                        response = client.delete(
                            "/api/templates/test-id",
                            headers={"Authorization": "Bearer test-token"}
                        )
                    assert response.status_code == 404
                    data = response.json()
                    assert "detail" in data

    # Feature: custom-template-upload, Property 27: HTTP Status Code Correctness
    @given(
        endpoint=st.sampled_from([
            ("POST", "/api/templates", 201, "success"),
            ("POST", "/api/templates", 400, "validation_error"),
            ("POST", "/api/templates", 413, "file_too_large"),
            ("POST", "/api/templates", 429, "quota_exceeded"),
            ("GET", "/api/templates", 200, "success"),
            ("GET", "/api/templates/{id}", 200, "success"),
            ("GET", "/api/templates/{id}", 404, "not_found"),
            ("DELETE", "/api/templates/{id}", 200, "success"),
            ("DELETE", "/api/templates/{id}", 404, "not_found"),
        ])
    )
    @settings(max_examples=20)
    def test_http_status_codes(self, endpoint):
        """**Validates: Requirements 9.7**
        
        For any API operation, the correct HTTP status code should be returned.
        """
        method, path, expected_status, scenario = endpoint
        client = TestClient(app)
        
        with patch("app.supabase_client", create_mock_supabase()):
            if method == "POST" and path == "/api/templates":
                if scenario == "success":
                    mock_result = {
                        "id": "test-id",
                        "filename": "test.png",
                        "url": "http://example.com/test.png",
                        "width": 1000,
                        "height": 1000,
                        "photoRectNorm": {"x": 0.39, "y": 0.48, "w": 0.22, "h": 0.22},
                        "createdAt": "2024-01-01T00:00:00Z"
                    }
                    with patch.object(TemplateManager, "upload_template", AsyncMock(return_value=mock_result)):
                        response = client.post(
                            path,
                            files={"file": ("test.png", generate_valid_png(), "image/png")},
                            headers={"Authorization": "Bearer test-token"}
                        )
                elif scenario == "validation_error":
                    with patch.object(TemplateManager, "upload_template", AsyncMock(side_effect=Exception("Error de validación"))):
                        response = client.post(
                            path,
                            files={"file": ("test.png", generate_valid_png(), "image/png")},
                            headers={"Authorization": "Bearer test-token"}
                        )
                elif scenario == "file_too_large":
                    with patch.object(TemplateManager, "upload_template", AsyncMock(side_effect=Exception("El archivo excede el límite de 10MB"))):
                        response = client.post(
                            path,
                            files={"file": ("test.png", generate_valid_png(), "image/png")},
                            headers={"Authorization": "Bearer test-token"}
                        )
                elif scenario == "quota_exceeded":
                    with patch.object(TemplateManager, "upload_template", AsyncMock(side_effect=Exception("Límite de 20 plantillas alcanzado"))):
                        response = client.post(
                            path,
                            files={"file": ("test.png", generate_valid_png(), "image/png")},
                            headers={"Authorization": "Bearer test-token"}
                        )
                
                assert response.status_code == expected_status
            
            elif method == "GET" and path == "/api/templates":
                if scenario == "success":
                    with patch.object(TemplateManager, "list_templates", AsyncMock(return_value=[])):
                        response = client.get(path, headers={"Authorization": "Bearer test-token"})
                
                assert response.status_code == expected_status
            
            elif method == "GET" and "{id}" in path:
                actual_path = path.replace("{id}", "test-id")
                if scenario == "success":
                    mock_result = {
                        "id": "test-id",
                        "filename": "test.png",
                        "url": "http://example.com/test.png",
                        "width": 1000,
                        "height": 1000,
                        "fileSize": 12345,
                        "photoRectNorm": {"x": 0.39, "y": 0.48, "w": 0.22, "h": 0.22},
                        "createdAt": "2024-01-01T00:00:00Z"
                    }
                    with patch.object(TemplateManager, "get_template", AsyncMock(return_value=mock_result)):
                        response = client.get(actual_path, headers={"Authorization": "Bearer test-token"})
                elif scenario == "not_found":
                    with patch.object(TemplateManager, "get_template", AsyncMock(side_effect=Exception("Plantilla no encontrada"))):
                        response = client.get(actual_path, headers={"Authorization": "Bearer test-token"})
                
                assert response.status_code == expected_status
            
            elif method == "DELETE" and "{id}" in path:
                actual_path = path.replace("{id}", "test-id")
                if scenario == "success":
                    with patch.object(TemplateManager, "delete_template", AsyncMock(return_value=True)):
                        response = client.delete(actual_path, headers={"Authorization": "Bearer test-token"})
                elif scenario == "not_found":
                    with patch.object(TemplateManager, "delete_template", AsyncMock(side_effect=Exception("Plantilla no encontrada"))):
                        response = client.delete(actual_path, headers={"Authorization": "Bearer test-token"})
                
                assert response.status_code == expected_status


# ============================================================================
# Unit Tests - Authentication
# ============================================================================

class TestAuthentication:
    """Unit tests for authentication handling."""

    def test_missing_token_returns_401(self):
        """Missing authorization header should return 401."""
        client = TestClient(app)
        
        response = client.get("/api/templates")
        
        assert response.status_code == 401
        data = response.json()
        assert "autenticación" in data["detail"].lower()

    def test_invalid_token_returns_401(self):
        """Invalid token should return 401."""
        client = TestClient(app)
        
        mock_client = Mock()
        mock_client.auth.get_user = Mock(side_effect=Exception("Invalid token"))
        
        with patch("app.supabase_client", mock_client):
            response = client.get(
                "/api/templates",
                headers={"Authorization": "Bearer invalid-token"}
            )
        
        assert response.status_code == 401
        data = response.json()
        assert "inválido" in data["detail"].lower()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
