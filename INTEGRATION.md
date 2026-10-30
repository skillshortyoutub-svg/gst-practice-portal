# Tally Prime lab ↔ GST Practice Portal bridge

**This is for practice only.** `bridge.html` + `bridge.js` simulate an IRP and an e-way bill system. They don't connect to NIC or to any government system. Nothing it creates is a valid IRN or e-way bill.

Live page: https://skillshortyoutub-svg.github.io/gst-practice-portal/bridge.html

## Opening the bridge
The lab opens the bridge with `window.open`. Don't pass `noopener`, because the bridge needs `window.opener` to reply.

| Action | URL hash | Payload |
|---|---|---|
| Generate e-invoice (IRN), with an optional e-way bill | `bridge.html#<b64url>` | NIC e-invoice schema v1.1 JSON (`EwbDtls` optional) |
| Generate e-way bill | `bridge.html#ewb:<b64url>` | NIC EWB "GENEWAYBILL" JSON |
| Cancel | `bridge.html#cancel:<b64url>` | `{"irn":"…"}` or `{"ewbNo":"…"}` plus `CnlRsn` (1 Duplicate, 2 Data entry mistake, 3 Order cancelled, 4 Others) and `CnlRem` (max 100 characters) |

`<b64url>` means base64url (RFC 4648 §5, no padding) of the UTF-8 JSON text:
```js
const b64u = s => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const w = window.open('https://skillshortyoutub-svg.github.io/gst-practice-portal/bridge.html#' + b64u(JSON.stringify(inv)), 'gppBridge');
window.addEventListener('message', e => {
  if (e.origin !== 'https://skillshortyoutub-svg.github.io') return;
  if (e.data.type === 'gpp-einv-result') console.log(e.data);
});
```

## Reply (postMessage)
`window.opener.postMessage(msg, targetOrigin)` is sent to each allowed origin, and the browser delivers it only to the one that matches:
- `https://skillshort.com`
- `http://localhost:8767`
- any `http://localhost:<port>` / `http://127.0.0.1:<port>`, taken from `document.referrer` (for testing)

The bridge also always shows a summary page carrying the practice banner, and it stores the reply in `window._bridgeResult`.

```text
common:  { type, status: "1" | "0", errors: [ { ErrorCode: "2150", ErrorMessage: "Duplicate IRN" } ] }
gpp-einv-result (success):  Irn, AckNo, AckDt ("yyyy-mm-dd hh:mm:ss" IST), SignedQRCode (JWT-like, PRACTICE),
                  QrCodeImage ("data:image/png;base64,…" with a PRACTICE mark), Status "ACT",
                  EwbNo, EwbDt, EwbValidTill (null when there is no EwbDtls or no vehicle / Part-B),
                  SellerGstin, DocNo, DocTyp, FY
gpp-einv-result (duplicate): status "0", errors [2150], InfoDtls [ { InfCd: "DUPIRN", Desc: { AckNo, AckDt, Irn } } ]
gpp-ewb-result:   ewayBillNo (12 digits), ewayBillDate, validUpto ("dd/mm/yyyy hh:mm:ss AM/PM" IST, null when there is no Part-B),
                  validUptoISO, alert, fromGstin, docNo
gpp-cancel-result: kind "einv" | "ewb", Irn + CancelDate, or ewayBillNo + cancelDate
```

## Rules simulated
- **IRN:** SHA-256 hex of `SellerGstin + FY + DocTyp + DocNo` (DocNo in upper case, FY written as `2026-27`). Generating the same IRN again, even after it has been cancelled, gives error 2150.
- **AckNo:** 15 digits.
- **E-way bill number:** 12 digits.
- **ValidUpto:** 1 day per 200 km (20 km for over-dimensional cargo, `VehType`/`vehicleType` = "O"). Each day ends at 23:59:59 IST, the cut-off being midnight of the following day. Without a vehicle or transport document (Part-B) the bill is Part-A only and `validUpto` is null.
- **Cancellation:** allowed only within 24 h of generation. An IRN with an active e-way bill can't be cancelled until that e-way bill is cancelled.
- **Where results are saved:** in the portal's own stores under the seller GSTIN: `localStorage["gpp_<GSTIN>_einv"]`, `["gpp_<GSTIN>_ewb"]`, and a B2B invoice row in `["gpp_<GSTIN>_docs"]` (auto-populated into GSTR-1 unless that month's GSTR-1 is filed). If the seller is a demo persona that hasn't been seeded yet, it is seeded first.
- **Deep links** (after logging in as the seller): `dashboard.html#einv/<irn>` and `dashboard.html#ewb/<ewbNo>`.
- **Same origin required:** the portal and the bridge must be on the same origin (both on github.io), because localStorage is per origin. If a student isn't logged in, the dashboard sends them to login first; after login they can open the link again.

