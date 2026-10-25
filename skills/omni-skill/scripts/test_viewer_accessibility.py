#!/usr/bin/env python3
"""
Test suite for HTML disclosure controls accessibility in eval viewer.
Verifies WCAG 2.2 SC 2.1.1 (Keyboard) and SC 4.1.2 (Name, Role, Value).
"""

import os
import re
import sys
import json
import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
VIEWERS = [
    REPO_ROOT / "skills" / "omni-skill" / "eval-viewer" / "viewer.html",
    REPO_ROOT / "skills" / "skill-conductor" / "eval-viewer" / "viewer.html",
]


class TestViewerAccessibility(unittest.TestCase):
    def test_main_landmark_and_reduced_motion(self):
        """Both viewer copies must expose a main landmark and respect reduced motion."""
        for viewer_path in VIEWERS:
            with self.subTest(viewer=viewer_path.relative_to(REPO_ROOT)):
                content = viewer_path.read_text(encoding="utf-8")
                self.assertRegex(content, r'<main[^>]*id="app"')
                self.assertIn("@media (prefers-reduced-motion: reduce)", content)

    def test_semantic_button_elements(self):
        """Disclosure controls must be native <button type='button'> elements, not clickable <div>s."""
        for viewer_path in VIEWERS:
            with self.subTest(viewer=viewer_path.relative_to(REPO_ROOT)):
                content = viewer_path.read_text(encoding="utf-8")
                # Look for div with class grades-toggle
                div_matches = re.findall(
                    r'<div[^>]*class=["\'][^"\']*grades-toggle[^"\']*["\'][^>]*>',
                    content,
                )
                self.assertEqual(
                    div_matches,
                    [],
                    f"{viewer_path} still contains clickable <div> with class grades-toggle: {div_matches}",
                )

                # Look for button with class grades-toggle
                button_matches = re.findall(
                    r'<button[^>]*class=["\'][^"\']*grades-toggle[^"\']*["\'][^>]*>',
                    content,
                )
                self.assertGreaterEqual(
                    len(button_matches),
                    2,
                    f"{viewer_path} must have at least 2 <button class='grades-toggle'> elements",
                )
                for btn in button_matches:
                    self.assertIn(
                        'type="button"',
                        btn,
                        f"{viewer_path} button must specify type='button' to prevent form submission: {btn}",
                    )
                    self.assertIn(
                        'aria-expanded="false"',
                        btn,
                        f"{viewer_path} button must have initial aria-expanded='false': {btn}",
                    )
                    self.assertIn(
                        "aria-controls=",
                        btn,
                        f"{viewer_path} button must have aria-controls attribute: {btn}",
                    )

    def test_css_focus_visible_and_button_reset(self):
        """CSS must reset button user-agent styles and provide visible focus indication."""
        for viewer_path in VIEWERS:
            with self.subTest(viewer=viewer_path.relative_to(REPO_ROOT)):
                content = viewer_path.read_text(encoding="utf-8")
                self.assertIn(
                    ".grades-toggle:focus-visible",
                    content,
                    f"{viewer_path} must define .grades-toggle:focus-visible styling",
                )

    def test_browser_keyboard_and_aria_state(self):
        """Browser tests: Tab navigation, Enter and Space activation, and aria-expanded state."""
        test_data = {
            "skill_name": "test-skill",
            "runs": [
                {
                    "id": "run-1",
                    "eval_id": "test-eval",
                    "prompt": "Test Prompt",
                    "outputs": [],
                    "grading": {
                        "summary": {"pass_rate": 0.8},
                        "expectations": [{"text": "Exp 1", "passed": True}],
                    },
                },
                {
                    "id": "run-2",
                    "eval_id": "test-eval-2",
                    "prompt": "Test Prompt 2",
                    "outputs": [],
                    "grading": {
                        "summary": {"pass_rate": 1.0},
                        "expectations": [{"text": "Exp 2", "passed": True}],
                    },
                },
            ],
            "previous_feedback": {},
            "previous_outputs": {
                "run-1": [{"name": "file1.txt", "data_uri": "data:text/plain;base64,dGVzdA=="}],
                "run-2": [{"name": "file2.txt", "data_uri": "data:text/plain;base64,dGVzdA=="}],
            },
        }

        with sync_playwright() as p:
            browser = p.chromium.launch(executable_path=os.environ.get("OMNI_CHROME_PATH") or None, headless=True)
            for viewer_path in VIEWERS:
                with self.subTest(viewer=viewer_path.relative_to(REPO_ROOT)):
                    html_content = viewer_path.read_text(encoding="utf-8")
                    # Inject test data replacing /*__EMBEDDED_DATA__*/
                    injected = re.sub(
                        r"/\*\s*__EMBEDDED_DATA__\s*\*/",
                        f"const EMBEDDED_DATA = {json.dumps(test_data)};",
                        html_content,
                    )
                    page = browser.new_page()
                    page.set_content(injected)

                    # Check that prev-outputs-section and grades-section are visible
                    page.wait_for_selector("#prev-outputs-section", state="visible", timeout=3000)
                    page.wait_for_selector("#grades-section", state="visible", timeout=3000)

                    # Identify the buttons
                    prev_btn = page.locator("#prev-outputs-toggle-btn")
                    grades_btn = page.locator("#grades-toggle-btn")

                    self.assertTrue(prev_btn.is_visible(), "Previous output toggle button must be visible")
                    self.assertTrue(grades_btn.is_visible(), "Grades toggle button must be visible")

                    # Initial aria-expanded must be false
                    self.assertEqual(prev_btn.get_attribute("aria-expanded"), "false")
                    self.assertEqual(grades_btn.get_attribute("aria-expanded"), "false")

                    # Keyboard focus prev_btn
                    prev_btn.focus()
                    self.assertTrue(prev_btn.evaluate("el => document.activeElement === el"))

                    # Activate with Enter
                    page.keyboard.press("Enter")
                    self.assertEqual(
                        prev_btn.get_attribute("aria-expanded"),
                        "true",
                        "Pressing Enter must set aria-expanded to true",
                    )
                    prev_content = page.locator("#prev-outputs-content")
                    self.assertIn("open", prev_content.get_attribute("class") or "")

                    # Activate with Enter again to collapse
                    page.keyboard.press("Enter")
                    self.assertEqual(
                        prev_btn.get_attribute("aria-expanded"),
                        "false",
                        "Pressing Enter again must set aria-expanded to false",
                    )
                    self.assertNotIn("open", prev_content.get_attribute("class") or "")

                    # Keyboard focus grades_btn
                    grades_btn.focus()
                    self.assertTrue(grades_btn.evaluate("el => document.activeElement === el"))

                    # Activate with Space
                    page.keyboard.press("Space")
                    self.assertEqual(
                        grades_btn.get_attribute("aria-expanded"),
                        "true",
                        "Pressing Space must set aria-expanded to true",
                    )
                    grades_content = page.locator("#grades-content")
                    self.assertIn("open", grades_content.get_attribute("class") or "")

                    # Activate with Space again to collapse
                    page.keyboard.press("Space")
                    self.assertEqual(
                        grades_btn.get_attribute("aria-expanded"),
                        "false",
                        "Pressing Space again must set aria-expanded to false",
                    )
                    self.assertNotIn("open", grades_content.get_attribute("class") or "")

                    # Expand both then navigate to next dataset
                    prev_btn.click()
                    grades_btn.click()
                    self.assertEqual(prev_btn.get_attribute("aria-expanded"), "true")
                    self.assertEqual(grades_btn.get_attribute("aria-expanded"), "true")

                    # Click next-btn
                    page.locator("#next-btn").click()
                    self.assertEqual(
                        prev_btn.get_attribute("aria-expanded"),
                        "false",
                        "Dataset navigation must reset aria-expanded to false",
                    )
                    self.assertEqual(
                        grades_btn.get_attribute("aria-expanded"),
                        "false",
                        "Dataset navigation must reset aria-expanded to false",
                    )
                    page.close()
            browser.close()

    def test_feedback_form_label_and_status(self):
        """Feedback textarea must have an explicit <label for='feedback'> and accessible status region."""
        for viewer_path in VIEWERS:
            with self.subTest(viewer=viewer_path.relative_to(REPO_ROOT)):
                content = viewer_path.read_text(encoding="utf-8")
                # Must have explicit <label for="feedback">
                label_match = re.search(r'<label[^>]*for=["\']feedback["\'][^>]*>(.*?)</label>', content, re.DOTALL)
                self.assertIsNotNone(
                    label_match,
                    f"{viewer_path} must have an explicit <label for='feedback'> element",
                )
                self.assertIn(
                    "Your Feedback",
                    label_match.group(1),
                    f"{viewer_path} <label for='feedback'> must contain 'Your Feedback'",
                )

                # Feedback status should have role='status' or aria-live='polite'
                status_match = re.search(r'<div[^>]*id=["\']feedback-status["\'][^>]*>', content)
                self.assertIsNotNone(status_match, f"{viewer_path} must have feedback-status element")
                self.assertTrue(
                    'role="status"' in status_match.group(0) or 'aria-live="polite"' in status_match.group(0),
                    f"{viewer_path} feedback-status must have role='status' or aria-live='polite': {status_match.group(0)}",
                )

    def test_feedback_label_browser(self):
        """Confirm the feedback label is exposed by the DOM and click-to-focus works."""
        with sync_playwright() as p:
            browser = p.chromium.launch(executable_path=os.environ.get("OMNI_CHROME_PATH") or None, headless=True)
            for viewer_path in VIEWERS:
                with self.subTest(viewer_browser=viewer_path.relative_to(REPO_ROOT)):
                    html_content = viewer_path.read_text(encoding="utf-8")
                    test_data = {
                        "skill_name": "test-skill",
                        "runs": [{"id": "run-1", "eval_id": "e1", "prompt": "P", "outputs": []}],
                        "previous_feedback": {},
                        "previous_outputs": {},
                    }
                    injected = re.sub(
                        r"/\*\s*__EMBEDDED_DATA__\s*\*/",
                        f"const EMBEDDED_DATA = {json.dumps(test_data)};",
                        html_content,
                    )
                    page = browser.new_page()
                    page.set_content(injected)

                    textarea = page.locator("#feedback")
                    self.assertTrue(textarea.is_visible())

                    # Check programmatic label association via HTML DOM
                    label_text = textarea.evaluate("el => el.labels && el.labels[0] ? el.labels[0].textContent.trim() : null")
                    self.assertEqual(label_text, "Your Feedback", f"{viewer_path} textarea must be associated with 'Your Feedback' label")

                    # Clicking the label must focus the textarea
                    page.locator("label[for='feedback']").click()
                    self.assertTrue(
                        textarea.evaluate("el => document.activeElement === el"),
                        f"{viewer_path} clicking label must focus textarea",
                    )
                    page.close()
            browser.close()


if __name__ == "__main__":
    unittest.main()
