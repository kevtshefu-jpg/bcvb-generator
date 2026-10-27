"""BCVB Storage P0 HTTP probe — READ ONLY, disposable project only.

Required env:
  BCVB_TEST_URL, BCVB_TEST_ANON_KEY, BCVB_TEST_USER_JWT,
  BCVB_TEST_BUCKET, BCVB_TEST_OBJECT
Optional: BCVB_TEST_SIGNED_URL (pre-minted URL, kept secret).
Run once per phase (baseline / confined / restored). No upload or SQL mutations.
Never point at the production project. Never print tokens or signed URLs.
"""
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

EXPECTED_PROJECT = "ahqrrqgebtfzssmeizfu"
def required(key):
    value = os.environ.get(key, "")
    if not value:
        raise SystemExit("Missing environment variable: " + key)
    return value

base = required("BCVB_TEST_URL").rstrip("/")
if urllib.parse.urlparse(base).hostname != EXPECTED_PROJECT + ".supabase.co":
    raise SystemExit("REFUSED: endpoint is not the dedicated disposable Supabase project")
key = required("BCVB_TEST_ANON_KEY")
jwt = required("BCVB_TEST_USER_JWT")
bucket = required("BCVB_TEST_BUCKET")
path = required("BCVB_TEST_OBJECT")
phase = sys.argv[1] if len(sys.argv) > 1 else "baseline"
if phase not in ("baseline", "confined", "restored"):
    raise SystemExit("Phase must be baseline, confined, or restored")
target = "/".join(urllib.parse.quote(x, safe="") for x in (bucket, *path.split("/")))
root = base + "/storage/v1/object/"
def probe(name, method, url, token=None, body=None):
    headers = {"apikey": key}
    if token:
        headers["Authorization"] = "Bearer " + token
    if body is not None:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            status = resp.status
            data = resp.read(65536)
    except urllib.error.HTTPError as err:
        status = err.code
        data = err.read(65536)
    except Exception as err:
        return {"test": name, "error": type(err).__name__}
    output = {"test": name, "status": status}
    if name == "signed_url_creation" and status in (200, 201):
        try:
            output["signed_url_created"] = bool(json.loads(data).get("signedURL") or json.loads(data).get("signedUrl"))
        except (ValueError, UnicodeDecodeError):
            output["signed_url_created"] = False
    return output

results = [
    probe("anonymous_download", "GET", root + "authenticated/" + target),
    probe("authenticated_download", "GET", root + "authenticated/" + target, jwt),
    probe("signed_url_creation", "POST", root + "sign/" + target, jwt, b'{"expiresIn":60}'),
]
signed = os.environ.get("BCVB_TEST_SIGNED_URL")
if signed:
    if urllib.parse.urlparse(signed).hostname != EXPECTED_PROJECT + ".supabase.co":
        raise SystemExit("REFUSED: signed URL points outside disposable project")
    results.append(probe("existing_signed_url_download", "GET", signed))
print(json.dumps({"phase": phase, "project": EXPECTED_PROJECT, "results": results}, indent=2))
