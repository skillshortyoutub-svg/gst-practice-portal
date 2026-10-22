/* GST Practice Portal - shared logic (training simulator, dummy data only) */
const DB={get:(k,d)=>JSON.parse(localStorage.getItem('gpp_'+k)||JSON.stringify(d)),set:(k,v)=>localStorage.setItem('gpp_'+k,JSON.stringify(v))};
const STATES={'07':'Delhi','08':'Rajasthan','09':'Uttar Pradesh','10':'Bihar','19':'West Bengal','23':'Madhya Pradesh','24':'Gujarat','27':'Maharashtra','29':'Karnataka','33':'Tamil Nadu'};
const PAN_RE=/^[A-Z]{3}[ABCEFGHJLPT][A-Z][0-9]{4}[A-Z]$/;
const GSTIN_RE=/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const USER_RE=/^[A-Za-z][A-Za-z0-9_.-]{7,14}$/;
const PASS_RE=/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,15}$/;
const CONST_PAN={'Proprietorship':'P','Partnership':'F','Hindu Undivided Family':'H','Private Limited Company':'C','Public Limited Company':'C','Limited Liability Partnership':'EF','Society/ Club/ Trust/ AOP':'A'};
const H=['igst','cgst','sgst','cess'],HN={igst:'Integrated Tax',cgst:'Central Tax',sgst:'State/UT Tax',cess:'CESS'};
const MIN=['tax','interest','penalty','fee','other'];
const HSN=[['0401','Milk and cream'],['1006','Rice'],['3004','Medicaments'],['4820','Registers, notebooks, stationery'],['5208','Woven fabrics of cotton'],['6105','Men\'s shirts, knitted'],['8471','Computers and units'],['8517','Telephones, mobile phones'],['9403','Other furniture'],['9954','Construction services (SAC)'],['9963','Accommodation, food services (SAC)'],['9983','Other professional services (SAC)'],['9997','Other services (SAC)']];
const MANUAL={reg:'https://tutorial.gst.gov.in/userguide/registration/Apply_for_Registration_Normal_Taxpayer.htm',track:'https://tutorial.gst.gov.in/userguide/registration/Track_Application_Status.htm',first:'https://tutorial.gst.gov.in/userguide/loginanddsc/First_Time_Login.htm',gstr1:'https://tutorial.gst.gov.in/userguide/returns/GSTR_1.htm',iff:'https://tutorial.gst.gov.in/userguide/returns/Manual_IFF.htm',gstr3b:'https://tutorial.gst.gov.in/userguide/returns/Create_and_Submit_GSTR3B.htm',trs:'https://tutorial.gst.gov.in/userguide/returns/Track_Return_Status_Manual.htm',challan:'https://tutorial.gst.gov.in/userguide/payments/Create_Challan_(Post_Login).htm',pay:'https://tutorial.gst.gov.in/userguide/payments/index.htm',cash:'https://tutorial.gst.gov.in/userguide/ledgers/Electronic_Cash_Ledger.htm',search:'https://tutorial.gst.gov.in/userguide/taxpayersdashboard/Search_Taxpayer_manual.htm',comp:'https://www.gst.gov.in/help/returns',returns:'https://tutorial.gst.gov.in/userguide/returns/index.htm'};
function gstinChecksum(s14){const c='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';let sum=0;for(let i=0;i<14;i++){let p=c.indexOf(s14[i])*(i%2?2:1);sum+=Math.floor(p/36)+p%36}return c[(36-sum%36)%36]}
function validGSTIN(g){return GSTIN_RE.test(g)&&gstinChecksum(g.slice(0,14))===g[14]}
function makeGSTIN(st,pan){const n=DB.get('users',[]).filter(u=>u.pan===pan&&u.state===st).length+1;const b=st+pan+'123456789ABCDEFGHJKLMNPQRSTUVWXY'[n-1]+'Z';return b+gstinChecksum(b)}
function rnd(n){let s='';for(let i=0;i<n;i++)s+=Math.floor(Math.random()*10);return s}
function captcha(){return Math.random().toString(36).slice(2,8).toUpperCase()}
const today=()=>new Date().toISOString().slice(0,10);
const f=n=>(+n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function words(n){n=Math.round(+n||0);if(!n)return 'Zero Rupees Only';const a=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'],b=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
const t=x=>x<20?a[x]:b[Math.floor(x/10)]+(x%10?' '+a[x%10]:''),h=x=>(x>=100?a[Math.floor(x/100)]+' Hundred'+(x%100?' ':''):'')+(x%100?t(x%100):'');
let s='',p=[[1e7,'Crore'],[1e5,'Lakh'],[1e3,'Thousand']];for(const[v,w]of p){if(n>=v){s+=h(Math.floor(n/v))+' '+w+' ';n%=v}}return 'Rupees '+(s+h(n)).trim()+' Only'}
/* period helpers: period 'YYYY-MM'; FY 'YYYY-YY' */
function fyOf(p){const[y,m]=p.split('-').map(Number);const s=m>=4?y:y-1;return s+'-'+String(s+1).slice(2)}
function qOf(p){const m=+p.split('-')[1];return m>=4&&m<=6?1:m<=9&&m>=7?2:m>=10?3:4}
function isQEnd(p){return [3,6,9,12].includes(+p.split('-')[1])}
function nextMonth(p,day){let[y,m]=p.split('-').map(Number);m++;if(m>12){m=1;y++}return `${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`}
function periodLabel(p){return new Date(p+'-01').toLocaleString('en-IN',{month:'long',year:'numeric'})}
function stateOf(g){return g.slice(0,2)}
function layout(){const s=sessionStorage.getItem('gpp_session');
document.body.insertAdjacentHTML('afterbegin',`<div class="banner">⚠ Practice/training site only - not the official GST portal. Use dummy data only.</div>
<div class="topstrip"><span>Training environment for students</span><span><a href="help.html">Help</a> · ${new Date().toDateString()}</span></div>
<header><div class="logo"><i>GP</i><div>GST Practice Portal<small>A learning simulator for GST workflows · dummy data only</small></div></div><div>${s?`<a class="btn" href="dashboard.html">Dashboard</a><a class="btn" href="#" onclick="sessionStorage.removeItem('gpp_session');location.href='index.html'">Logout</a>`:`<a class="btn" href="register.html">Register</a><a class="btn" href="login.html">Login</a>`}</div></header>
<nav class="mainnav"><a href="index.html">Home</a>
<div class="dd"><a href="#">Services ▾</a><div class="ddm wide">
<div><b>Registration</b><a href="register.html">New Registration</a><a href="track.html">Track Application Status</a></div>
<div><b>Payments</b><a href="${s?'dashboard.html#Create Challan':'login.html'}">Create Challan</a><a href="track.html#payment">Track Payment Status</a></div>
<div><b>User Services</b><a href="tools.html#hsn">Search HSN/SAC</a><a href="tools.html#calc">GST Calculator</a><a href="${s?'dashboard.html#Invoice Generator':'login.html'}">Invoice Generator</a></div>
<div><b>Returns</b><a href="${s?'dashboard.html#Returns Dashboard':'login.html'}">Returns Dashboard</a><a href="${s?'dashboard.html#Track Return Status':'login.html'}">Track Return Status</a><a href="${s?'dashboard.html#GSTR-2A / 2B':'login.html'}">GSTR-2A / 2B</a><b>e-Invoice / e-Way Bill</b><a href="${s?'dashboard.html#e-Invoice':'login.html'}">e-Invoice (practice)</a><a href="${s?'dashboard.html#e-Way Bill':'login.html'}">e-Way Bill (practice)</a></div></div></div>
<a href="index.html#law">GST Law</a><a href="index.html#downloads">Downloads</a>
<div class="dd"><a href="search.html">Search Taxpayer ▾</a><div class="ddm"><a href="search.html#gstin">Search by GSTIN/UIN</a><a href="search.html#pan">Search by PAN</a><a href="search.html#comp">Search Composition Taxpayer</a></div></div>
<div class="dd"><a href="help.html">Help ▾</a><div class="ddm"><a href="help.html#registration">Registration</a><a href="help.html#login">Login / First Login</a><a href="help.html#gstr1">GSTR-1 / IFF</a><a href="help.html#gstr3b">GSTR-3B</a><a href="help.html#payments">Challan & Ledgers</a><a href="help.html#composition">Composition</a><a href="help.html#search">Search Taxpayer</a><a href="help.html#gstr2b">GSTR-2A / 2B</a><a href="help.html#amend">Amendments</a><a href="help.html#einvoice">e-Invoice</a><a href="help.html#ewaybill">e-Way Bill</a></div></div>
<a href="index.html#news">News and Updates</a></nav>`);
document.body.insertAdjacentHTML('beforeend',`<footer><div class="cols"><div><h4>About this site</h4><a href="help.html">What is GST Practice Portal</a><a href="index.html#law">GST Law summary</a></div><div><h4>Services</h4><a href="register.html">New Registration</a><a href="track.html">Track Application Status</a><a href="track.html#payment">Track Payment Status</a><a href="search.html">Search Taxpayer</a></div><div><h4>Help for students</h4><a href="help.html">Module guides</a><a href="help.html#gstr3b">Filing GSTR-3B</a><a href="help.html#payments">Challan & ledgers</a><a href="help.html#reset">Reset practice data</a></div><div><h4>Contact (practice)</h4><a href="#">Help desk: 0000-000-000 (dummy)</a><a href="help.html">Raise a doubt with your teacher</a></div></div>
<p>GST Practice Portal — educational simulator. Not affiliated with any government body. All data is dummy and stays in your browser.</p><div class="bottom">Works best in a recent desktop browser at 1024×768 or above.</div></footer>`);
const star=()=>document.querySelectorAll('label:not([data-r])').forEach(l=>{l.dataset.r=1;[...l.childNodes].forEach(n=>{if(n.nodeType===3&&/\*/.test(n.nodeValue)){const parts=n.nodeValue.split('*');const fr=document.createDocumentFragment();parts.forEach((t,i)=>{fr.append(t);if(i<parts.length-1){const r=document.createElement('span');r.className='req';r.textContent='*';fr.append(r)}});n.replaceWith(fr)}})});
star();new MutationObserver(star).observe(document.body,{childList:true,subtree:true})}
function helpLink(id){return `<a class="help" href="help.html#${id}" target="_blank">? Help</a>`}
/* ---- Search taxpayer ---- */
function userBy(g){return DB.get('users',[]).find(u=>u.gstin===g)}
function retFiled(g){return DB.get(g+'_returns',[])}
function tpDetails(u){return `<table><tr><th>GSTIN/UIN</th><td>${u.gstin}</td></tr><tr><th>Legal Name of Business</th><td>${esc(u.legal)}</td></tr><tr><th>Trade Name</th><td>${esc(u.b.trade)}</td></tr>
<tr><th>Effective Date of registration</th><td>${u.effDate}</td></tr><tr><th>Constitution of Business</th><td>${u.b.const}</td></tr><tr><th>GSTIN / UIN Status</th><td><span class="st ${(u.status||'Active')==='Active'?'Active':'Rejected'}">${u.status||'Active'}</span></td></tr>${u.cancelDate?`<tr><th>Date of Cancellation</th><td>${u.cancelDate}</td></tr>`:''}
<tr><th>Taxpayer Type</th><td>${u.b.comp==='Yes'?'Composition':'Regular'}</td></tr><tr><th>Administrative Office</th><td>STATE - ${STATES[u.state]} (practice jurisdiction: ${esc(u.ppob.ward)})</td></tr>
<tr><th>Principal Place of Business</th><td>${esc(u.ppob.addr)}, ${esc(u.ppob.city)}, ${STATES[u.state]}, ${u.ppob.pin}</td></tr><tr><th>Nature of Business Activities</th><td>${(u.ppob.nature||[]).join(', ')}</td></tr></table>
<br><button class="btn s" onclick="this.nextElementSibling.classList.toggle('hide')">SHOW FILING TABLE</button><div class="hide"><table><tr><th>Return Type</th><th>Tax Period</th><th>Date of Filing</th><th>Status</th></tr>
${retFiled(u.gstin).map(r=>`<tr><td>${r.type}</td><td>${r.period}</td><td>${r.date}</td><td><span class="st ${r.status==='Filed'?'Filed':'NotFiled'}">${r.status}${r.late?' (late)':''}</span></td></tr>`).join('')||'<tr><td colspan=4>No returns filed yet</td></tr>'}</table></div>`}
function searchTP(g){g=(g||'').toUpperCase().trim();if(!GSTIN_RE.test(g))return '<p class="err">Enter a valid 15-character GSTIN/UIN.</p>';if(!validGSTIN(g))return '<p class="err">Invalid GSTIN: check digit mismatch.</p>';
const u=userBy(g);return u?tpDetails(u):'<p>No records found for this GSTIN in the practice database.</p>'}
function searchPAN(p){p=(p||'').toUpperCase().trim();if(!PAN_RE.test(p))return '<p class="err">Enter a valid PAN (e.g. ABCPE1234F).</p>';const us=DB.get('users',[]).filter(u=>u.pan===p);
return us.length?`<table><tr><th>GSTIN/UIN</th><th>GSTIN/UIN Status</th><th>State</th></tr>${us.map(u=>`<tr><td><a href="#" onclick="$('res').innerHTML=searchTP('${u.gstin}');return false">${u.gstin}</a></td><td>${u.status||'Active'}</td><td>${STATES[u.state]}</td></tr>`).join('')}</table>`:'<p>No GSTIN found for this PAN.</p>'}
function searchComp(g){const u=userBy((g||'').toUpperCase().trim());if(!u)return '<p>No records found.</p>';return u.b.comp==='Yes'?`<table><tr><th>GSTIN</th><td>${u.gstin}</td></tr><tr><th>Legal Name</th><td>${esc(u.legal)}</td></tr><tr><th>Status</th><td>Opted In for Composition</td></tr><tr><th>Category</th><td>${u.b.compCat}</td></tr><tr><th>Effective from</th><td>${u.effDate}</td></tr></table>`:'<p>This taxpayer has not opted for composition (Regular taxpayer).</p>'}
/* ---- tools ---- */
function hsnSearch(q){q=(q||'').toLowerCase();return `<table><tr><th>HSN/SAC</th><th>Description</th></tr>${HSN.filter(h=>h[0].startsWith(q)||h[1].toLowerCase().includes(q)).map(h=>`<tr><td>${h[0]}</td><td>${h[1]}</td></tr>`).join('')||'<tr><td colspan=2>No results found</td></tr>'}</table>`}
function calcHTML(){return `<label>Amount (₹)</label><input id="ca" type="number" value="1000"><label>GST Rate</label><select id="cr"><option>0.25</option><option>3</option><option>5</option><option>12</option><option selected>18</option><option>28</option><option>40</option></select>
<label>Amount is</label><select id="cmd"><option value="ex">Exclusive of GST (add GST)</option><option value="in">Inclusive of GST (remove GST)</option></select><br><br><button class="btn s" onclick="calc()">CALCULATE</button><div id="co"></div>`}
function calc(){const a=+$('ca').value,r=+$('cr').value;let b,t;if($('cmd').value==='ex'){b=a;t=a*r/100}else{b=a*100/(100+r);t=a-b}
$('co').innerHTML=`<div class="msg">Taxable value ₹${f(b)} | GST ₹${f(t)}<br>Intra-State: CGST ₹${f(t/2)} + SGST ₹${f(t/2)} · Inter-State: IGST ₹${f(t)}<br>Total ₹${f(b+t)}</div>`}
