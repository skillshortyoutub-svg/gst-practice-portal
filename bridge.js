/* GST Practice Portal - Tally lab bridge (PRACTICE ONLY: not connected to any government IRP / EWB system) */
const BR_ORIGINS=['https://skillshort.com','http://localhost:8767'];
const BR_LOCAL=/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const b64d=s=>{s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return new TextDecoder().decode(Uint8Array.from(atob(s),c=>c.charCodeAt(0)))};
const b64e=s=>btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
async function sha(s){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
const r2=x=>Math.round((+x||0)*100)/100,p2=n=>String(n).padStart(2,'0');
const istNow=()=>new Date(Date.now()+330*6e4);/* shifted clock: read with getUTC* */
const istStr=d=>{const x=new Date(d.getTime()+330*6e4);return `${x.getUTCFullYear()}-${p2(x.getUTCMonth()+1)}-${p2(x.getUTCDate())} ${p2(x.getUTCHours())}:${p2(x.getUTCMinutes())}:${p2(x.getUTCSeconds())}`};
const nicDT=d=>{const x=new Date(d.getTime()+330*6e4);let h=x.getUTCHours();const ap=h>=12?'PM':'AM';h=h%12||12;return `${p2(x.getUTCDate())}/${p2(x.getUTCMonth()+1)}/${x.getUTCFullYear()} ${p2(h)}:${p2(x.getUTCMinutes())}:${p2(x.getUTCSeconds())} ${ap}`};
const todayIST=()=>istStr(new Date()).slice(0,10);
const dmy2iso=s=>{const m=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s||'');if(!m)return null;const iso=`${m[3]}-${m[2]}-${m[1]}`;const d=new Date(iso+'T00:00:00Z');return isNaN(d)||d.toISOString().slice(0,10)!==iso?null:iso};
const fyOfD=iso=>fyOf(iso.slice(0,7));
const E=(c,m)=>({ErrorCode:String(c),ErrorMessage:m});
/* ---- practice error codes (modelled on NIC IRP / EWB style; see INTEGRATION.md) ---- */
const ERR={schema:5002,gstin:3028,inactive:3029,notReg:3030,sameGst:2211,docNo:2283,docDt:2163,docOld:2175,pin:3039,stcd:3037,item:2189,itemTax:2194,rate:2190,igstIntra:2240,cgstInter:2241,tot:2172,ass:2173,dup:2150,noIrn:2148,cnl24:2270,cnlDone:9999,cnlEwb:2230,rsn:2271,dist:702,veh:721,ewbDup:604,ewbNo:325,ewbVal:4012,mode:722};
const RATES_OK=[0,0.1,0.25,1,1.5,3,5,6,7.5,12,18,28,40];
function findUser(g){return DB.get('users',[]).find(u=>u.gstin===g)||(typeof SAMPLE!=='undefined'?SAMPLE.find(s=>s.gstin===g):null)}
function demoFor(g){return (typeof DEMO!=='undefined')?DEMO.find(d=>demoGSTIN(d)===g):null}
function ensureSeller(g){const d=demoFor(g);if(d&&!DB.get('users',[]).some(u=>u.gstin===g&&u.demo))seedDemo(d)}
function chkGstin(g,label,errs,allowURP){if(allowURP&&g==='URP')return;if(!g||typeof g!=='string')return errs.push(E(ERR.schema,label+' is required'));if(!GSTIN_RE.test(g))return errs.push(E(ERR.gstin,label+' '+g+' is invalid (format)'));if(!validGSTIN(g))return errs.push(E(ERR.gstin,label+' '+g+' is invalid (checksum)'));const u=findUser(g);if(u&&u.status&&u.status!=='Active')errs.push(E(ERR.inactive,label+' '+g+' is '+u.status+' (practice register)'))}
const req=(o,path,errs)=>path.split(',').forEach(k=>{if(o==null||o[k]===undefined||o[k]===null||o[k]==='')errs.push(E(ERR.schema,'Required field missing: '+k))});
const DOCNO=/^[a-zA-Z1-9][a-zA-Z0-9\/-]{0,15}$/;
function vEinv(j){const errs=[];if(!j||typeof j!=='object')return [E(ERR.schema,'Invalid JSON')];
req(j,'Version,TranDtls,DocDtls,SellerDtls,BuyerDtls,ItemList,ValDtls',errs);if(errs.length)return errs;
if(j.Version!=='1.1')errs.push(E(ERR.schema,'Version must be "1.1"'));req(j.TranDtls,'TaxSch,SupTyp',errs);
if(!['B2B','SEZWP','SEZWOP','EXPWP','EXPWOP','DEXP'].includes(j.TranDtls.SupTyp))errs.push(E(ERR.schema,'TranDtls.SupTyp invalid'));
const D=j.DocDtls,S=j.SellerDtls,B=j.BuyerDtls,V2=j.ValDtls;req(D,'Typ,No,Dt',errs);req(S,'Gstin,LglNm,Addr1,Loc,Pin,Stcd',errs);req(B,'Gstin,LglNm,Pos,Addr1,Loc,Pin,Stcd',errs);req(V2,'AssVal,TotInvVal',errs);if(errs.length)return errs;
if(!['INV','CRN','DBN'].includes(D.Typ))errs.push(E(ERR.schema,'DocDtls.Typ must be INV, CRN or DBN'));if(!DOCNO.test(String(D.No)))errs.push(E(ERR.docNo,'Document number should not start with 0, / or - and may have only alphanumeric, / and - (max 16)'));
const dt=dmy2iso(D.Dt);if(!dt)errs.push(E(ERR.schema,'DocDtls.Dt must be dd/mm/yyyy'));else{if(dt>todayIST())errs.push(E(ERR.docDt,'Document date cannot be a future date'));}
chkGstin(S.Gstin,'Seller GSTIN',errs);const exp=/^EXP/.test(j.TranDtls.SupTyp);chkGstin(B.Gstin,'Buyer GSTIN',errs,exp);if(S.Gstin===B.Gstin)errs.push(E(ERR.sameGst,'Seller and Buyer GSTIN cannot be the same'));
if(S.Gstin&&String(S.Stcd)!==S.Gstin.slice(0,2))errs.push(E(ERR.stcd,'Seller Stcd should match the first two digits of the Seller GSTIN'));if(B.Gstin&&B.Gstin!=='URP'&&String(B.Stcd)!==B.Gstin.slice(0,2))errs.push(E(ERR.stcd,'Buyer Stcd should match the first two digits of the Buyer GSTIN'));
[['Seller',S.Pin],['Buyer',B.Pin]].forEach(([w,p])=>{if(!/^[1-9]\d{5}$/.test(String(p)))errs.push(E(ERR.pin,w+' PIN must be 6 digits'))});
if(!Array.isArray(j.ItemList)||!j.ItemList.length)errs.push(E(ERR.schema,'ItemList must have at least one item'));
const inter=String(B.Pos)!==String(S.Stcd)||j.TranDtls.SupTyp!=='B2B';const sum={ass:0,igst:0,cgst:0,sgst:0,cess:0,item:0};
(j.ItemList||[]).forEach((it,i)=>{const n='Item '+(it.SlNo||i+1)+': ';const before=errs.length;req(it,'SlNo,IsServc,HsnCd,UnitPrice,TotAmt,AssAmt,GstRt,TotItemVal',errs);if(errs.length>before)return;
if(!/^\d{4}(\d{2}){0,2}$/.test(String(it.HsnCd)))errs.push(E(ERR.schema,n+'HsnCd must be 4, 6 or 8 digits'));if(!RATES_OK.includes(+it.GstRt))errs.push(E(ERR.rate,n+'GstRt '+it.GstRt+' is not a valid GST rate'));
const ass=r2(+it.TotAmt-(+it.Discount||0)),ig=+it.IgstAmt||0,cg=+it.CgstAmt||0,sg=+it.SgstAmt||0,cs=(+it.CesAmt||0)+(+it.CesNonAdvlAmt||0)+(+it.StateCesAmt||0)+(+it.StateCesNonAdvlAmt||0);
if(Math.abs(ass-(+it.AssAmt))>1)errs.push(E(ERR.item,n+'AssAmt should be TotAmt - Discount ('+ass+')'));if(it.Qty!=null&&Math.abs(r2(+it.Qty*+it.UnitPrice)-(+it.TotAmt))>1)errs.push(E(ERR.item,n+'TotAmt should be Qty x UnitPrice'));
if(inter&&(cg||sg))errs.push(E(ERR.cgstInter,n+'CGST/SGST not allowed for inter-State supply (POS '+B.Pos+')'));if(!inter&&ig)errs.push(E(ERR.igstIntra,n+'IGST not allowed for intra-State supply'));
const exT=r2(+it.AssAmt*+it.GstRt/100);if(inter?Math.abs(ig-exT)>1:Math.abs(cg+sg-exT)>1||Math.abs(cg-sg)>0.01)errs.push(E(ERR.itemTax,n+'Tax amount does not match AssAmt x GstRt ('+exT+')'));
const tiv=r2(+it.AssAmt+ig+cg+sg+cs+(+it.OthChrg||0));if(Math.abs(tiv-(+it.TotItemVal))>1)errs.push(E(ERR.item,n+'TotItemVal should be '+tiv));
sum.ass+=+it.AssAmt;sum.igst+=ig;sum.cgst+=cg;sum.sgst+=sg;sum.cess+=cs;sum.item+=+it.TotItemVal});
if(!errs.length){if(Math.abs(sum.ass-(+V2.AssVal))>1)errs.push(E(ERR.ass,'ValDtls.AssVal should equal sum of item AssAmt ('+r2(sum.ass)+')'));[['IgstVal','igst'],['CgstVal','cgst'],['SgstVal','sgst']].forEach(([a,b])=>{if(Math.abs((+V2[a]||0)-sum[b])>1)errs.push(E(ERR.ass,'ValDtls.'+a+' should equal sum of items ('+r2(sum[b])+')'))});
const tot=r2(sum.item+(+V2.OthChrg||0)-(+V2.Discount||0)+(+V2.RndOffAmt||0));if(Math.abs(tot-(+V2.TotInvVal))>1)errs.push(E(ERR.tot,'ValDtls.TotInvVal should be sum of TotItemVal + OthChrg - Discount + RndOffAmt ('+tot+')'))}
if(j.EwbDtls){const w=j.EwbDtls;if(!(+w.Distance>=0&&+w.Distance<=4000))errs.push(E(ERR.dist,'EwbDtls.Distance must be 0-4000 km'));if(w.VehNo&&!VEHRE.test(String(w.VehNo).toUpperCase()))errs.push(E(ERR.veh,'EwbDtls.VehNo invalid (e.g. MH12AB1234)'));if(w.TransId&&!GSTIN_RE.test(w.TransId))errs.push(E(ERR.gstin,'EwbDtls.TransId invalid'));if(w.TransMode&&!['1','2','3','4'].includes(String(w.TransMode)))errs.push(E(ERR.mode,'TransMode must be 1 Road, 2 Rail, 3 Air, 4 Ship'))}
return errs}
const VEHRE=/^([A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}|TR[A-Z0-9]{7,13}|BP[A-Z0-9]{7,13})$/;
function vUpto(t,dist,odc){if(!(dist>0))dist=1;const days=Math.max(1,Math.ceil(dist/(odc?20:200)));/* day ends midnight IST of the following day(s) */const x=new Date(t.getTime()+330*6e4);x.setUTCDate(x.getUTCDate()+days);x.setUTCHours(23,59,59,0);return new Date(x.getTime()-330*6e4)}
const MODES={'1':'Road','2':'Rail','3':'Air','4':'Ship'};
function readAll(kind){const out=[];Object.keys(localStorage).forEach(k=>{const m=k.match(/^gpp_([0-9A-Z]{15})_(einv|ewb)$/);if(m&&m[2]===kind)JSON.parse(localStorage[k]).forEach(r=>out.push({g:m[1],r}))});return out}
const ld=(g,k)=>DB.get(g+'_'+k,[]),sv=(g,k,v)=>DB.set(g+'_'+k,v);
async function signedQR(o){const h=b64e(JSON.stringify({alg:'PRACTICE-SHA256',typ:'JWT',kid:'PRACTICE-NOT-NIC'}));const p=b64e(JSON.stringify({data:JSON.stringify(o),iss:'GST Practice Portal - PRACTICE IRP (not NIC, not valid)'}));return h+'.'+p+'.'+b64e(await sha(h+'.'+p+'.practice'))}
function qrPNG(text){const q=qrcode(0,'L');q.addData(text);q.make();const n=q.getModuleCount(),c=4,m=4,cv=document.createElement('canvas');cv.width=cv.height=(n+2*m)*c;const x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,cv.width,cv.height);x.fillStyle='#000';for(let r=0;r<n;r++)for(let k=0;k<n;k++)if(q.isDark(r,k))x.fillRect((k+m)*c,(r+m)*c,c,c);x.fillStyle='rgba(200,0,0,.85)';x.font='bold '+Math.max(10,c*3)+'px sans-serif';x.textAlign='center';x.fillText('PRACTICE',cv.width/2,cv.height-2);return cv.toDataURL('image/png')}
function mkEwb({g,now,irn,sub,dtype,dno,dd,toG,toState,fromPin,toPin,pn,hsn,qty,tv,rate,tax,tot,tid,tn,dist,odc,mode,veh}){const hasB=!!veh;const vu=hasB?vUpto(now,dist,odc):null;
const w={no:'1'+rnd(11),t:now.toISOString(),irn:irn||'',tt:'Outward',sub:sub||'Supply',dtype,dno,dd,toG,toState,fromPin,toPin,pn,hsn,qty,tv,rate,tax,tot,tid:tid||'',tn:tn||'',dist,odc:!!odc,mode,veh:hasB?[{v:veh,mode,t:now.toISOString(),reason:'First Time',from:'Dispatch PIN '+fromPin}]:[],vu:vu?vu.toISOString():null,st:'Active',ext:[],src:'Tally lab bridge'};
const l=ld(g,'ewb');l.unshift(w);sv(g,'ewb',l);return w}
async function genEinv(j){const errs=vEinv(j);if(errs.length)return {status:'0',errors:errs};
const S=j.SellerDtls,B=j.BuyerDtls,D=j.DocDtls,V2=j.ValDtls,g=S.Gstin,dt=dmy2iso(D.Dt),fy=fyOfD(dt),no=String(D.No).toUpperCase();
const irn=await sha(g+fy+D.Typ+no);ensureSeller(g);const L=ld(g,'einv');const dupe=L.find(x=>x.irn===irn);
if(dupe)return {status:'0',errors:[E(ERR.dup,'Duplicate IRN')],InfoDtls:[{InfCd:'DUPIRN',Desc:{AckNo:dupe.ack,AckDt:istStr(new Date(dupe.t)),Irn:irn}}]};
const now=new Date(),ack=String(istNow().getUTCFullYear()).slice(2)+'1'+rnd(12),it0=[...j.ItemList].sort((a,b)=>b.AssAmt-a.AssAmt)[0];
const sq=await signedQR({SellerGstin:g,BuyerGstin:B.Gstin,DocNo:D.No,DocTyp:D.Typ,DocDt:D.Dt,TotInvVal:+V2.TotInvVal,ItemCnt:j.ItemList.length,MainHsnCode:String(it0.HsnCd),Irn:irn,IrnDt:istStr(now)});
const tax={igst:r2(+V2.IgstVal||0),cgst:r2(+V2.CgstVal||0),sgst:r2(+V2.SgstVal||0)};
const rec={irn,ack,t:now.toISOString(),no:D.No,dtype:D.Typ,fy,rg:B.Gstin,pos:String(B.Pos).padStart(2,'0'),val:r2(+V2.AssVal),tot:r2(+V2.TotInvVal),tax,hsn:String(it0.HsnCd),rate:+it0.GstRt,docId:'',st:'Active',src:'Tally lab bridge',signedQR:sq,items:j.ItemList.length,date:dt,buyer:B.LglNm};
/* auto-populate GSTR-1 like the IRP does, unless that period's GSTR-1 is already filed */
const per=dt.slice(0,7),R=ld(g,'returns');if(!R.some(r=>r.type==='GSTR-1'&&r.period===per&&r.status==='Filed')&&j.TranDtls.SupTyp==='B2B'){const docs=ld(g,'docs');const id=Date.now()+''+rnd(3);
docs.push({id,src:'GSTR-1',tbl:D.Typ==='INV'?'4A':'9B',per,date:dt,no:D.No,rg:B.Gstin,pos:rec.pos,rate:rec.rate,val:rec.val,tot:rec.tot,hsn:rec.hsn,ntype:D.Typ==='INV'?'':D.Typ==='CRN'?'C':'D',rc:(j.TranDtls.RegRev==='Y')?'Yes':'No',dtype:D.Typ,sup:'Regular',...tax,cess:0,irn,einvSrc:'bridge'});sv(g,'docs',docs);rec.docId=id}
const res={status:'1',errors:[],AckNo:ack,AckDt:istStr(now),Irn:irn,SignedQRCode:sq,QrCodeImage:qrPNG(sq),Status:'ACT',EwbNo:null,EwbDt:null,EwbValidTill:null,SellerGstin:g,DocNo:D.No,DocTyp:D.Typ,FY:fy};
if(j.EwbDtls){const w0=j.EwbDtls,mode=MODES[String(w0.TransMode||'1')]||'Road',veh=mode==='Road'?(w0.VehNo||'').toUpperCase():(w0.TransDocNo||'');
const w=mkEwb({g,now,irn,dtype:'Tax Invoice',dno:D.No,dd:dt,toG:B.Gstin,toState:String(B.Stcd).padStart(2,'0'),fromPin:String(S.Pin),toPin:String((j.ShipDtls||B).Pin),pn:it0.PrdDesc||'Goods',hsn:String(it0.HsnCd),qty:+it0.Qty||1,tv:rec.val,rate:rec.rate,tax,tot:rec.tot,tid:w0.TransId,tn:w0.TransName,dist:+w0.Distance||0,odc:w0.VehType==='O',mode,veh});
rec.ewbNo=w.no;res.EwbNo=w.no;res.EwbDt=istStr(now);res.EwbValidTill=w.vu?istStr(new Date(w.vu)):null}
L.unshift(rec);sv(g,'einv',L);return res}
function vEwb(j){const errs=[];if(!j||typeof j!=='object')return [E(ERR.schema,'Invalid JSON')];req(j,'supplyType,subSupplyType,docType,docNo,docDate,fromGstin,fromPincode,fromStateCode,toGstin,toPincode,toStateCode,transDistance,itemList,totInvValue',errs);if(errs.length)return errs;
if(!['O','I'].includes(j.supplyType))errs.push(E(ERR.schema,'supplyType must be O or I'));if(!['INV','BIL','BOE','CHL','OTH'].includes(j.docType))errs.push(E(ERR.schema,'docType must be INV, BIL, BOE, CHL or OTH'));if(!DOCNO.test(String(j.docNo)))errs.push(E(ERR.docNo,'Invalid docNo'));
const dt=dmy2iso(j.docDate);if(!dt)errs.push(E(ERR.schema,'docDate must be dd/mm/yyyy'));else{if(dt>todayIST())errs.push(E(ERR.docDt,'Document date cannot be a future date'));if((new Date(todayIST())-new Date(dt))/864e5>180)errs.push(E(ERR.docOld,'Document date older than 180 days not allowed'))}
chkGstin(j.fromGstin,'fromGstin',errs);chkGstin(j.toGstin,'toGstin',errs,true);if(j.fromGstin===j.toGstin)errs.push(E(ERR.sameGst,'fromGstin and toGstin cannot be the same'));
if(String(j.fromStateCode).padStart(2,'0')!==String(j.fromGstin).slice(0,2))errs.push(E(ERR.stcd,'fromStateCode should match fromGstin'));if(j.toGstin!=='URP'&&String(j.toStateCode).padStart(2,'0')!==String(j.toGstin).slice(0,2))errs.push(E(ERR.stcd,'toStateCode should match toGstin'));
[j.fromPincode,j.toPincode].forEach(p=>{if(!/^[1-9]\d{5}$/.test(String(p)))errs.push(E(ERR.pin,'Pincode must be 6 digits'))});const d=+j.transDistance;if(!(d>=0&&d<=4000))errs.push(E(ERR.dist,'transDistance must be 0-4000 km'));
if(String(j.fromPincode)===String(j.toPincode)&&d>100)errs.push(E(ERR.dist,'Same pincode: distance cannot exceed 100 km'));const mode=String(j.transMode||'');if(mode&&!MODES[mode])errs.push(E(ERR.mode,'transMode must be 1-4'));
if(j.vehicleNo&&!VEHRE.test(String(j.vehicleNo).toUpperCase()))errs.push(E(ERR.veh,'Invalid vehicleNo'));if(j.transporterId&&!GSTIN_RE.test(j.transporterId))errs.push(E(ERR.gstin,'Invalid transporterId'));
if(!Array.isArray(j.itemList)||!j.itemList.length)errs.push(E(ERR.schema,'itemList required'));const inter=String(j.toStateCode).padStart(2,'0')!==String(j.fromStateCode).padStart(2,'0');let tv=0,tx={igst:0,cgst:0,sgst:0,cess:0};
(j.itemList||[]).forEach((it,i)=>{const b=errs.length;req(it,'hsnCode,taxableAmount',errs);if(errs.length>b)return;if(!/^\d{4,8}$/.test(String(it.hsnCode)))errs.push(E(ERR.schema,'Item '+(i+1)+': hsnCode 4-8 digits'));if(inter&&(+it.cgstRate||+it.sgstRate))errs.push(E(ERR.cgstInter,'Item '+(i+1)+': CGST/SGST not allowed for inter-State movement'));if(!inter&&+it.igstRate)errs.push(E(ERR.igstIntra,'Item '+(i+1)+': IGST not allowed for intra-State movement'));
tv+=+it.taxableAmount;tx.igst+=+it.taxableAmount*(+it.igstRate||0)/100;tx.cgst+=+it.taxableAmount*(+it.cgstRate||0)/100;tx.sgst+=+it.taxableAmount*(+it.sgstRate||0)/100;tx.cess+=+it.taxableAmount*(+it.cessRate||0)/100});
if(!errs.length){if(j.totalValue!=null&&Math.abs(+j.totalValue-tv)>1)errs.push(E(ERR.ewbVal,'totalValue should be sum of taxableAmount ('+r2(tv)+')'));[['igstValue','igst'],['cgstValue','cgst'],['sgstValue','sgst']].forEach(([a,b])=>{if(j[a]!=null&&Math.abs(+j[a]-tx[b])>1)errs.push(E(ERR.ewbVal,a+' should be '+r2(tx[b])))});
const tot=r2(tv+tx.igst+tx.cgst+tx.sgst+tx.cess+(+j.otherValue||0));if(Math.abs(tot-(+j.totInvValue))>2)errs.push(E(ERR.ewbVal,'totInvValue should be '+tot))}
if(!errs.length&&ld(j.fromGstin,'ewb').some(w=>w.st==='Active'&&String(w.dno).toUpperCase()===String(j.docNo).toUpperCase()&&w.dd===dt))errs.push(E(ERR.ewbDup,'E-way bill is already generated for this document number'));return errs}
const SUBT={'1':'Supply','2':'Import','3':'Export','4':'Job Work','5':'For Own Use','6':'Job work Returns','7':'Sales Return','8':'Others','9':'SKD/CKD/Lots','10':'Line Sales','11':'Recipient Not Known','12':'Exhibition or Fairs'};
const DTN={INV:'Tax Invoice',BIL:'Bill of Supply',BOE:'Bill of Entry',CHL:'Delivery Challan',OTH:'Others'};
async function genEwb(j){const errs=vEwb(j);if(errs.length)return {status:'0',errors:errs};const g=j.fromGstin;ensureSeller(g);const now=new Date(),it0=[...j.itemList].sort((a,b)=>b.taxableAmount-a.taxableAmount)[0],mode=MODES[String(j.transMode||'1')]||'Road';
const veh=mode==='Road'?String(j.vehicleNo||'').toUpperCase():String(j.transDocNo||'');const tv=r2(j.itemList.reduce((s,i)=>s+ +i.taxableAmount,0));
const w=mkEwb({g,now,sub:SUBT[String(j.subSupplyType)]||'Supply',dtype:DTN[j.docType],dno:j.docNo,dd:dmy2iso(j.docDate),toG:j.toGstin,toState:String(j.toStateCode).padStart(2,'0'),fromPin:String(j.fromPincode),toPin:String(j.toPincode),pn:it0.productName||'Goods',hsn:String(it0.hsnCode),qty:+it0.quantity||1,tv,rate:(+it0.igstRate||0)+(+it0.cgstRate||0)+(+it0.sgstRate||0),tax:{igst:r2(+j.igstValue||0),cgst:r2(+j.cgstValue||0),sgst:r2(+j.sgstValue||0)},tot:r2(+j.totInvValue),tid:j.transporterId,tn:j.transporterName,dist:+j.transDistance,odc:j.vehicleType==='O',mode,veh});
return {status:'1',errors:[],ewayBillNo:w.no,ewayBillDate:nicDT(now),validUpto:w.vu?nicDT(new Date(w.vu)):null,validUptoISO:w.vu,alert:w.vu?'':'Part-B (vehicle) not entered: EWB is not valid for movement until Part-B is updated',fromGstin:g,docNo:j.docNo}}
const CNL={'1':'Duplicate','2':'Data entry mistake','3':'Order Cancelled','4':'Others'};
async function doCancel(j){const errs=[];if(!j||(!j.irn&&!j.Irn&&!j.ewbNo))return {status:'0',errors:[E(ERR.schema,'irn or ewbNo is required')]};const rsn=String(j.CnlRsn||j.cancelRsnCode||'');if(!CNL[rsn])return {status:'0',errors:[E(ERR.rsn,'CnlRsn must be 1 Duplicate, 2 Data entry mistake, 3 Order Cancelled or 4 Others')]};
const rem=String(j.CnlRem||j.cancelRmrk||'').slice(0,100),now=new Date();
if(j.irn||j.Irn){const irn=j.irn||j.Irn,hit=readAll('einv').find(o=>o.r.irn===irn);if(!hit)return {status:'0',kind:'einv',errors:[E(ERR.noIrn,'Requested IRN data is not available')]};const e=hit.r;
if(e.st!=='Active')return {status:'0',kind:'einv',Irn:irn,errors:[E(ERR.cnlDone,'IRN is already cancelled')]};if(now-new Date(e.t)>24*36e5)return {status:'0',kind:'einv',Irn:irn,errors:[E(ERR.cnl24,'The allowed cancellation time limit (24 hours) is crossed; issue a credit note instead')]};
if(e.ewbNo&&ld(hit.g,'ewb').some(w=>w.no===e.ewbNo&&w.st==='Active'))return {status:'0',kind:'einv',Irn:irn,errors:[E(ERR.cnlEwb,'This IRN cannot be cancelled because an active e-way bill ('+e.ewbNo+') exists; cancel the EWB first')]};
const L=ld(hit.g,'einv'),x=L.find(y=>y.irn===irn);x.st='Cancelled';x.ct=now.toISOString();x.reason=CNL[rsn];x.remark=rem;sv(hit.g,'einv',L);const D=ld(hit.g,'docs'),d=D.find(y=>y.id===x.docId);if(d){d.cancelled=true;sv(hit.g,'docs',D)}
return {status:'1',errors:[],kind:'einv',Irn:irn,CancelDate:istStr(now)}}
const no=String(j.ewbNo),hit=readAll('ewb').find(o=>o.r.no===no);if(!hit)return {status:'0',kind:'ewb',errors:[E(ERR.ewbNo,'Could not retrieve data: invalid e-way bill number')]};
if(hit.r.st!=='Active')return {status:'0',kind:'ewb',ewayBillNo:no,errors:[E(ERR.cnlDone,'E-way bill is already cancelled')]};if(now-new Date(hit.r.t)>24*36e5)return {status:'0',kind:'ewb',ewayBillNo:no,errors:[E(312,'E-way bill can be cancelled only within 24 hours of generation')]};
const L=ld(hit.g,'ewb'),w=L.find(y=>y.no===no);w.st='Cancelled';w.ct=now.toISOString();w.reason=CNL[rsn]+(rem?' - '+rem:'');sv(hit.g,'ewb',L);return {status:'1',errors:[],kind:'ewb',ewayBillNo:no,cancelDate:nicDT(now)}}
/* ---- reply + page ---- */
function reply(type,res){const msg={type,...res};const targets=new Set(BR_ORIGINS);try{const r=document.referrer&&new URL(document.referrer).origin;if(r&&(BR_ORIGINS.includes(r)||BR_LOCAL.test(r)))targets.add(r)}catch(e){}
const sent=[];if(window.opener&&!window.opener.closed)targets.forEach(o=>{try{window.opener.postMessage(msg,o);sent.push(o)}catch(e){}});window._bridgeResult=msg;return sent}
const row=(k,v)=>`<tr><th>${esc(k)}</th><td style="word-break:break-all">${v}</td></tr>`;
function render(type,res,input,sent){const ok=res.status==='1';let h=`<div class="card" style="border:2px solid ${ok?'#1d63c4':'#d11'}"><h3>${{'gpp-einv-result':'Practice e-Invoice (IRN)','gpp-ewb-result':'Practice e-Way Bill','gpp-cancel-result':'Practice cancellation'}[type]} - ${ok?'<span class="st Filed">SUCCESS</span>':'<span class="st Rejected">FAILED</span>'}</h3>
<div class="note"><b>PRACTICE ONLY.</b> Generated by GST Practice Portal for training. Not an IRN / e-way bill from any government system and not valid for any real supply or movement of goods.</div>`;
if(!ok)h+=`<table class="grid1" id="brErr"><tr><th>Error code</th><th>Message</th></tr>${res.errors.map(e=>`<tr><td>${e.ErrorCode}</td><td>${esc(e.ErrorMessage)}</td></tr>`).join('')}</table>`;
else{h+='<div style="display:flex;gap:20px;flex-wrap:wrap"><div style="flex:1;min-width:300px"><table id="brOut">';Object.entries(res).forEach(([k,v])=>{if(['status','errors','QrCodeImage','SignedQRCode'].includes(k)||v==null||v==='')return;h+=row(k,esc(String(v)))});if(res.SignedQRCode)h+=row('SignedQRCode',`<code style="font-size:11px">${esc(res.SignedQRCode.slice(0,90))}…</code>`);h+='</table></div>';if(res.QrCodeImage)h+=`<div><img id="brQR" src="${res.QrCodeImage}" alt="Practice QR" width="200"><br><small>Practice QR (not NIC-signed)</small></div>`;h+='</div>';
const g=res.SellerGstin||res.fromGstin;if(g){const link=res.Irn&&type==='gpp-einv-result'?'dashboard.html#einv/'+res.Irn:res.ewayBillNo&&type==='gpp-ewb-result'?'dashboard.html#ewb/'+res.ewayBillNo:'';const dl=demoFor(g);h+=`<p>Saved in the practice portal under seller <b>${g}</b>. ${dl?`Log in as <b>${dl.user}</b> / Demo@1234 (or use the demo login) and open <a href="${link||'dashboard.html'}">${link||'dashboard.html'}</a>.`:findUser(g)&&findUser(g).user?`Log in as this taxpayer and open <a href="${link}">${link}</a>.`:'This seller is a sample taxpayer without a login, so the record is stored but cannot be opened in the dashboard; use a demo persona GSTIN as seller to see it there.'}</p>`;if(res.EwbNo)h+=`<p>E-way bill <b>${res.EwbNo}</b> valid till ${res.EwbValidTill||'(Part-B pending)'} - <a href="dashboard.html#ewb/${res.EwbNo}">open</a></p>`}}
h+=`<p><small>${sent.length?'Result posted to the opener window (delivered only if it is one of: '+sent.map(esc).join(', ')+').':'No opener window: result shown here only.'}</small> <button class="btn" onclick="window.close()">CLOSE</button></p><details><summary>Request received</summary><pre style="white-space:pre-wrap;font-size:11px">${esc(JSON.stringify(input,null,1)||'')}</pre></details></div>`;$('brMain').innerHTML=h}
async function bridgeRun(){const raw=location.hash.slice(1);let type='gpp-einv-result',body=raw,fn=genEinv;
if(raw.startsWith('ewb:')){type='gpp-ewb-result';body=raw.slice(4);fn=genEwb}else if(raw.startsWith('cancel:')){type='gpp-cancel-result';body=raw.slice(7);fn=doCancel}
if(!raw){$('brMain').innerHTML='<div class="card"><h3>Tally lab bridge</h3><p>Open this page from the Tally Prime practice lab. See INTEGRATION.md for the formats.</p></div>';return}
let j=null,res;try{j=JSON.parse(b64d(decodeURIComponent(body)))}catch(e){res={status:'0',errors:[E(ERR.schema,'Payload is not valid base64url JSON')]}}
if(!res){try{res=await fn(j)}catch(e){res={status:'0',errors:[E(9998,'Practice bridge internal error: '+e.message)]}}}
const sent=reply(type,res);render(type,res,j,sent);document.title=(res.status==='1'?'OK':'ERR')+' - Bridge - GST Practice Portal'}
