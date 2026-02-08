// ===========================
// UK Auction Houses Hub - Sample Auction Results Data
// Simulated recent auction results for demonstration purposes
// ===========================

const AUCTION_RESULTS = [
  { id:1, house:"Allsop", houseId:5, date:"2026-01-29", address:"14 Cranbrook Road, Ilford, IG1", region:"London", guidePrice:180000, salePrice:212000, type:"Residential", status:"Sold", beds:2 },
  { id:2, house:"Allsop", houseId:5, date:"2026-01-29", address:"Flat 3, 88 High Street, Croydon, CR0", region:"London", guidePrice:95000, salePrice:118000, type:"Residential", status:"Sold", beds:1 },
  { id:3, house:"Bond Wolfe", houseId:19, date:"2026-02-05", address:"27 Dudley Road, Birmingham, B18", region:"West Midlands", guidePrice:65000, salePrice:82000, type:"Residential", status:"Sold", beds:3 },
  { id:4, house:"Bond Wolfe", houseId:19, date:"2026-02-05", address:"Unit 4, Stafford Street, Wolverhampton, WV1", region:"West Midlands", guidePrice:45000, salePrice:41000, type:"Commercial", status:"Sold", beds:0 },
  { id:5, house:"Auction House UK", houseId:13, date:"2026-01-28", address:"9 Park Lane, Hull, HU5", region:"Yorkshire", guidePrice:42000, salePrice:56000, type:"Residential", status:"Sold", beds:2 },
  { id:6, house:"Auction House UK", houseId:13, date:"2026-01-28", address:"Flat 12, Victoria Court, Leeds, LS1", region:"Yorkshire", guidePrice:72000, salePrice:74000, type:"Residential", status:"Sold", beds:1 },
  { id:7, house:"Savills", houseId:0, date:"2026-01-26", address:"The Old Rectory, Church Lane, Norfolk, NR14", region:"East Anglia", guidePrice:325000, salePrice:380000, type:"Residential", status:"Sold", beds:5 },
  { id:8, house:"Savills", houseId:0, date:"2026-01-26", address:"Plot 7, Agricultural Land, Oxfordshire, OX5", region:"South East", guidePrice:150000, salePrice:165000, type:"Land", status:"Sold", beds:0 },
  { id:9, house:"Pattinson", houseId:16, date:"2026-01-22", address:"33 Elswick Road, Newcastle, NE4", region:"North East", guidePrice:35000, salePrice:48000, type:"Residential", status:"Sold", beds:2 },
  { id:10, house:"Pattinson", houseId:16, date:"2026-01-22", address:"7 Beech Grove, Sunderland, SR2", region:"North East", guidePrice:28000, salePrice:31000, type:"Residential", status:"Sold", beds:2 },
  { id:11, house:"Clive Emson", houseId:36, date:"2026-02-09", address:"18 Marine Parade, Worthing, BN11", region:"South East", guidePrice:140000, salePrice:155000, type:"Residential", status:"Sold", beds:2 },
  { id:12, house:"Clive Emson", houseId:36, date:"2026-02-09", address:"Garage Block, Rear of 44 High Street, Canterbury, CT1", region:"South East", guidePrice:20000, salePrice:34000, type:"Commercial", status:"Sold", beds:0 },
  { id:13, house:"Barnard Marcus", houseId:8, date:"2026-01-20", address:"55 Acre Lane, Brixton, SW2", region:"London", guidePrice:220000, salePrice:268000, type:"Residential", status:"Sold", beds:2 },
  { id:14, house:"Barnard Marcus", houseId:8, date:"2026-01-20", address:"12 Clapham Manor Street, SW4", region:"London", guidePrice:350000, salePrice:410000, type:"Residential", status:"Sold", beds:3 },
  { id:15, house:"Edward Mellor", houseId:46, date:"2026-01-21", address:"4 Railway Terrace, Stockport, SK3", region:"North West", guidePrice:55000, salePrice:67000, type:"Residential", status:"Sold", beds:2 },
  { id:16, house:"Edward Mellor", houseId:46, date:"2026-01-21", address:"Flat 2, 19 Deansgate, Bolton, BL1", region:"North West", guidePrice:38000, salePrice:35000, type:"Residential", status:"Sold", beds:1 },
  { id:17, house:"Network Auctions", houseId:10, date:"2026-01-27", address:"29 Westbourne Park Road, W2", region:"London", guidePrice:480000, salePrice:545000, type:"Residential", status:"Sold", beds:3 },
  { id:18, house:"John Pye", houseId:34, date:"2026-01-30", address:"Unit 12, Industrial Estate, Nottingham, NG7", region:"East Midlands", guidePrice:85000, salePrice:78000, type:"Commercial", status:"Sold", beds:0 },
  { id:19, house:"SDL Property Auctions", houseId:11, date:"2026-01-29", address:"16 Meadow Lane, Derby, DE1", region:"East Midlands", guidePrice:92000, salePrice:108000, type:"Residential", status:"Sold", beds:3 },
  { id:20, house:"SDL Property Auctions", houseId:11, date:"2026-01-29", address:"Plot at Willow Street, Leicester, LE1", region:"East Midlands", guidePrice:60000, salePrice:72000, type:"Land", status:"Sold", beds:0 },
  { id:21, house:"Countrywide Property Auctions", houseId:39, date:"2026-02-03", address:"8 Victoria Street, Bristol, BS1", region:"South West", guidePrice:175000, salePrice:198000, type:"Residential", status:"Sold", beds:3 },
  { id:22, house:"Countrywide Property Auctions", houseId:39, date:"2026-02-03", address:"Barn at Mendip Lane, Somerset, BA5", region:"South West", guidePrice:110000, salePrice:142000, type:"Residential", status:"Sold", beds:0 },
  { id:23, house:"McHugh & Co", houseId:90, date:"2026-02-10", address:"Flat 1, 22 Holloway Road, N7", region:"London", guidePrice:195000, salePrice:225000, type:"Residential", status:"Sold", beds:1 },
  { id:24, house:"iamsold", houseId:29, date:"2026-01-28", address:"52 Durham Road, Gateshead, NE8", region:"North East", guidePrice:40000, salePrice:52000, type:"Residential", status:"Sold", beds:2 },
  { id:25, house:"Mark Jenkinson & Son", houseId:87, date:"2026-01-27", address:"3 Abbeydale Road, Sheffield, S7", region:"Yorkshire", guidePrice:68000, salePrice:83000, type:"Residential", status:"Sold", beds:3 },
  { id:26, house:"Landwood Property Auctions", houseId:79, date:"2026-01-28", address:"Shop Unit, 14 Market Street, Wigan, WN1", region:"North West", guidePrice:22000, salePrice:19000, type:"Commercial", status:"Sold", beds:0 },
  { id:27, house:"Future Property Auctions", houseId:53, date:"2026-01-22", address:"6 Forth Street, Edinburgh, EH1", region:"Scotland", guidePrice:88000, salePrice:102000, type:"Residential", status:"Sold", beds:2 },
  { id:28, house:"Auction House UK", houseId:13, date:"2026-02-03", address:"11 Piccadilly, Manchester, M1", region:"North West", guidePrice:115000, salePrice:128000, type:"Residential", status:"Sold", beds:2 },
  { id:29, house:"BidX1", houseId:17, date:"2026-01-29", address:"19 Kensington Church Street, W8", region:"London", guidePrice:550000, salePrice:620000, type:"Residential", status:"Sold", beds:2 },
  { id:30, house:"Auction House UK", houseId:13, date:"2026-02-04", address:"44 Roundhay Road, Leeds, LS8", region:"Yorkshire", guidePrice:58000, salePrice:71000, type:"Residential", status:"Sold", beds:3 }
];
