from django.test import SimpleTestCase

from capture.views import _web_fields


class WebFieldsHighlightScreenshotTests(SimpleTestCase):

    def test_highlight_and_screenshot_true_when_present(self):
        fields = _web_fields({
            "highlighted_text": "a selected passage",
            "screenshot_base64": "data:image/jpeg;base64,abc123",
        })
        self.assertTrue(fields["has_highlight"])
        self.assertTrue(fields["has_screenshot"])

    def test_highlight_and_screenshot_false_when_absent(self):
        fields = _web_fields({})
        self.assertFalse(fields["has_highlight"])
        self.assertFalse(fields["has_screenshot"])
