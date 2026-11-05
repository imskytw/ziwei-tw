// 先安裝：npm i --no-save taiwan-atlas topojson-client @turf/centroid @turf/area
// 執行：SP=. node scripts/gen-taiwan-towns.js（輸出 towns.json）
const D='';
const topo=require(D+'taiwan-atlas/towns-10t.json');
const {feature}=require(D+'topojson-client');
const area=require(D+'@turf/area').default, centroid=require(D+'@turf/centroid').default;
const key=Object.keys(topo.objects)[0];
const fc=feature(topo, topo.objects[key]);
console.log('objects',Object.keys(topo.objects),'n',fc.features.length,'props',JSON.stringify(fc.features[0].properties));
// 面積加權中心：多個 polygon 取最大塊（避免離島把中心拉偏），並另記整體
const out={};
for(const f of fc.features){
  const p=f.properties; let g=f.geometry; let polys=g.type==='Polygon'?[g.coordinates]:g.coordinates;
  let best=null,ba=-1; for(const c of polys){const poly={type:'Feature',geometry:{type:'Polygon',coordinates:c}};const a=area(poly);if(a>ba){ba=a;best=poly;}}
  const [lon,lat]=centroid(best).geometry.coordinates;
  (out[p.COUNTYNAME]??=[]).push({code:p.TOWNCODE,name:p.TOWNNAME,lon:+lon.toFixed(3),lat:+lat.toFixed(3)});
}
require('fs').writeFileSync(process.env.SP+'/towns.json',JSON.stringify(out,null,0));
for(const k in out) console.log(k,out[k].length, out[k].slice(0,2).map(t=>t.name+':'+t.lon).join(' '));
