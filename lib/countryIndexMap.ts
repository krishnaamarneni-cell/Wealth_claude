// Maps ISO 3166-1 alpha-3 country codes → index info
export interface CountryIndex {
  ticker: string
  name: string       // Exchange index name
  exchange: string   // Exchange name
  currency: string
}

export const COUNTRY_INDEX_MAP: Record<string, CountryIndex> = {
  // ── Americas ──────────────────────────────────────────────
  USA: { ticker: "^GSPC", name: "S&P 500", exchange: "NYSE", currency: "USD" },
  CAN: { ticker: "^GSPTSE", name: "S&P/TSX Composite", exchange: "TSX", currency: "CAD" },
  MEX: { ticker: "^MXX", name: "IPC", exchange: "BMV", currency: "MXN" },
  BRA: { ticker: "^BVSP", name: "Bovespa", exchange: "B3", currency: "BRL" },
  ARG: { ticker: "^MERV", name: "MERVAL", exchange: "BYMA", currency: "ARS" },
  CHL: { ticker: "^IPSA", name: "IPSA", exchange: "Santiago", currency: "CLP" },
  COL: { ticker: "^COLCAP", name: "COLCAP", exchange: "BVC", currency: "COP" },
  PER: { ticker: "^SPBLPGPT", name: "S&P/BVL Peru", exchange: "BVL", currency: "PEN" },

  // ── Europe ───────────────────────────────────────────────
  GBR: { ticker: "^FTSE", name: "FTSE 100", exchange: "LSE", currency: "GBP" },
  DEU: { ticker: "^GDAXI", name: "DAX 40", exchange: "Frankfurt", currency: "EUR" },
  FRA: { ticker: "^FCHI", name: "CAC 40", exchange: "Euronext", currency: "EUR" },
  ITA: { ticker: "FTSEMIB.MI", name: "FTSE MIB", exchange: "Borsa Italiana", currency: "EUR" },
  ESP: { ticker: "^IBEX", name: "IBEX 35", exchange: "BME", currency: "EUR" },
  NLD: { ticker: "^AEX", name: "AEX", exchange: "Euronext", currency: "EUR" },
  CHE: { ticker: "^SSMI", name: "SMI", exchange: "SIX", currency: "CHF" },
  SWE: { ticker: "^OMX", name: "OMX Stockholm 30", exchange: "Nasdaq Nordic", currency: "SEK" },
  NOR: { ticker: "^OBX", name: "OBX", exchange: "Oslo Bors", currency: "NOK" },
  DNK: { ticker: "^OMXC25", name: "OMX Copenhagen 25", exchange: "Nasdaq Nordic", currency: "DKK" },
  FIN: { ticker: "^OMXH25", name: "OMX Helsinki 25", exchange: "Nasdaq Nordic", currency: "EUR" },
  BEL: { ticker: "^BFX", name: "BEL 20", exchange: "Euronext", currency: "EUR" },
  AUT: { ticker: "^ATX", name: "ATX", exchange: "Wiener Borse", currency: "EUR" },
  PRT: { ticker: "^PSI20", name: "PSI-20", exchange: "Euronext", currency: "EUR" },
  GRC: { ticker: "^ATG", name: "Athens Composite", exchange: "ATHEX", currency: "EUR" },
  POL: { ticker: "^WIG20", name: "WIG20", exchange: "GPW", currency: "PLN" },
  CZE: { ticker: "^PX", name: "PX Index", exchange: "Prague SE", currency: "CZK" },
  HUN: { ticker: "^BUX", name: "BUX", exchange: "BSE", currency: "HUF" },
  ROU: { ticker: "^BETI", name: "BET Index", exchange: "Bucharest SE", currency: "RON" },
  TUR: { ticker: "^XU100", name: "BIST 100", exchange: "Borsa Istanbul", currency: "TRY" },
  RUS: { ticker: "IMOEX.ME", name: "MOEX Russia", exchange: "MOEX", currency: "RUB" },
  HRV: { ticker: "^CROBEX", name: "CROBEX", exchange: "Zagreb SE", currency: "EUR" },
  BGR: { ticker: "SOFIX.SO", name: "SOFIX", exchange: "Sofia SE", currency: "BGN" },
  EST: { ticker: "^OMXT", name: "OMX Tallinn", exchange: "Nasdaq Baltic", currency: "EUR" },
  LVA: { ticker: "^OMXR", name: "OMX Riga", exchange: "Nasdaq Baltic", currency: "EUR" },
  LTU: { ticker: "^OMXV", name: "OMX Vilnius", exchange: "Nasdaq Baltic", currency: "EUR" },
  SRB: { ticker: "^BELEX15", name: "BELEX15", exchange: "Belgrade SE", currency: "RSD" },
  SVN: { ticker: "^SBITOP", name: "SBITOP", exchange: "Ljubljana SE", currency: "EUR" },

  // ── Asia-Pacific ─────────────────────────────────────────
  JPN: { ticker: "^N225", name: "Nikkei 225", exchange: "TSE", currency: "JPY" },
  CHN: { ticker: "000001.SS", name: "SSE Composite", exchange: "Shanghai SE", currency: "CNY" },
  HKG: { ticker: "^HSI", name: "Hang Seng", exchange: "HKEX", currency: "HKD" },
  IND: { ticker: "^NSEI", name: "Nifty 50", exchange: "NSE", currency: "INR" },
  KOR: { ticker: "^KS11", name: "KOSPI", exchange: "KRX", currency: "KRW" },
  AUS: { ticker: "^AXJO", name: "ASX 200", exchange: "ASX", currency: "AUD" },
  NZL: { ticker: "^NZ50", name: "NZX 50", exchange: "NZX", currency: "NZD" },
  TWN: { ticker: "^TWII", name: "TAIEX", exchange: "TWSE", currency: "TWD" },
  SGP: { ticker: "^STI", name: "Straits Times", exchange: "SGX", currency: "SGD" },
  MYS: { ticker: "^KLSE", name: "KLCI", exchange: "Bursa", currency: "MYR" },
  THA: { ticker: "^SET.BK", name: "SET Index", exchange: "SET", currency: "THB" },
  IDN: { ticker: "^JKSE", name: "IDX Composite", exchange: "IDX", currency: "IDR" },
  PHL: { ticker: "PSEI.PS", name: "PSEi", exchange: "PSE", currency: "PHP" },
  VNM: { ticker: "^VNINDEX", name: "VN-Index", exchange: "HOSE", currency: "VND" },
  PAK: { ticker: "^KSE100", name: "KSE 100", exchange: "PSX", currency: "PKR" },
  BGD: { ticker: "^DSEX", name: "DSEX", exchange: "DSE", currency: "BDT" },
  LKA: { ticker: "^CSEALL", name: "All Share", exchange: "CSE", currency: "LKR" },
  KAZ: { ticker: "^KASE", name: "KASE Index", exchange: "KASE", currency: "KZT" },

  // ── Middle East & Africa ─────────────────────────────────
  SAU: { ticker: "^TASI.SR", name: "Tadawul All Share", exchange: "Tadawul", currency: "SAR" },
  ARE: { ticker: "^DFMGI", name: "DFM General", exchange: "DFM", currency: "AED" },
  ISR: { ticker: "^TA125.TA", name: "TA-125", exchange: "TASE", currency: "ILS" },
  ZAF: { ticker: "^J203.JO", name: "JSE All Share", exchange: "JSE", currency: "ZAR" },
  EGY: { ticker: "^CASE30", name: "EGX 30", exchange: "EGX", currency: "EGP" },
  NGA: { ticker: "^NGSEINDEX", name: "NGX All Share", exchange: "NGX", currency: "NGN" },
  KEN: { ticker: "^NSE20", name: "NSE 20", exchange: "NSE Kenya", currency: "KES" },
  QAT: { ticker: "^QSI", name: "QE Index", exchange: "QSE", currency: "QAR" },
  KWT: { ticker: "^KWSE", name: "Boursa Kuwait", exchange: "BK", currency: "KWD" },
  MAR: { ticker: "^MASI.CS", name: "MASI", exchange: "Casablanca", currency: "MAD" },
  OMN: { ticker: "^MSM30", name: "MSM 30", exchange: "MSM", currency: "OMR" },
  BHR: { ticker: "^BHSEASI", name: "Bahrain All Share", exchange: "BSE Bahrain", currency: "BHD" },
  JOR: { ticker: "^AMGNRLX", name: "ASE General", exchange: "ASE", currency: "JOD" },
  MUS: { ticker: "^SEMDEX", name: "SEMDEX", exchange: "SEM", currency: "MUR" },
  GHA: { ticker: "^GGSECI", name: "GSE Composite", exchange: "GSE", currency: "GHS" },
  TUN: { ticker: "TUNINDEX.TN", name: "TUNINDEX", exchange: "BVMT", currency: "TND" },
}

