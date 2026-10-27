"""Isolated-only HTTP rehearsal. Secrets stay in mode-0600 /tmp state; stdout is redacted."""
import json, os, sys, secrets, hashlib, time, urllib.request, urllib.error, base64, subprocess
from pathlib import Path
REF='ahqrrqgebtfzssmeizfu'
BASE=f'https://{REF}.supabase.co'
assert subprocess.check_output(['git','branch','--show-current'],text=True).strip()=='security/staged-production-rls-20261014'
KEYS=json.load(open('/tmp/bcvb-p0-keys.json'))
ANON=next(x['api_key'] for x in KEYS if x['name']=='anon')
SERVICE=next(x['api_key'] for x in KEYS if x['name']=='service_role')
STATE=Path('/tmp/bcvb-p0-state.json')
OUT=Path('docs/security/evidence/storage-p0-http-2026-10-27')
def save(s):
 fd=os.open(STATE,os.O_WRONLY|os.O_CREAT|os.O_TRUNC,0o600)
 with os.fdopen(fd,'w') as f: json.dump(s,f)
def req(method,path,token=None,body=None):
 assert path.startswith('/') and not path.startswith('//')
 h={'apikey':ANON,'Cache-Control':'no-cache'}
 if token: h['Authorization']='Bearer '+token
 if isinstance(body,dict): body=json.dumps(body).encode(); h['Content-Type']='application/json'
 elif body is not None: h['Content-Type']='text/plain'; h['cache-control']='0'
 try:
  with urllib.request.urlopen(urllib.request.Request(BASE+path,data=body,headers=h,method=method),timeout=30) as r: return r.status,r.read()
 except urllib.error.HTTPError as e: return e.code,e.read()
def decode(t): return json.loads(base64.urlsafe_b64decode(t.split('.')[1]+'==='))
phase=sys.argv[1]
if phase=='setup':
 assert not STATE.exists(), 'Existing state; do not duplicate fixtures'
 s={'users':{},'path':'p0-http-'+secrets.token_hex(6)+'/witness.txt'}; save(s)
 for persona in ['authenticated','player_a','player_b','parent','coach','admin','inactive']:
  password=secrets.token_urlsafe(32); email=f'p0-{persona}-{secrets.token_hex(6)}@example.invalid'
  code,data=req('POST','/auth/v1/admin/users',SERVICE,{'email':email,'password':password,'email_confirm':True,'app_metadata':{'p0_persona':persona,'p0_synthetic':True}})
  assert code in (200,201), ('create',persona,code)
  uid=json.loads(data)['id']; s['users'][persona]={'id':uid}; save(s)
  code,data=req('POST','/auth/v1/token?grant_type=password',None,{'email':email,'password':password})
  assert code==200, ('login',persona,code)
  token=json.loads(data)['access_token']; claims=decode(token)
  assert claims['sub']==uid and claims['role']=='authenticated' and claims['app_metadata']['p0_persona']==persona
  s['users'][persona]['token']=token; save(s)
 content=b'BCVB synthetic Storage P0 witness. No personal data. 2026-10-27.\n'
 s['sha256']=hashlib.sha256(content).hexdigest()
 code,_=req('POST','/storage/v1/object/Bcvb-library/'+s['path'],SERVICE,content)
 assert code==200, ('upload',code)
 save(s); print(json.dumps({'setup':'PASS','auth_accounts':len(s['users']),'upload_http':code,'sha256':s['sha256']})); sys.exit()
s=json.loads(STATE.read_text()); rows=[]
def record(name,code,ok,data=None):
 r={'test':name,'http':code,'pass':ok,'time_utc':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())}
 if data is not None and code==200:
  r['sha256']=hashlib.sha256(data).hexdigest(); r['pass']=ok and r['sha256']==s['sha256']
 rows.append(r)
target='Bcvb-library/'+s['path']
if phase=='expired':
 for name,v in s['signed'].items():
  code,data=req('GET',v['path']); record(name+'_expired',code,code==400 and (b'expired' in data.lower() or b'claim timestamp check failed' in data))
else:
 confined=phase in ('confined','final')
 for persona,token in [('anon',None)]+[(p,v['token']) for p,v in s['users'].items()]+[('service_role',SERVICE)]:
  allowed=persona=='service_role' or (persona!='anon' and not confined)
  code,data=req('GET','/storage/v1/object/authenticated/'+target,token); record(persona+'_download',code,code==200 if allowed else code in (400,401,403,404),data)
  code,data=req('POST','/storage/v1/object/list/Bcvb-library',token,{'prefix':s['path'].split('/')[0],'limit':100})
  found=code==200 and any(x.get('name')=='witness.txt' for x in json.loads(data))
  record(persona+'_list',code,found if allowed else (code==200 and not found) or code in (400,401,403,404))
  code,data=req('POST','/storage/v1/object/sign/'+target,token,{'expiresIn':120})
  record(persona+'_sign',code,code==200 if allowed else code in (400,401,403,404))
  if code==200:
   path='/storage/v1'+json.loads(data)['signedURL']; c,d=req('GET',path); record(persona+'_new_signed_download',c,c==200,d)
   if phase=='baseline' and persona=='authenticated':
    s['signed']={'baseline':{'path':path,'expires':decode(path.split('token=')[1])['exp']}}; save(s)
 code,data=req('GET','/storage/v1/object/public/'+target); record('public_download',code,code in (400,401,403,404))
 for name,v in s.get('signed',{}).items():
  code,data=req('GET',v['path']); record(name+'_existing_signed_download',code,code==200,data)
result={'project':REF,'phase':phase,'sha256':s['sha256'],'results':rows}
(OUT/(phase+'.json')).write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
if not all(x['pass'] for x in rows): sys.exit(1)
