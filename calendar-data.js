// ===========================
// UK Auction Houses Hub - Calendar Data 2026
// Compiled from publicly available auction house websites. Dates should be verified before bidding.
// Last updated: February 2026
// ===========================

const AUCTION_EVENTS = [

  // ========== JANUARY 2026 ==========
  { date:"2026-01-15", houseId:53, house:"Future Property Auctions", type:"Online", time:"12:00", region:"Scotland", notes:"Timed online auction - Scotland" },
  { date:"2026-01-21", houseId:46, house:"Edward Mellor Auctions", type:"Online", time:"10:00", region:"North West", notes:"2-day online auction (21-22 Jan)" },
  { date:"2026-01-22", houseId:53, house:"Future Property Auctions", type:"Online", time:"12:00", region:"Scotland", notes:"Timed online auction - Scotland" },
  { date:"2026-01-26", houseId:0, house:"Savills", type:"Online", time:"09:00", region:"National", notes:"3-day online auction (26-28 Jan)" },
  { date:"2026-01-27", houseId:87, house:"Mark Jenkinson & Son", type:"Online", time:"10:00", region:"Yorkshire", notes:"2-day online auction (27-28 Jan)" },
  { date:"2026-01-27", houseId:13, house:"Auction House UK", type:"Online", time:"12:00", region:"National", notes:"National online auction" },
  { date:"2026-01-28", houseId:13, house:"Auction House UK", type:"Room", time:"13:00", region:"Yorkshire", notes:"Hull & East Yorkshire" },
  { date:"2026-01-28", houseId:13, house:"Auction House UK", type:"Room", time:"14:00", region:"London", notes:"London auction" },
  { date:"2026-01-28", houseId:13, house:"Auction House UK", type:"Room", time:"14:30", region:"South East", notes:"Sussex & Hampshire" },
  { date:"2026-01-28", houseId:5, house:"Allsop", type:"Online", time:"09:30", region:"National", notes:"Residential auction day 1 (28-29 Jan)" },
  { date:"2026-01-28", houseId:79, house:"Landwood Property Auctions", type:"Online", time:"11:00", region:"North West", notes:"Weekly online auction" },
  { date:"2026-01-29", houseId:5, house:"Allsop", type:"Online", time:"09:30", region:"National", notes:"Residential auction day 2" },
  { date:"2026-01-29", houseId:17, house:"BidX1", type:"Online", time:"10:00", region:"National", notes:"Online property auction" },
  { date:"2026-01-29", houseId:13, house:"Auction House UK", type:"Room", time:"14:00", region:"Scotland", notes:"Scotland auction" },

  // ========== FEBRUARY 2026 ==========
  { date:"2026-02-03", houseId:39, house:"Countrywide Property Auctions", type:"Room", time:"09:30", region:"London", notes:"Grand Connaught Rooms, Covent Garden" },
  { date:"2026-02-03", houseId:13, house:"Auction House UK", type:"Room", time:"12:00", region:"North West", notes:"Manchester" },
  { date:"2026-02-03", houseId:13, house:"Auction House UK", type:"Room", time:"12:30", region:"East Midlands", notes:"Chesterfield & North Derbyshire" },
  { date:"2026-02-04", houseId:13, house:"Auction House UK", type:"Room", time:"12:00", region:"Yorkshire", notes:"West Yorkshire" },
  { date:"2026-02-04", houseId:13, house:"Auction House UK", type:"Room", time:"11:00", region:"North East", notes:"North East" },
  { date:"2026-02-04", houseId:79, house:"Landwood Property Auctions", type:"Online", time:"11:00", region:"North West", notes:"Weekly online auction" },
  { date:"2026-02-05", houseId:19, house:"Bond Wolfe", type:"Online", time:"08:30", region:"West Midlands", notes:"Live-streamed auction" },
  { date:"2026-02-05", houseId:13, house:"Auction House UK", type:"Room", time:"18:30", region:"West Midlands", notes:"Coventry & Warwickshire" },
  { date:"2026-02-09", houseId:36, house:"Clive Emson", type:"Online", time:"10:00", region:"South East", notes:"Bidding live (ends 11 Feb from 11:00)" },
  { date:"2026-02-10", houseId:13, house:"Auction House UK", type:"Room", time:"12:00", region:"Yorkshire", notes:"North Yorkshire & Tees Valley" },
  { date:"2026-02-10", houseId:0, house:"Savills", type:"Online", time:"09:00", region:"National", notes:"Online auction" },
  { date:"2026-02-10", houseId:90, house:"McHugh & Co", type:"Online", time:"07:30", region:"London", notes:"2-day online auction (10-11 Feb)" },
  { date:"2026-02-11", houseId:13, house:"Auction House UK", type:"Room", time:"10:00", region:"East Anglia", notes:"East Anglia" },
  { date:"2026-02-11", houseId:13, house:"Auction House UK", type:"Room", time:"11:00", region:"South West", notes:"South West" },
  { date:"2026-02-11", houseId:13, house:"Auction House UK", type:"Room", time:"09:30", region:"London", notes:"London" },
  { date:"2026-02-11", houseId:13, house:"Auction House UK", type:"Room", time:"12:00", region:"Wales", notes:"Wales" },
  { date:"2026-02-11", houseId:13, house:"Auction House UK", type:"Room", time:"12:00", region:"North West", notes:"North West" },
  { date:"2026-02-11", houseId:5, house:"Allsop", type:"Online", time:"11:00", region:"National", notes:"Commercial auction" },
  { date:"2026-02-11", houseId:78, house:"Lambert Smith Hampton", type:"Online", time:"12:00", region:"National", notes:"Online auction (runs to 25 Feb)" },
  { date:"2026-02-11", houseId:67, house:"Hollis & Morgan", type:"Online", time:"12:00", region:"South West", notes:"Live-streamed auction - Bristol" },
  { date:"2026-02-11", houseId:79, house:"Landwood Property Auctions", type:"Online", time:"11:00", region:"North West", notes:"Weekly online auction" },
  { date:"2026-02-12", houseId:76, house:"Knight Frank", type:"Hybrid", time:"11:30", region:"National", notes:"Live-streamed national auction" },
  { date:"2026-02-19", houseId:16, house:"Barnett Ross", type:"Room", time:"12:00", region:"London", notes:"London property auction" },
  { date:"2026-02-24", houseId:0, house:"Savills", type:"Online", time:"09:00", region:"National", notes:"Online auction" },
  { date:"2026-02-25", houseId:87, house:"Mark Jenkinson & Son", type:"Online", time:"10:00", region:"Yorkshire", notes:"Online auction" },
  { date:"2026-02-25", houseId:5, house:"Allsop", type:"Online", time:"09:30", region:"National", notes:"Residential auction day 1 (25-26 Feb)" },
  { date:"2026-02-25", houseId:78, house:"Lambert Smith Hampton", type:"Online", time:"13:00", region:"National", notes:"Auction close" },
  { date:"2026-02-26", houseId:5, house:"Allsop", type:"Online", time:"09:30", region:"National", notes:"Residential auction day 2" },
  { date:"2026-02-26", houseId:12, house:"Auction Estates", type:"Room", time:"14:30", region:"East Midlands", notes:"Nottingham Racecourse" },

  // ========== MARCH 2026 ==========
  { date:"2026-03-05", houseId:61, house:"Harman Healy", type:"Room", time:"10:30", region:"London", notes:"London & Surrey auction" },
  { date:"2026-03-05", houseId:73, house:"John Pye Auctions", type:"Online", time:"11:00", region:"National", notes:"Online property auction" },
  { date:"2026-03-10", houseId:39, house:"Countrywide Property Auctions", type:"Room", time:"09:30", region:"London", notes:"Grand Connaught Rooms, Covent Garden" },
  { date:"2026-03-11", houseId:67, house:"Hollis & Morgan", type:"Online", time:"12:00", region:"South West", notes:"Live-streamed auction - Bristol" },
  { date:"2026-03-17", houseId:0, house:"Savills", type:"Online", time:"09:00", region:"National", notes:"Online auction" },
  { date:"2026-03-19", houseId:76, house:"Knight Frank", type:"Hybrid", time:"11:30", region:"National", notes:"Live-streamed national auction" },
  { date:"2026-03-19", houseId:16, house:"Barnett Ross", type:"Room", time:"12:00", region:"London", notes:"London property auction" },
  { date:"2026-03-24", houseId:5, house:"Allsop", type:"Online", time:"11:00", region:"National", notes:"Commercial auction" },
  { date:"2026-03-24", houseId:36, house:"Clive Emson", type:"Online", time:"10:00", region:"South East", notes:"Bidding live (ends 26 Mar from 11:00)" },
  { date:"2026-03-25", houseId:87, house:"Mark Jenkinson & Son", type:"Online", time:"10:00", region:"Yorkshire", notes:"Online auction" },
  { date:"2026-03-25", houseId:5, house:"Allsop", type:"Online", time:"09:30", region:"National", notes:"Residential auction day 1 (25-26 Mar)" },
  { date:"2026-03-25", houseId:90, house:"McHugh & Co", type:"Online", time:"09:00", region:"London", notes:"Online auction" },
  { date:"2026-03-26", houseId:5, house:"Allsop", type:"Online", time:"09:30", region:"National", notes:"Residential auction day 2" },
  { date:"2026-03-26", houseId:19, house:"Bond Wolfe", type:"Online", time:"08:30", region:"West Midlands", notes:"Live-streamed auction" },
  { date:"2026-03-31", houseId:0, house:"Savills", type:"Online", time:"09:00", region:"National", notes:"Online auction" },

  // ========== APRIL 2026 ==========
  { date:"2026-04-14", houseId:39, house:"Countrywide Property Auctions", type:"Room", time:"09:30", region:"London", notes:"Grand Connaught Rooms, Covent Garden" },
  { date:"2026-04-16", houseId:16, house:"Barnett Ross", type:"Room", time:"12:00", region:"London", notes:"London property auction" },
  { date:"2026-04-21", houseId:0, house:"Savills", type:"Online", time:"09:00", region:"National", notes:"Online auction" },
  { date:"2026-04-22", houseId:67, house:"Hollis & Morgan", type:"Online", time:"12:00", region:"South West", notes:"Live-streamed auction - Bristol" },
  { date:"2026-04-23", houseId:61, house:"Harman Healy", type:"Room", time:"10:30", region:"London", notes:"London & Surrey auction" },
  { date:"2026-04-29", houseId:5, house:"Allsop", type:"Online", time:"09:30", region:"National", notes:"Residential auction day 1 (29-30 Apr)" },
  { date:"2026-04-30", houseId:5, house:"Allsop", type:"Online", time:"09:30", region:"National", notes:"Residential auction day 2" },

  // ========== MAY 2026 ==========
  { date:"2026-05-05", houseId:36, house:"Clive Emson", type:"Online", time:"10:00", region:"South East", notes:"Bidding live (ends 7 May from 11:00)" },
  { date:"2026-05-06", houseId:0, house:"Savills", type:"Online", time:"09:00", region:"National", notes:"Online auction" },
  { date:"2026-05-07", houseId:76, house:"Knight Frank", type:"Hybrid", time:"11:30", region:"National", notes:"Live-streamed national auction" },
  { date:"2026-05-07", houseId:5, house:"Allsop", type:"Online", time:"11:00", region:"National", notes:"Commercial auction" },
  { date:"2026-05-13", houseId:90, house:"McHugh & Co", type:"Online", time:"09:00", region:"London", notes:"Online auction" },
  { date:"2026-05-14", houseId:19, house:"Bond Wolfe", type:"Online", time:"08:30", region:"West Midlands", notes:"Live-streamed auction" },
  { date:"2026-05-19", houseId:39, house:"Countrywide Property Auctions", type:"Room", time:"09:30", region:"London", notes:"Grand Connaught Rooms, Covent Garden" },
  { date:"2026-05-20", houseId:0, house:"Savills", type:"Online", time:"09:00", region:"National", notes:"Online auction" },
  { date:"2026-05-27", houseId:5, house:"Allsop", type:"Online", time:"09:30", region:"National", notes:"Residential auction day 1 (27-28 May)" },
  { date:"2026-05-28", houseId:5, house:"Allsop", type:"Online", time:"09:30", region:"National", notes:"Residential auction day 2" },

  // ========== JUNE 2026 ==========
  { date:"2026-06-04", houseId:16, house:"Barnett Ross", type:"Room", time:"12:00", region:"London", notes:"London property auction" },
  { date:"2026-06-09", houseId:0, house:"Savills", type:"Online", time:"09:00", region:"National", notes:"Online auction" },
  { date:"2026-06-10", houseId:5, house:"Allsop", type:"Online", time:"11:00", region:"National", notes:"Commercial auction" },
  { date:"2026-06-11", houseId:61, house:"Harman Healy", type:"Room", time:"10:30", region:"London", notes:"London & Surrey auction" },
  { date:"2026-06-15", houseId:36, house:"Clive Emson", type:"Online", time:"10:00", region:"South East", notes:"Bidding live (ends 17 Jun from 11:00)" },
  { date:"2026-06-18", houseId:76, house:"Knight Frank", type:"Hybrid", time:"11:30", region:"National", notes:"Live-streamed national auction" },
  { date:"2026-06-23", houseId:0, house:"Savills", type:"Online", time:"09:00", region:"National", notes:"Online auction" },
  { date:"2026-06-24", houseId:5, house:"Allsop", type:"Online", time:"09:30", region:"National", notes:"Residential auction day 1 (24-25 Jun)" },
  { date:"2026-06-25", houseId:5, house:"Allsop", type:"Online", time:"09:30", region:"National", notes:"Residential auction day 2" },
  { date:"2026-06-30", houseId:90, house:"McHugh & Co", type:"Online", time:"09:00", region:"London", notes:"Online auction" },

  // ========== JULY 2026 ==========
  { date:"2026-07-09", houseId:19, house:"Bond Wolfe", type:"Online", time:"08:30", region:"West Midlands", notes:"Live-streamed auction" },
  { date:"2026-07-15", houseId:5, house:"Allsop", type:"Online", time:"11:00", region:"National", notes:"Commercial auction" },
  { date:"2026-07-16", houseId:16, house:"Barnett Ross", type:"Room", time:"12:00", region:"London", notes:"London property auction" },
  { date:"2026-07-21", houseId:36, house:"Clive Emson", type:"Online", time:"10:00", region:"South East", notes:"Bidding live (ends 23 Jul from 11:00)" },
  { date:"2026-07-23", houseId:76, house:"Knight Frank", type:"Hybrid", time:"11:30", region:"National", notes:"Live-streamed national auction" },
  { date:"2026-07-23", houseId:61, house:"Harman Healy", type:"Room", time:"10:30", region:"London", notes:"London & Surrey auction" },
  { date:"2026-07-29", houseId:5, house:"Allsop", type:"Online", time:"09:30", region:"National", notes:"Residential auction day 1 (29-30 Jul)" },
  { date:"2026-07-30", houseId:5, house:"Allsop", type:"Online", time:"09:30", region:"National", notes:"Residential auction day 2" },

  // ========== AUGUST 2026 ==========
  { date:"2026-08-20", houseId:5, house:"Allsop", type:"Online", time:"09:30", region:"National", notes:"Residential auction (single day)" },

  // ========== SEPTEMBER 2026 ==========
  { date:"2026-09-10", houseId:19, house:"Bond Wolfe", type:"Online", time:"08:30", region:"West Midlands", notes:"Live-streamed auction" },
  { date:"2026-09-10", houseId:16, house:"Barnett Ross", type:"Room", time:"12:00", region:"London", notes:"London property auction" },
  { date:"2026-09-16", houseId:5, house:"Allsop", type:"Online", time:"09:30", region:"National", notes:"Residential auction day 1 (16-17 Sep)" },
  { date:"2026-09-16", houseId:90, house:"McHugh & Co", type:"Online", time:"09:00", region:"London", notes:"Online auction" },
  { date:"2026-09-17", houseId:5, house:"Allsop", type:"Online", time:"09:30", region:"National", notes:"Residential auction day 2" },
  { date:"2026-09-17", houseId:76, house:"Knight Frank", type:"Hybrid", time:"11:30", region:"National", notes:"Live-streamed national auction" },
  { date:"2026-09-17", houseId:61, house:"Harman Healy", type:"Room", time:"10:30", region:"London", notes:"London & Surrey auction" },
  { date:"2026-09-22", houseId:36, house:"Clive Emson", type:"Online", time:"10:00", region:"South East", notes:"Bidding live (ends 24 Sep from 11:00)" },

  // ========== OCTOBER 2026 ==========
  { date:"2026-10-01", houseId:5, house:"Allsop", type:"Online", time:"11:00", region:"National", notes:"Commercial auction" },
  { date:"2026-10-15", houseId:61, house:"Harman Healy", type:"Room", time:"10:30", region:"London", notes:"London & Surrey auction" },
  { date:"2026-10-21", houseId:5, house:"Allsop", type:"Online", time:"09:30", region:"National", notes:"Residential auction day 1 (21-22 Oct)" },
  { date:"2026-10-21", houseId:90, house:"McHugh & Co", type:"Online", time:"09:00", region:"London", notes:"Online auction" },
  { date:"2026-10-22", houseId:5, house:"Allsop", type:"Online", time:"09:30", region:"National", notes:"Residential auction day 2" },
  { date:"2026-10-22", houseId:76, house:"Knight Frank", type:"Hybrid", time:"11:30", region:"National", notes:"Live-streamed national auction" },
  { date:"2026-10-22", houseId:19, house:"Bond Wolfe", type:"Online", time:"08:30", region:"West Midlands", notes:"Live-streamed auction" },
  { date:"2026-10-29", houseId:16, house:"Barnett Ross", type:"Room", time:"12:00", region:"London", notes:"London property auction" },

  // ========== NOVEMBER 2026 ==========
  { date:"2026-11-03", houseId:36, house:"Clive Emson", type:"Online", time:"10:00", region:"South East", notes:"Bidding live (ends 5 Nov from 11:00)" },
  { date:"2026-11-05", houseId:5, house:"Allsop", type:"Online", time:"11:00", region:"National", notes:"Commercial auction" },
  { date:"2026-11-12", houseId:61, house:"Harman Healy", type:"Room", time:"10:30", region:"London", notes:"London & Surrey auction" },
  { date:"2026-11-18", houseId:5, house:"Allsop", type:"Online", time:"09:30", region:"National", notes:"Residential auction day 1 (18-19 Nov)" },
  { date:"2026-11-19", houseId:5, house:"Allsop", type:"Online", time:"09:30", region:"National", notes:"Residential auction day 2" },

  // ========== DECEMBER 2026 ==========
  { date:"2026-12-02", houseId:90, house:"McHugh & Co", type:"Online", time:"09:00", region:"London", notes:"Online auction" },
  { date:"2026-12-09", houseId:19, house:"Bond Wolfe", type:"Online", time:"08:30", region:"West Midlands", notes:"Live-streamed auction" },
  { date:"2026-12-09", houseId:5, house:"Allsop", type:"Online", time:"11:00", region:"National", notes:"Commercial auction" },
  { date:"2026-12-10", houseId:61, house:"Harman Healy", type:"Room", time:"10:30", region:"London", notes:"London & Surrey auction" },
  { date:"2026-12-13", houseId:36, house:"Clive Emson", type:"Online", time:"10:00", region:"South East", notes:"Bidding live (ends 15 Dec from 11:00)" },
  { date:"2026-12-16", houseId:5, house:"Allsop", type:"Online", time:"09:30", region:"National", notes:"Residential auction day 1 (16-17 Dec)" },
  { date:"2026-12-16", houseId:16, house:"Barnett Ross", type:"Room", time:"12:00", region:"London", notes:"London property auction" },
  { date:"2026-12-17", houseId:5, house:"Allsop", type:"Online", time:"09:30", region:"National", notes:"Residential auction day 2" }
];

