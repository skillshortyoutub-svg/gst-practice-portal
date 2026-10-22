/* GST Practice Portal - built-in FICTIONAL sample taxpayers (dummy data for students) */
const CITY={'07':['New Delhi','110001',28.63,77.22],'08':['Jaipur','302001',26.91,75.79],'09':['Lucknow','226001',26.85,80.95],'10':['Patna','800001',25.61,85.14],'19':['Kolkata','700001',22.57,88.36],'23':['Indore','452001',22.72,75.86],'24':['Ahmedabad','380001',23.03,72.58],'27':['Pune','411001',18.52,73.86],'29':['Bengaluru','560001',12.97,77.59],'33':['Chennai','600001',13.08,80.27]};
const PINX={'400001':['Mumbai',18.94,72.83],'411001':['Pune',18.52,73.86],'440001':['Nagpur',21.15,79.09],'560001':['Bengaluru',12.97,77.59],'570001':['Mysuru',12.30,76.65],'600001':['Chennai',13.08,80.27],'641001':['Coimbatore',11.00,76.96],'110001':['New Delhi',28.63,77.22],'302001':['Jaipur',26.91,75.79],'226001':['Lucknow',26.85,80.95],'800001':['Patna',25.61,85.14],'700001':['Kolkata',22.57,88.36],'452001':['Indore',22.72,75.86],'380001':['Ahmedabad',23.03,72.58],'395001':['Surat',21.17,72.83]};
/* [PAN, Legal name, constitution, states[], business, HSN, composition category or '', status, regDate] */
const SAMPLE_RAW=[
['AAKPS4821L','Sharma Traders (Sample)','Proprietorship',['27','24'],'Wholesale Business','8471','','Active','2018-07-01'],
['ABHPV7364M','Verma Kirana Store (Sample)','Proprietorship',['09'],'Retail Business','1006','Category A - Trader / other supplier of goods (1%)','Active','2019-04-01'],
['AACFG1937P','Gupta & Sons Partners (Sample)','Partnership',['07','09','10'],'Wholesale Business','6105','','Active','2017-07-01'],
['AAICM5520K','Mehta Infotech Pvt Ltd (Sample)','Private Limited Company',['29','27','33'],'Supplier of Services','9983','','Active','2017-07-01'],
['AADCR8145Q','Rao Steel Industries Ltd (Sample)','Public Limited Company',['33'],'Factory / Manufacturing','7308','','Active','2017-07-01'],
['AAJFK2290B','Kapoor Logistics LLP (Sample)','Limited Liability Partnership',['07','08'],'Warehouse / Depot','9965','','Active','2020-01-15'],
['BQZPD6612E','Desai Dhaba (Sample)','Proprietorship',['24'],'Retail Business','9963','Category A - Restaurant service (5%)','Active','2021-06-10'],
['ABNPI3374H','Iyer Tuition Services (Sample)','Proprietorship',['33'],'Supplier of Services','9992','Category B - Person under section 10(2A), services (6%)','Active','2022-04-01'],
['AACFB7781C','Banerjee Textiles (Sample)','Partnership',['19'],'Factory / Manufacturing','5208','','Active','2017-09-01'],
['ACRPN9055G','Nair Spices Export (Sample)','Proprietorship',['29'],'Export','0904','','Active','2018-11-20'],
['AABCJ4410R','Joshi Pharma Pvt Ltd (Sample)','Private Limited Company',['23','27'],'Factory / Manufacturing','3004','','Active','2017-07-01'],
['ADLPS1188F','Singh Hardware (Sample)','Proprietorship',['10'],'Retail Business','8205','','Suspended','2019-02-01'],
['AAQPK6620D','Khan Furniture Works (Sample)','Proprietorship',['09'],'Factory / Manufacturing','9403','','Cancelled','2018-05-05'],
['AAGFR5502N','Reddy Constructions (Sample)','Partnership',['29','33'],'Works Contract','9954','','Active','2017-08-01'],
['AAHCP3307S','Patel Agro Foods Pvt Ltd (Sample)','Private Limited Company',['24'],'Factory / Manufacturing','1006','','Active','2017-07-01'],
['BCKPM8834J','Mishra Stationers (Sample)','Proprietorship',['10'],'Retail Business','4820','Category A - Trader / other supplier of goods (1%)','Active','2020-10-01'],
['AAEFC9911T','Chatterjee Media LLP (Sample)','Limited Liability Partnership',['19','07'],'Supplier of Services','9983','','Active','2019-03-15'],
['AAFHA2276U','Agarwal HUF Investments (Sample)','Hindu Undivided Family',['08'],'Leasing Business','9972','','Active','2018-04-01'],
['CDTPB4450K','Bose Mobile Point (Sample)','Proprietorship',['19'],'Retail Business','8517','','Active','2023-01-10'],
['AADCT6629W','Thomas Electronics Ltd (Sample)','Public Limited Company',['33','29','27'],'Wholesale Business','8517','','Active','2017-07-01'],
['AFGPY7741Q','Yadav Dairy Farm (Sample)','Proprietorship',['09'],'Retail Business','0401','Category A - Manufacturer (1%)','Suspended','2021-08-01'],
['AACFL3318H','Lal Brothers Jewellers (Sample)','Partnership',['08','07'],'Retail Business','7113','','Active','2017-07-01'],
['ABCPF5562Z','Fernandes Bakery (Sample)','Proprietorship',['27'],'Retail Business','1905','Category A - Manufacturer (1%)','Active','2022-07-01'],
['AABCO9902M','Oberoi Hospitality Pvt Ltd (Sample)','Private Limited Company',['07'],'Supplier of Services','9963','','Cancelled','2017-07-01'],
['AAGFT1209V','Tiwari Transport Co (Sample)','Partnership',['23','10'],'Supplier of Services','9965','','Active','2018-01-01'],
['AACCS8801K','Saxena Chemicals Pvt Ltd (Sample)','Private Limited Company',['24','27'],'Factory / Manufacturing','2804','','Active','2017-07-01']];
function hsh(s){let x=2166136261;for(const c of s)x=Math.imul(x^c.charCodeAt(0),16777619);return x>>>0}
function sampleReturns(g,comp,status,reg){const out=[],h=hsh(g),stop=status==='Cancelled'?'2025-12':status==='Suspended'?'2026-06':'2026-09';
for(let y=2025,m=4;`${y}-${String(m).padStart(2,'0')}`<=stop;m++){if(m>12){m=1;y++}const p=`${y}-${String(m).padStart(2,'0')}`;if(p>stop)break;if(p<reg.slice(0,7))continue;const r=hsh(g+p)%100;
const late=r<12,miss=status!=='Active'&&p>'2025-09'?r<60:r<4;const mk=(type,day,period)=>({type,period,fy:fyOf(p),date:miss?'-':nextMonth(p,late?day+12+r%20:day-1-r%4),status:miss?'Not Filed':'Filed',late:!miss&&late});
if(comp){if(isQEnd(p))out.push(mk('CMP-08',18,p))}else{out.push(mk('GSTR-1',11,p));out.push(mk('GSTR-3B',20,p))}}
if(comp&&stop>='2026-03')out.push({type:'GSTR-4',period:'2025-26',fy:'2025-26',date:hsh(g)%3?'2026-04-28':'2026-06-02',status:'Filed',late:!(hsh(g)%3)});
if(!comp&&stop>='2026-03')out.push({type:'GSTR-9',period:'2025-26',fy:'2025-26',date:h%4?'-':'2026-10-10',status:h%4?'Not Filed':'Filed'});return out}
const SAMPLE=[];SAMPLE_RAW.forEach(([pan,legal,cons,sts,nat,hsn,cat,status,reg],i)=>sts.forEach((st,j)=>{const b=st+pan+'1Z',g=b+gstinChecksum(b),c=CITY[st];
SAMPLE.push({gstin:g,pan,state:st,legal,sample:true,b:{trade:legal.replace(' (Sample)','')+' '+c[0]+' (Sample)',const:cons,comp:cat?'Yes':'No',compCat:cat},ppob:{addr:`${10+i*3}, Sample Market Road`,city:c[0],pin:c[1],ward:'Practice Ward '+(1+i%5),nature:[nat]},hsn:[hsn],effDate:reg,status,cancelDate:status==='Cancelled'?'2026-01-31':'',returns:null})}));
SAMPLE.forEach(s=>s.returns=sampleReturns(s.gstin,s.b.comp==='Yes',s.status,s.effDate));
/* hook into common search */
const _userBy=userBy;userBy=function(g){return _userBy(g)||SAMPLE.find(s=>s.gstin===g)};
const _retFiled=retFiled;retFiled=function(g){const s=SAMPLE.find(x=>x.gstin===g);return s?s.returns:_retFiled(g)};
function allTP(){return DB.get('users',[]).concat(SAMPLE)}
searchPAN=function(p){p=(p||'').toUpperCase().trim();if(!PAN_RE.test(p))return '<p class="err">Enter a valid PAN (e.g. AAICM5520K).</p>';const us=allTP().filter(u=>u.pan===p);
return us.length?`<p>${us.length} GSTIN(s) found for PAN ${p}:</p><table><tr><th>GSTIN/UIN</th><th>GSTIN/UIN Status</th><th>State</th><th>Trade name</th></tr>${us.map(u=>`<tr><td><a href="#" onclick="$('res').innerHTML=searchTP('${u.gstin}');return false">${u.gstin}</a></td><td><span class="st ${u.status==='Active'?'Active':'Rejected'}">${u.status||'Active'}</span></td><td>${STATES[u.state]}</td><td>${esc(u.b.trade)}</td></tr>`).join('')}</table>`:'<p>No GSTIN found for this PAN.</p>'};
function sampleList(){const row=s=>`<tr><td><a href="#" onclick="window.trySample&&trySample('${s.gstin}','${s.pan}');return false">${s.gstin}</a></td><td>${s.pan}</td><td>${esc(s.legal)}</td><td>${STATES[s.state]}</td><td>${s.b.const}</td><td>${s.b.comp==='Yes'?'Composition':'Regular'}</td><td><span class="st ${s.status==='Active'?'Active':'Rejected'}">${s.status}</span></td></tr>`;
return `<table><tr><th>GSTIN</th><th>PAN</th><th>Legal name</th><th>State</th><th>Constitution</th><th>Type</th><th>Status</th></tr>${SAMPLE.map(row).join('')}</table><p class="note">All names, PANs and GSTINs above are fictional and generated for practice (valid format and check digit only). PANs with several GSTINs: AAKPS4821L, AACFG1937P, AAICM5520K, AADCT6629W, AAGFR5502N.</p>`}
/* pin distance (dummy table, straight-line × 1.25 road factor) */
function pinCoord(pin){if(PINX[pin])return PINX[pin].slice(1);const st=Object.values(CITY).find(c=>c[1].slice(0,2)===String(pin).slice(0,2));return st?[st[2],st[3]]:null}
function pinDistance(a,b){if(a===b)return null;const p=pinCoord(a),q=pinCoord(b);if(!p||!q)return undefined;const R=6371,dl=(q[0]-p[0])*Math.PI/180,dg=(q[1]-p[1])*Math.PI/180,x=Math.sin(dl/2)**2+Math.cos(p[0]*Math.PI/180)*Math.cos(q[0]*Math.PI/180)*Math.sin(dg/2)**2;return Math.max(1,Math.round(2*R*Math.asin(Math.sqrt(x))*1.25))}
