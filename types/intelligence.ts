// ─── Priority Index (Tab 1) ──────────────────────────────────────────────────
export interface PriorityItem {
  rank: number
  topic: string
  subtitle: string
  status: 'breaking' | 'escalating' | 'structural' | 'watch' | 'emerging' | 'de-escalating' | 'peak-risk' | 'underdeveloped' | '20yr-signal'
  noise: number // 1-5
  signal: number // 1-5
  trend: 'up' | 'down' | 'flat'
  summary: string
  learn_more_url?: string
}

// ─── War Room (Tab 2) ───────────────────────────────────────────────────────
export interface WarRoomStats {
  active_conflicts: number
  active_conflicts_label: string
  key_deadline: string
  key_deadline_label: string
  commodity_price: string
  commodity_label: string
  doomsday_metric: string
  doomsday_label: string
}

export interface Conflict {
  name: string
  description: string
  escalation_pct: number // 0-100
  is_live: boolean
}

export interface EscalationHeat {
  region: string
  heat_pct: number // 0-100
}

export interface WarHeadline {
  text: string
  source: string
  time_ago: string
  url?: string
}

export interface WarRoomData {
  stats: WarRoomStats
  conflicts: Conflict[]
  escalation_heat: EscalationHeat[]
  headlines: WarHeadline[]
  analysis: string
  action_links: { label: string; url?: string }[]
}

// ─── Markets (Tab 3) ────────────────────────────────────────────────────────
export interface CommodityPrice {
  name: string
  price: string
  change: string
  change_color: 'green' | 'red' | 'neutral'
}

export interface MarketCall {
  ticker_or_label: string
  reason: string
}

export interface SafeHavenItem {
  asset: string
  allocation_pct: number
}

export interface MarketsData {
  commodities: CommodityPrice[]
  strong_buy: MarketCall[]
  watch: MarketCall[]
  avoid: MarketCall[]
  petrodollar_erosion: { title: string; text: string }
  safe_haven: SafeHavenItem[]
  description: string
  action_links: { label: string; url?: string }[]
}

// ─── Tech + AI (Tab 4) ──────────────────────────────────────────────────────
export interface TechStat {
  label: string
  value: string
  subtitle: string
}

export interface TechSection {
  title: string
  badge?: string
  badge_color?: string
  content: string
  subsections?: { flag?: string; label: string; text: string }[]
  action_links?: { label: string; url?: string }[]
}

export interface TechAIData {
  stats: TechStat[]
  sections: TechSection[]
  description: string
}

// ─── Food + Climate (Tab 5) ─────────────────────────────────────────────────
export interface ClimateStat {
  label: string
  value: string
  subtitle: string
  color: string
}

export interface CascadeEvent {
  title: string
  description: string
  is_active: boolean
}

export interface TippingPoint {
  name: string
  progress_pct: number // 0-100
  color: string
}

export interface FoodClimateData {
  stats: ClimateStat[]
  climate_cascade: { title: string; badge: string; events: CascadeEvent[] }
  tipping_points: { title: string; badge: string; points: TippingPoint[] }
  description: string
}

// ─── Threat Index (Tab 6) ───────────────────────────────────────────────────
export interface ThreatDimension {
  name: string
  score: number // 0-100
  color: string
}

export interface ScenarioWatch {
  scenario: string
  probability: string
  description: string
}

export interface ContrarianInsight {
  title: string
  badge: string
  text: string
  tags: string[]
}

export interface ThreatIndexData {
  title: string
  subtitle: string
  dimensions: ThreatDimension[]
  scenario_watch: ScenarioWatch[]
  contrarian: ContrarianInsight
}

// ─── Signals (Tab 7) ────────────────────────────────────────────────────────
export interface SignalItem {
  rank: number
  signal: string
  description: string
  timeline: string
  category?: string
  learn_more_url?: string
}

export interface SignalsData {
  title: string
  subtitle: string
  items: SignalItem[]
  action_links: { label: string; url?: string }[]
}

// ─── Full Brief ─────────────────────────────────────────────────────────────
export interface IntelligenceBrief {
  id: string
  created_at: string
  priority_index: PriorityItem[]
  war_room: WarRoomData
  markets: MarketsData
  tech_ai: TechAIData
  food_climate: FoodClimateData
  threat_index: ThreatIndexData
  signals: SignalsData
  source_count: number
  status: 'generating' | 'complete' | 'failed'
}

export type TabId = 'priority' | 'warroom' | 'markets' | 'techai' | 'foodclimate' | 'threat' | 'signals'

export interface TabConfig {
  id: TabId
  label: string
  shortLabel: string
}

export const TABS: TabConfig[] = [
  { id: 'priority', label: 'Priority index', shortLabel: 'Priority' },
  { id: 'warroom', label: 'War room', shortLabel: 'War room' },
  { id: 'markets', label: 'Markets', shortLabel: 'Markets' },
  { id: 'techai', label: 'Tech + AI', shortLabel: 'Tech + AI' },
  { id: 'foodclimate', label: 'Food + climate', shortLabel: 'Food' },
  { id: 'threat', label: 'Threat index', shortLabel: 'Threats' },
  { id: 'signals', label: 'Signals', shortLabel: 'Signals' },
]