// Auction houses with continuous/rolling online auctions (not fixed calendar dates)
const ONGOING_ONLINE_AUCTIONEERS = [
  { houseId:71, house:"iam-sold", notes:"Continuous online auctions nationwide - new lots added daily", url:"https://www.iamsold.co.uk/" },
  { houseId:79, house:"Landwood Property Auctions", notes:"Weekly online auctions - lots close every Wednesday", url:"https://www.landwoodproperty.co.uk/" },
  { houseId:53, house:"Future Property Auctions", notes:"Weekly timed online auctions - Scotland-wide", url:"https://www.futurepropertyauctions.co.uk/" },
  { houseId:2, house:"Agents Property Auction", notes:"Ongoing modern method of auction via agent network", url:"https://www.agentspropertyauction.com/" },
  { houseId:70, house:"Hunters", notes:"Ongoing modern method of auction via franchise network", url:"https://www.hunters.co.uk/" },
  { houseId:99, house:"Open Door Property", notes:"Ongoing modern method of auction online", url:"https://www.opendoorpropertyltd.co.uk/" },
  { houseId:98, house:"Online Property Auctions Scotland", notes:"Ongoing online auctions across Scotland", url:"https://www.opas.co.uk/" },
  { houseId:17, house:"BidX1", notes:"Monthly online auctions - UK & international", url:"https://bidx1.com/" },
  { houseId:13, house:"Auction House UK", notes:"200+ auctions per year across all UK regions - check regional pages for full dates", url:"https://www.auctionhouse.co.uk/auction/future-auction-dates" }
];