// Countries with no major exchange — shown in neutral gray
export const NO_EXCHANGE_COUNTRIES = new Set([
  "AFG", "ALB", "AND", "ATG", "BHS", "BLZ", "BEN", "BTN", "BOL",
  "BIH", "BWA", "BRN", "BFA", "BDI", "CPV", "KHM", "CMR", "CAF", "TCD",
  "COM", "COG", "COD", "CIV", "CUB", "DJI", "DMA", "DOM", "ECU", "SLV",
  "GNQ", "ERI", "SWZ", "ETH", "FJI", "GAB", "GMB", "GEO", "GRD",
  "GTM", "GIN", "GNB", "GUY", "HTI", "HND", "IRQ", "JAM", "LAO",
  "LBN", "LSO", "LBR", "LBY", "LIE", "MDG", "MWI", "MDV", "MLI", "MLT",
  "MHL", "MRT", "FSM", "MDA", "MCO", "MNG", "MNE", "MOZ", "MMR",
  "NAM", "NPL", "NIC", "NER", "PLW", "PAN", "PNG", "PRY", "PRK",
  "MKD", "STP", "SEN", "SLE", "SLB", "SOM", "SSD", "SDN", "SUR",
  "SYR", "TJK", "TLS", "TGO", "TON", "TTO", "TKM", "TUV", "UGA", "URY",
  "UZB", "VUT", "VEN", "YEM", "ZMB", "ZWE", "IRN", "LUX", "SVK",
  "ISL", "CYP", "ARM", "AZE", "BLR", "KGZ", "UKR",
])