## Error codes (practice set modelled on the NIC style)
| Code | Meaning |
|---|---|
| 5002 | Missing required field, bad JSON or base64, wrong `Version`, bad date format, bad enum |
| 3028 | Invalid GSTIN (format or checksum); also invalid `TransId` / `transporterId` |
| 3029 | GSTIN is Suspended or Cancelled in the practice register |
| 3037 | `Stcd` / state code doesn't match the GSTIN |
| 3039 | PIN is not 6 digits |
| 2211 | Seller and buyer GSTIN are the same |
| 2283 | Invalid document number (max 16 characters; letters, digits, `/` and `-`; can't start with 0, `/` or `-`) |
| 2163 | Document date is in the future |
| 2175 | EWB document date is older than 180 days |
| 2189 | Item `AssAmt`, `TotAmt` (Qty × UnitPrice) or `TotItemVal` doesn't add up |
| 2194 | Item tax ≠ AssAmt × GstRt |
| 2190 | Invalid GST rate |
| 2240 | IGST on an intra-State supply |
| 2241 | CGST/SGST on an inter-State supply (POS ≠ seller state, or SEZ/export) |
| 2173 | `ValDtls` AssVal/IgstVal/CgstVal/SgstVal ≠ sum of the items |
| 2172 | `TotInvVal` ≠ ΣTotItemVal + OthChrg − Discount + RndOffAmt (tolerance ₹1) |
| 2150 | Duplicate IRN |
| 2148 | IRN not found (cancel) |
| 2230 | IRN has an active e-way bill (cancel) |
| 2270 | 24-hour cancellation window crossed |
| 2271 | Invalid `CnlRsn` |
| 9999 | Already cancelled |
| 604 | Active e-way bill already exists for this document |
| 702 | Distance must be 0–4000 km (and ≤ 100 km for the same PIN) |
| 721 | Invalid vehicle number |
| 722 | Invalid transport mode |
| 4012 | EWB value or tax totals don't add up |
| 325 | E-way bill number not found |
| 312 | EWB cancel window (24 h) crossed |
| 9998 | Internal bridge error |

## Sample GSTINs (all fictional, valid checksum)
These **demo personas** can log in (password `Demo@1234`), so use them as the **seller** to see results in the dashboard:

| State | GSTIN | Login | Name |
|---|---|---|---|
| 27 Maharashtra | 27AQWPD4401K1ZN | demo_monthly | Arjun Demo Traders |
| 24 Gujarat | 24AARFD5502L1ZA | demo_qrmp | Kavya Demo Garments |
| 09 Uttar Pradesh | 09BZXPD6603M1ZP | demo_comp | Ramesh Demo Kirana (composition: avoid as e-invoice seller) |
| 29 Karnataka | 29AAJCD7704N1Z2 | demo_large | Zenith Demo Electronics Pvt Ltd |
| 19 West Bengal | 19AAKFD8805P1ZO | demo_wb | Bengal Demo Tea Traders |

These **sample taxpayers** work as buyers (or as sellers without a dashboard login):

| State | GSTIN | Name |
|---|---|---|
| 19 West Bengal | 19AACFB7781C1ZG | Banerjee Textiles |
| 19 West Bengal | 19AAEFC9911T1ZM | Chatterjee Media LLP |
| 19 West Bengal | 19CDTPB4450K1Z5 | Bose Mobile Point |
| 07 Delhi | 07AACFG1937P1Z3 | Gupta & Sons Partners |
| 08 Rajasthan | 08AAJFK2290B1ZJ | Kapoor Logistics LLP |
| 10 Bihar | 10AACFG1937P1ZG | Gupta & Sons Partners |
| 23 Madhya Pradesh | 23AABCJ4410R1ZJ | Joshi Pharma Pvt Ltd |
| 24 Gujarat | 24AAHCP3307S1Z1 | Patel Agro Foods Pvt Ltd |
| 27 Maharashtra | 27AAKPS4821L1Z7 | Sharma Traders |
| 29 Karnataka | 29AAICM5520K1Z6 | Mehta Infotech Pvt Ltd |
| 33 Tamil Nadu | 33AADCR8145Q1ZU | Rao Steel Industries Ltd |
| 10 Bihar (Suspended → 3029) | 10ADLPS1188F1ZM | Singh Hardware |
| 09 UP (Cancelled → 3029) | 09AAQPK6620D1ZN | Khan Furniture Works |

For transporter IDs, use a sample GSTIN such as 08AAJFK2290B1ZJ.

## Sample e-invoice payload (WB seller → Maharashtra buyer, inter-State, with an e-way bill)
Replace `Dt` with today's date (dd/mm/yyyy). Future dates are rejected.
```json
{"Version":"1.1",
 "TranDtls":{"TaxSch":"GST","SupTyp":"B2B","RegRev":"N"},
 "DocDtls":{"Typ":"INV","No":"KOL/26/001","Dt":"30/10/2026"},
 "SellerDtls":{"Gstin":"19AAKFD8805P1ZO","LglNm":"Bengal Demo Tea Traders","Addr1":"12 BBD Bagh","Loc":"Kolkata","Pin":700001,"Stcd":"19"},
 "BuyerDtls":{"Gstin":"27AQWPD4401K1ZN","LglNm":"Arjun Demo Traders","Pos":"27","Addr1":"5 FC Road","Loc":"Pune","Pin":411001,"Stcd":"27"},
 "ItemList":[{"SlNo":"1","PrdDesc":"Assam Tea","IsServc":"N","HsnCd":"0902","Qty":100,"Unit":"KGS","UnitPrice":500,
   "TotAmt":50000,"AssAmt":50000,"GstRt":5,"IgstAmt":2500,"CgstAmt":0,"SgstAmt":0,"TotItemVal":52500}],
 "ValDtls":{"AssVal":50000,"IgstVal":2500,"CgstVal":0,"SgstVal":0,"TotInvVal":52500},
 "EwbDtls":{"TransId":"08AAJFK2290B1ZJ","TransName":"Kapoor Logistics","TransMode":"1","Distance":1950,"VehNo":"WB02AB1234","VehType":"R"}}
```
Intra-State example (19 → 19): set the buyer to `19AACFB7781C1ZG` with `Pos`/`Stcd` "19", and split the tax into `CgstAmt` 1250 and `SgstAmt` 1250.

## Sample e-way bill payload
```json
{"supplyType":"O","subSupplyType":"1","docType":"INV","docNo":"KOL/EW/01","docDate":"30/10/2026",
 "fromGstin":"19AAKFD8805P1ZO","fromPincode":700001,"fromStateCode":19,
 "toGstin":"10AACFG1937P1ZG","toPincode":800001,"toStateCode":10,
 "transDistance":"600","transMode":"1","vehicleNo":"WB02AB1234","vehicleType":"R","transporterId":"08AAJFK2290B1ZJ",
 "itemList":[{"productName":"Tea","hsnCode":"0902","quantity":200,"taxableAmount":100000,"igstRate":5}],
 "totalValue":100000,"igstValue":5000,"totInvValue":105000}
```
600 km gives 3 days, valid until 23:59:59 IST on the third day after generation.

## Sample cancel payloads
`{"irn":"<64-hex>","CnlRsn":"2","CnlRem":"Wrong quantity"}` and `{"ewbNo":"1xxxxxxxxxxx","CnlRsn":"3"}`
