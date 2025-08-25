// Loader robusto para GitHub Pages (sem SRI)
async function fetchArrayBuffer(url, opts={}){
  const res = await fetch(url, {cache: 'no-store', ...opts});
  if(!res.ok){
    const text = await res.text().catch(()=> '');
    const msg = `HTTP ${res.status} ao baixar ${url}` + (text ? `\n${text.slice(0,200)}` : '');
    throw new Error(msg);
  }
  return await res.arrayBuffer();
}

function getPagesBaseUrl(){
  const {origin, pathname, hostname} = window.location;
  const segs = pathname.split('/').filter(Boolean);
  if(hostname.endsWith('github.io') && segs.length){
    return `${origin}/${segs[0]}/`;
  }
  return origin + pathname.replace(/\/[^\/]*$/, '/');
}

function buildUrlRelative(rel){
  const base = getPagesBaseUrl();
  return new URL(rel.replace(/^\//,''), base).toString();
}

function parseGhIdentity(){
  const host = location.hostname;
  const user = host.endsWith('github.io') ? host.split('.')[0] : null;
  const repo = location.pathname.split('/').filter(Boolean)[0] || null;
  return {user, repo};
}

async function loadExcelSmart({relativePath='data/Base 3.xlsx', branch='main', cacheBust=true}={}){
  const qs = cacheBust ? `?v=${Date.now()}` : '';
  const relUrl = buildUrlRelative(relativePath) + qs;
  let lastErr;
  try{
    const buf = await fetchArrayBuffer(relUrl);
    return XLSX.read(buf, {type:'array'});
  }catch(err){
    console.warn('Falhou relativo; tentando RAW', err);
    lastErr = err;
  }

  const {user, repo} = parseGhIdentity();
  if(!user || !repo){
    throw lastErr || new Error('Não foi possível inferir user/repo para montar fallback RAW.');
  }
  const cleanPath = relativePath.replace(/^\//,'');
  const rawUrl = `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${cleanPath}` + qs;
  const buf = await fetchArrayBuffer(rawUrl);
  return XLSX.read(buf, {type:'array'});
}

window.loadExcelSmart = loadExcelSmart;
