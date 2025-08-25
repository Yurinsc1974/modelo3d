function getPagesBaseUrl(){
  const {origin, pathname, hostname} = window.location;
  const segs = pathname.split('/').filter(Boolean);
  if (hostname.endsWith('github.io') && segs.length){
    return `${origin}/${segs[0]}/`;
  }
  return origin + pathname.replace(/\/[^\/]*$/, '/');
}

async function loadExcelSmart({
  relativePath = 'data/Base.xlsx',
  branch = 'main',
  cacheBust = true
} = {}) {
  const qs = cacheBust ? `?v=${Date.now()}` : '';
  const relUrl = new URL(relativePath.replace(/^\//,''), getPagesBaseUrl()).toString() + qs;

  try {
    const buf = await fetch(relUrl, {cache:'no-store'}).then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status} ao baixar ${relUrl}`);
      return r.arrayBuffer();
    });
    return XLSX.read(buf, {type:'array'});
  } catch (e) { console.warn('Falhou relativo; tentando RAW', e); }

  const user = location.hostname.endsWith('github.io') ? location.hostname.split('.')[0] : null;
  const repo = location.pathname.split('/').filter(Boolean)[0] || null;
  if (!user || !repo) throw new Error('Não foi possível inferir user/repo para fallback RAW.');
  const rawUrl = `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${relativePath.replace(/^\//,'')}` + qs;

  const buf = await fetch(rawUrl, {cache:'no-store'}).then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status} ao baixar ${rawUrl}`);
    return r.arrayBuffer();
  });
  return XLSX.read(buf, {type:'array'});
}
