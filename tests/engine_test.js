const E=require('../src/engine.js');
const P={name:'테스트',garment:'pullover',neck:'round',sleeve:'setin',
body:{chest:86,hip:92,shoulder:38,armDepth:17,neckW:15,armLen:55,upperArm:27,wrist:15.5},
ease:{chest:8,hip:6,shoulder:0,armDepth:3,neckW:2,armLen:0,upperArm:4,wrist:4},
design:{length:58,ribH:6,cuffH:6,neckbandH:2.5,bandW:3,frontNeckD:7,backNeckD:2,vDepth:20,shoulderDrop:2,capTop:8,buttons:6,shoulderMethod:'bo'},
gauge:{unit:'10cm',st:22,row:30,dens:1.2,swatchW:6,needle:4,ribNeedle:3.5,yarn:'울',ballW:50},
pattern:{bg:'st',rib:'2x2',center:'diamond10',side:'rope6r',gap:6,sep:2,applyBack:false,applySleeve:true}};
for (const [g,n,sl] of [['pullover','round','setin'],['pullover','v','setin'],['cardigan','round','setin'],['cardigan','v','drop'],['pullover','round','drop']]){
 P.garment=g;P.neck=n;P.sleeve=sl;
 const C=E.compute(P,E.BUILTIN_MOTIFS);
 console.log('==',g,n,sl,'warn:',C.warnings);
 C.pieces.forEach(p=>{
   const last=p.rows.length-1; 
   let cnt=0; p.codes.forEach(r=>r&&r.forEach(v=>{if(v&&typeof v==='object')cnt++}));
   console.log(p.name,'W',p.W,'rows',p.total,'start',p.info.Nh||p.info.Ncuff,'objs',cnt, 'lastrow segs',JSON.stringify(p.rows[last]));
 });
 console.log('finished',JSON.stringify(C.finished,(k,v)=>typeof v==='number'?Math.round(v*10)/10:v), 'cap',C.capInfo&&{hc:C.capInfo.hc,ease:C.capInfo.easeC.toFixed(2)}, 'yarn',Math.round(C.yarnG));
 const T=E.buildText(P,C);
 if(g==='pullover'&&n==='round'&&sl==='setin') T.forEach(b=>console.log(b.t, b.s));
}
