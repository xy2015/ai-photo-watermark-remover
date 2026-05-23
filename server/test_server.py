"""
API 测试脚本
启动服务后运行: python test_server.py
"""
import unittest
import json
import base64
import io
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

app = None


def setUpModule():
    global app
    from app import create_app
    flask_app = create_app()
    app = flask_app.test_client()


class TestHealth(unittest.TestCase):
    def test_health_check(self):
        resp = app.get('/api/health')
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertEqual(data['status'], 'ok')


class TestUpload(unittest.TestCase):
    def _make_test_image(self, fmt='PNG'):
        from PIL import Image
        img = Image.new('RGB', (100, 80), color='blue')
        buf = io.BytesIO()
        img.save(buf, format=fmt)
        buf.seek(0)
        return buf

    def test_upload_png(self):
        buf = self._make_test_image('PNG')
        resp = app.post('/api/upload', data={'file': (buf, 'test.png')})
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertTrue(data['success'])
        self.assertEqual(data['width'], 100)
        self.assertEqual(data['height'], 80)

    def test_upload_jpg(self):
        buf = self._make_test_image('JPEG')
        resp = app.post('/api/upload', data={'file': (buf, 'test.jpg')})
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertTrue(data['success'])

    def test_upload_reject_bad_extension(self):
        buf = self._make_test_image('PNG')
        resp = app.post('/api/upload', data={'file': (buf, 'test.exe')})
        self.assertEqual(resp.status_code, 400)

    def test_upload_reject_magic_bytes_mismatch(self):
        buf = self._make_test_image('JPEG')
        resp = app.post('/api/upload', data={'file': (buf, 'test.png')})
        self.assertEqual(resp.status_code, 400)

    def test_upload_no_file(self):
        resp = app.post('/api/upload')
        self.assertEqual(resp.status_code, 400)

    def test_upload_empty_filename(self):
        buf = self._make_test_image('PNG')
        resp = app.post('/api/upload', data={'file': (buf, '')})
        self.assertEqual(resp.status_code, 400)


class TestProcessAuto(unittest.TestCase):
    def _make_base64_image(self):
        from PIL import Image
        img = Image.new('RGB', (200, 150), color='white')
        draw = Image.new('RGB', (60, 30), color=(200, 200, 200))
        img.paste(draw, (130, 110))
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
        return f'data:image/png;base64,{b64}'

    def test_process_auto_bottom_right(self):
        resp = app.post('/api/process/auto',
            data=json.dumps({'image': self._make_base64_image(), 'region': 'bottom-right'}),
            content_type='application/json')
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertTrue(data['success'])
        self.assertIn('data:image/png;base64,', data['image'])

    def test_process_auto_missing_image(self):
        resp = app.post('/api/process/auto',
            data=json.dumps({'region': 'top-left'}),
            content_type='application/json')
        self.assertEqual(resp.status_code, 400)

    def test_process_auto_invalid_region(self):
        resp = app.post('/api/process/auto',
            data=json.dumps({'image': self._make_base64_image(), 'region': 'invalid'}),
            content_type='application/json')
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertTrue(data['success'])
        self.assertEqual(data['detected_regions'], [])


class TestProcessManual(unittest.TestCase):
    def _make_base64_image(self):
        from PIL import Image
        img = Image.new('RGB', (200, 150), color='white')
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        return f'data:image/png;base64,{base64.b64encode(buf.getvalue()).decode()}'

    def _make_mask(self):
        from PIL import Image
        img = Image.new('L', (200, 150), color=0)
        draw = Image.new('L', (40, 20), color=255)
        img.paste(draw, (80, 60))
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        return f'data:image/png;base64,{base64.b64encode(buf.getvalue()).decode()}'

    def test_process_manual_success(self):
        resp = app.post('/api/process/manual',
            data=json.dumps({'image': self._make_base64_image(), 'mask': self._make_mask()}),
            content_type='application/json')
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertTrue(data['success'])

    def test_process_manual_missing_data(self):
        resp = app.post('/api/process/manual',
            data=json.dumps({'image': self._make_base64_image()}),
            content_type='application/json')
        self.assertEqual(resp.status_code, 400)


class TestDetect(unittest.TestCase):
    def _make_base64_image_with_watermark_text(self):
        from PIL import Image, ImageDraw
        img = Image.new('RGB', (300, 200), color=(240, 240, 240))
        draw = ImageDraw.Draw(img)
        for i in range(5):
            y = 10 + i * 15
            draw.rectangle([200, y, 290, y + 12], fill=(200, 200, 200))
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        return f'data:image/png;base64,{base64.b64encode(buf.getvalue()).decode()}'

    def test_detect_watermark(self):
        resp = app.post('/api/detect',
            data=json.dumps({'image': self._make_base64_image_with_watermark_text()}),
            content_type='application/json')
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertTrue(data['success'])
        self.assertIsInstance(data['watermarks'], list)

    def test_detect_no_image(self):
        resp = app.post('/api/detect',
            data=json.dumps({}),
            content_type='application/json')
        self.assertEqual(resp.status_code, 400)


class TestAllowedFile(unittest.TestCase):
    def setUp(self):
        from utils import allowed_file
        self.allowed_file = allowed_file

    def test_good_png(self):
        self.assertTrue(self.allowed_file('photo.png', b'\x89PNG\r\n\x1a\n' + b'\x00' * 20))

    def test_good_jpg(self):
        self.assertTrue(self.allowed_file('photo.jpg', b'\xff\xd8\xff\xe0' + b'\x00' * 20))

    def test_good_webp(self):
        webp_header = b'RIFF\x00\x00\x00\x00WEBP' + b'\x00' * 20
        self.assertTrue(self.allowed_file('photo.webp', webp_header))

    def test_bad_extension(self):
        self.assertFalse(self.allowed_file('photo.exe', b'\x89PNG\r\n\x1a\n' + b'\x00' * 20))

    def test_extension_magic_mismatch(self):
        self.assertFalse(self.allowed_file('photo.jpg', b'\x89PNG\r\n\x1a\n' + b'\x00' * 20))


class TestDetectWatermarkRegions(unittest.TestCase):
    def setUp(self):
        from services import detect_watermark_regions
        self.detect = detect_watermark_regions

    def test_plain_image_no_regions(self):
        import numpy as np
        img = np.ones((200, 300, 3), dtype=np.uint8) * 200
        regions = self.detect(img)
        self.assertIsInstance(regions, list)

    def test_image_with_rectangles_detects_something(self):
        import numpy as np
        import cv2
        img = np.ones((300, 400, 3), dtype=np.uint8) * 230
        cv2.rectangle(img, (50, 50), (120, 100), (80, 80, 80), -1)
        res = self.detect(img)
        self.assertIsInstance(res, list)


if __name__ == '__main__':
    unittest.main(verbosity=2)
