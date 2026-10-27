exec(open('tests/security/storage_p0_live_cycle.py').read().split('phase=sys.argv[1]')[0])
s=json.loads(STATE.read_text()); rows=[]
for persona,v in s['users'].items():
 path='/storage/v1/object/authenticated/Bcvb-library/'+s['path']+'?p0_probe='+secrets.token_hex(8)
 code,data=req('GET',path,v['token']); rows.append({'persona':persona,'http':code,'denied':code in (400,401,403,404)})
(OUT/'uncached.json').write_text(json.dumps(rows,indent=2)+'\n'); print(json.dumps(rows))

for name,v in s['signed'].items():
 code,data=req('GET',v['path']+'&p0_probe='+secrets.token_hex(8))
 result={'test':'expired_signed_url_unique_query','http':code,'expired_error':(b'expired' in data.lower() or b'claim timestamp check failed' in data),'checked_epoch':int(time.time()),'expires_epoch':v['expires']}
 (OUT/'expired-uncached.json').write_text(json.dumps(result,indent=2)+'\n'); print(json.dumps(result))
