"""
Unit and Property Tests for TemplateManager

Tests validation, CRUD operations, and correctness properties.
"""

import io
import pytest
from hypothesis import given, strategies as st, settings
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


def generate_jpeg() -> bytes:
    """Generate a JPEG file buffer."""
    img = Image.new("RGB", (1000, 1000), color=(255, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


# ============================================================================
# Unit Tests - validate_png
# ============================================================================

class TestValidatePNG:
    """Unit tests for PNG validation."""

    def test_valid_png_accepted(self):
        """Valid PNG should pass validation."""
        manager = TemplateManager(None)
        buffer = generate_valid_png(1000, 1000)
        
        result = manager.validate_png(buffer)
        
        assert result["valid"] is True
        assert result["width"] == 1000
        assert result["height"] == 1000
        assert "error" not in result

    def test_minimum_dimensions_accepted(self):
        """PNG with minimum valid dimensions (500x500) should be accepted."""
        manager = TemplateManager(None)
        buffer = generate_valid_png(500, 500)
        
        result = manager.validate_png(buffer)
        
        assert result["valid"] is True
        assert result["width"] == 500
        assert result["height"] == 500

    def test_maximum_dimensions_accepted(self):
        """PNG with maximum valid dimensions (4000x4000) should be accepted."""
        manager = TemplateManager(None)
        buffer = generate_valid_png(4000, 4000)
        
        result = manager.validate_png(buffer)
        
        assert result["valid"] is True
        assert result["width"] == 4000
        assert result["height"] == 4000

    def test_dimensions_too_small_rejected(self):
        """PNG with dimensions below 500 should be rejected."""
        manager = TemplateManager(None)
        buffer = generate_valid_png(499, 500)
        
        result = manager.validate_png(buffer)
        
        assert result["valid"] is False
        assert "dimensiones" in result["error"].lower()
        assert "499x500" in result["error"]

    def test_dimensions_too_large_rejected(self):
        """PNG with dimensions above 4000 should be rejected."""
        manager = TemplateManager(None)
        buffer = generate_valid_png(4001, 4000)
        
        result = manager.validate_png(buffer)
        
        assert result["valid"] is False
        assert "dimensiones" in result["error"].lower()
        assert "4001x4000" in result["error"]

    def test_non_png_format_rejected(self):
        """Non-PNG format should be rejected."""
        manager = TemplateManager(None)
        buffer = generate_jpeg()
        
        result = manager.validate_png(buffer)
        
        assert result["valid"] is False
        assert "png" in result["error"].lower()

    def test_file_too_large_rejected(self):
        """File exceeding 10MB should be rejected."""
        manager = TemplateManager(None)
        buffer = b"x" * (10 * 1024 * 1024 + 1)  # 10MB + 1 byte
        
        result = manager.validate_png(buffer)
        
        assert result["valid"] is False
        assert "10mb" in result["error"].lower()

    def test_invalid_file_rejected(self):
        """Invalid/corrupted file should be rejected."""
        manager = TemplateManager(None)
        buffer = b"not an image"
        
        result = manager.validate_png(buffer)
        
        assert result["valid"] is False
        assert "error" in result


# ============================================================================
# Property Tests - validate_png
# ============================================================================

class TestValidatePNGProperties:
    """Property-based tests for PNG validation."""

    # Feature: custom-template-upload, Property 2: PNG Format Validation
    @given(st.binary(min_size=100, max_size=1000))
    @settings(max_examples=20)
    def test_non_png_always_rejected(self, random_bytes):
        """**Validates: Requirements 1.2**
        
        For any non-PNG file, validation should reject it.
        """
        manager = TemplateManager(None)
        
        # Skip if accidentally valid PNG
        try:
            img = Image.open(io.BytesIO(random_bytes))
            if img.format == "PNG":
                return
        except:
            pass
        
        result = manager.validate_png(random_bytes)
        assert result["valid"] is False

    # Feature: custom-template-upload, Property 3: File Size Validation
    @given(st.integers(min_value=10 * 1024 * 1024 + 1, max_value=15 * 1024 * 1024))
    @settings(max_examples=20)
    def test_oversized_files_rejected(self, size):
        """**Validates: Requirements 1.3**
        
        For any file exceeding 10MB, validation should reject it.
        """
        manager = TemplateManager(None)
        buffer = b"x" * size
        
        result = manager.validate_png(buffer)
        
        assert result["valid"] is False
        assert "10mb" in result["error"].lower()

    # Feature: custom-template-upload, Property 4: Dimension Validation
    @given(
        width=st.one_of(
            st.integers(min_value=1, max_value=499),
            st.integers(min_value=4001, max_value=5000)
        ),
        height=st.integers(min_value=500, max_value=4000)
    )
    @settings(max_examples=20)
    def test_invalid_dimensions_rejected(self, width, height):
        """**Validates: Requirements 1.1, 8.4**
        
        For any PNG with dimensions outside 500-4000 range, validation should reject it.
        """
        manager = TemplateManager(None)
        buffer = generate_valid_png(width, height)
        
        result = manager.validate_png(buffer)
        
        assert result["valid"] is False
        assert "dimensiones" in result["error"].lower()


# ============================================================================
# Unit Tests - validate_photo_rect_norm
# ============================================================================

class TestValidatePhotoRectNorm:
    """Unit tests for photoRectNorm validation."""

    def test_valid_rect_accepted(self):
        """Valid photoRectNorm should pass validation."""
        manager = TemplateManager(None)
        rect = {"x": 0.5, "y": 0.5, "w": 0.3, "h": 0.3}
        
        result = manager.validate_photo_rect_norm(rect)
        
        assert result["valid"] is True
        assert "error" not in result

    def test_minimum_w_h_accepted(self):
        """photoRectNorm with minimum w/h (0.01) should be accepted."""
        manager = TemplateManager(None)
        rect = {"x": 0.0, "y": 0.0, "w": 0.01, "h": 0.01}
        
        result = manager.validate_photo_rect_norm(rect)
        
        assert result["valid"] is True

    def test_missing_keys_rejected(self):
        """photoRectNorm missing required keys should be rejected."""
        manager = TemplateManager(None)
        rect = {"x": 0.5, "y": 0.5}  # Missing w and h
        
        result = manager.validate_photo_rect_norm(rect)
        
        assert result["valid"] is False
        assert "w" in result["error"] or "h" in result["error"]

    def test_value_below_zero_rejected(self):
        """photoRectNorm with negative values should be rejected."""
        manager = TemplateManager(None)
        rect = {"x": -0.1, "y": 0.5, "w": 0.3, "h": 0.3}
        
        result = manager.validate_photo_rect_norm(rect)
        
        assert result["valid"] is False
        assert "0.0 y 1.0" in result["error"]

    def test_value_above_one_rejected(self):
        """photoRectNorm with values > 1.0 should be rejected."""
        manager = TemplateManager(None)
        rect = {"x": 0.5, "y": 1.1, "w": 0.3, "h": 0.3}
        
        result = manager.validate_photo_rect_norm(rect)
        
        assert result["valid"] is False
        assert "0.0 y 1.0" in result["error"]

    def test_w_too_small_rejected(self):
        """photoRectNorm with w < 0.01 should be rejected."""
        manager = TemplateManager(None)
        rect = {"x": 0.5, "y": 0.5, "w": 0.005, "h": 0.3}
        
        result = manager.validate_photo_rect_norm(rect)
        
        assert result["valid"] is False
        assert "0.01" in result["error"]

    def test_h_too_small_rejected(self):
        """photoRectNorm with h < 0.01 should be rejected."""
        manager = TemplateManager(None)
        rect = {"x": 0.5, "y": 0.5, "w": 0.3, "h": 0.009}
        
        result = manager.validate_photo_rect_norm(rect)
        
        assert result["valid"] is False
        assert "0.01" in result["error"]

    def test_non_dict_rejected(self):
        """Non-dict photoRectNorm should be rejected."""
        manager = TemplateManager(None)
        rect = [0.5, 0.5, 0.3, 0.3]
        
        result = manager.validate_photo_rect_norm(rect)
        
        assert result["valid"] is False
        assert "objeto" in result["error"].lower()


# ============================================================================
# Property Tests - validate_photo_rect_norm
# ============================================================================

class TestValidatePhotoRectNormProperties:
    """Property-based tests for photoRectNorm validation."""

    # Feature: custom-template-upload, Property 19: PhotoRectNorm Structure Validation
    @given(
        st.dictionaries(
            keys=st.sampled_from(["x", "y", "w", "h", "extra"]),
            values=st.floats(min_value=0.0, max_value=1.0, allow_nan=False, allow_infinity=False),
            min_size=0,
            max_size=3
        )
    )
    @settings(max_examples=20)
    def test_incomplete_structure_rejected(self, incomplete_rect):
        """**Validates: Requirements 6.1**
        
        For any photoRectNorm missing required properties, validation should reject it.
        """
        manager = TemplateManager(None)
        
        # Skip if accidentally complete
        if all(k in incomplete_rect for k in ["x", "y", "w", "h"]):
            return
        
        result = manager.validate_photo_rect_norm(incomplete_rect)
        
        assert result["valid"] is False

    # Feature: custom-template-upload, Property 20: PhotoRectNorm Range Validation
    @given(
        x=st.one_of(
            st.floats(min_value=-10.0, max_value=-0.01),
            st.floats(min_value=1.01, max_value=10.0)
        ).filter(lambda v: not (v != v)),  # Filter NaN
        y=st.floats(min_value=0.0, max_value=1.0, allow_nan=False, allow_infinity=False),
        w=st.floats(min_value=0.01, max_value=1.0, allow_nan=False, allow_infinity=False),
        h=st.floats(min_value=0.01, max_value=1.0, allow_nan=False, allow_infinity=False)
    )
    @settings(max_examples=20)
    def test_out_of_range_values_rejected(self, x, y, w, h):
        """**Validates: Requirements 6.2, 6.3, 6.4**
        
        For any photoRectNorm with values outside valid range, validation should reject it.
        """
        manager = TemplateManager(None)
        rect = {"x": x, "y": y, "w": w, "h": h}
        
        result = manager.validate_photo_rect_norm(rect)
        
        assert result["valid"] is False
        assert "0.0 y 1.0" in result["error"]


# ============================================================================
# Note: Integration tests with real Supabase would go here
# For now, we focus on unit tests and property tests for validation logic
# ============================================================================


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
