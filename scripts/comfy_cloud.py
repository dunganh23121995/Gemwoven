"""Comfy Cloud client (owner bought Comfy Cloud 11/11): upload an image, run an API-format workflow, download its outputs.
Key: COMFY_CLOUD_API_KEY (Windows user environment). Used by assets/heroes/clip_pipeline.py."""
import json, os, sys, time, uuid, urllib.request, urllib.error, urllib.parse

BASE = 'https://cloud.comfy.org'


def key():
    k = os.environ.get('COMFY_CLOUD_API_KEY')
    if not k:
        import winreg
        k = winreg.QueryValueEx(winreg.OpenKey(winreg.HKEY_CURRENT_USER, 'Environment'), 'COMFY_CLOUD_API_KEY')[0]
    return k


def _call(path, body=None, data=None, ctype='application/json'):
    headers = {'X-API-Key': key()}
    if body is not None:
        data = json.dumps(body).encode()
    if data is not None:
        headers['Content-Type'] = ctype
    req = urllib.request.Request(BASE + path, data=data, headers=headers, method='POST' if data is not None else 'GET')
    for attempt in range(4):   # a dropped connection (SSL EOF) is retried; an HTTP error is returned
        try:
            r = urllib.request.urlopen(req, timeout=120)
            return r.status, json.loads(r.read() or b'{}')
        except urllib.error.HTTPError as e:
            return e.code, e.read().decode(errors='replace')[:2000]
        except (urllib.error.URLError, ConnectionError, TimeoutError) as e:
            if attempt == 3:
                raise
            time.sleep(3 * (attempt + 1))


def upload(path):
    b = uuid.uuid4().hex
    name = os.path.basename(path)
    parts = [
        f'--{b}\r\nContent-Disposition: form-data; name="image"; filename="{name}"\r\nContent-Type: image/png\r\n\r\n'.encode(),
        open(path, 'rb').read(),
        f'\r\n--{b}\r\nContent-Disposition: form-data; name="type"\r\n\r\ninput\r\n'.encode(),
        f'--{b}\r\nContent-Disposition: form-data; name="overwrite"\r\n\r\ntrue\r\n--{b}--\r\n'.encode(),
    ]
    s, r = _call('/api/upload/image', data=b''.join(parts), ctype=f'multipart/form-data; boundary={b}')
    if s != 200:
        raise SystemExit(f'upload failed {s} {r}')
    return r['name']


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **kw):
        return None


def _download(img, out_path):
    q = urllib.parse.urlencode({'filename': img['filename'], 'subfolder': img.get('subfolder', ''), 'type': img.get('type', 'output')})
    op = urllib.request.build_opener(_NoRedirect)
    try:
        data = op.open(urllib.request.Request(BASE + '/api/view?' + q, headers={'X-API-Key': key()}), timeout=120).read()
    except urllib.error.HTTPError as e:
        if e.code not in (301, 302, 303, 307):
            raise
        data = urllib.request.urlopen(e.headers['Location'], timeout=300).read()
    open(out_path, 'wb').write(data)


def run(workflow, out_dir, prefix, timeout=1800):
    os.makedirs(out_dir, exist_ok=True)
    s, r = _call('/api/prompt', {'prompt': workflow})
    if s != 200:
        raise SystemExit(f'submit failed {s} {r}')
    pid = r['prompt_id']
    t0 = time.time()
    print(f'[{prefix}] submitted {pid}', flush=True)
    while True:
        s, st = _call(f'/api/job/{pid}/status')
        status = st.get('status') if isinstance(st, dict) else str(st)
        if status in ('success', 'error', 'non_retryable_error', 'lost', 'cancelled'):
            break
        if time.time() - t0 > timeout:
            raise SystemExit(f'[{prefix}] timeout, last status {status}')
        time.sleep(4)
    dt = time.time() - t0
    s, h = _call(f'/api/history_v2/{pid}')
    if status != 'success':
        print(f'[{prefix}] {status} after {dt:.0f}s: {json.dumps(h)[:3000]}', flush=True)
        return []
    outs = []
    entry = h.get(pid, h) if isinstance(h, dict) else {}
    for node_id, o in entry.get('outputs', {}).items():
        for kind in ('images', 'gifs', 'videos', 'animated'):
            items = o.get(kind)
            if not isinstance(items, list):
                continue
            for i, img in enumerate(items):
                if not isinstance(img, dict) or 'filename' not in img:
                    continue
                ext = os.path.splitext(img['filename'])[1] or '.png'
                p = os.path.join(out_dir, f'{prefix}-n{node_id}-{i:03d}{ext}')
                _download(img, p)
                outs.append(p)
    print(f'[{prefix}] success in {dt:.0f}s, {len(outs)} files', flush=True)
    json.dump({'prompt_id': pid, 'seconds': round(dt, 1), 'workflow': workflow}, open(os.path.join(out_dir, f'{prefix}.run.json'), 'w'), indent=1)
    return outs
