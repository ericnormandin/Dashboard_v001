// TERMINAL CLIENT STATE MACHINE
const API_BASE_URL = 'http://127.0.0.1:8000';

// Global state trackers
let currentPrices = {
    'BTC': 67500.00,
    'ETH': 3450.00,
    'SOL': 165.50,
    'ADA': 0.48,
    'USD': 1.00
};

let activeTab = 'overview';
let isLiveKraken = false;
let isLiveSheets = false;
let tradingViewAsset = 'BTC';
const tradingViewAssets = ['BTC', 'ETH', 'SOL', 'ADA'];
let securityScanRun = false;

// ================= MOCKUP DATASETS (ACCORDING TO DESIGN SPECIFICATIONS) =================

// Category breakdowns for budget.sys
const mockBudgetCategories = [
    // --- VARIABLE ---
    { name: 'Cashflow',      bal: 1790.73, spent: 1915.27, budget: 3786, icon: 'fa-wallet',               colorClass: 'bg-terminal-bronze', type: 'variable' },
    { name: 'Crypto',        bal: 0.00,    spent: 0.00,    budget: 500,  icon: 'fa-brands fa-bitcoin',     colorClass: 'bg-terminal-bronze', type: 'variable' },
    { name: 'Eco Em',        bal: 84.50,   spent: 215.50,  budget: 300,  icon: 'fa-leaf',                  colorClass: 'bg-terminal-bronze', type: 'variable' },
    { name: 'Eco Eric',      bal: 112.30,  spent: 187.70,  budget: 300,  icon: 'fa-seedling',              colorClass: 'bg-terminal-bronze', type: 'variable' },
    { name: 'Food',          bal: 211.05,  spent: 915.95,  budget: 1127, icon: 'fa-utensils',              colorClass: 'bg-terminal-bronze', type: 'variable' },
    { name: 'Media',         bal: 0.00,    spent: 185.07,  budget: 150,  icon: 'fa-tv',                    colorClass: 'bg-terminal-red',    type: 'variable' },
    { name: 'Reno',          bal: 220.00,  spent: 380.00,  budget: 600,  icon: 'fa-hammer',                colorClass: 'bg-terminal-bronze', type: 'variable' },
    { name: 'Resto',         bal: 139.84,  spent: 169.16,  budget: 309,  icon: 'fa-champagne-glasses',     colorClass: 'bg-terminal-bronze', type: 'variable' },
    { name: 'Stella',        bal: 0.00,    spent: 288.36,  budget: 186,  icon: 'fa-child',                 colorClass: 'bg-terminal-red',    type: 'variable' },
    { name: 'Transport',     bal: 153.72,  spent: 237.28,  budget: 391,  icon: 'fa-car',                   colorClass: 'bg-terminal-bronze', type: 'variable' },
    // --- FIXED ---
    { name: 'Cash Em',       bal: 0.00,    spent: 500.00,  budget: 500,  icon: 'fa-piggy-bank',            colorClass: 'bg-terminal-bronze', type: 'fixed' },
    { name: 'Condo Fees',    bal: 0.00,    spent: 415.00,  budget: 415,  icon: 'fa-building',              colorClass: 'bg-terminal-bronze', type: 'fixed' },
    { name: 'Garderie',      bal: 0.00,    spent: 210.00,  budget: 210,  icon: 'fa-baby',                  colorClass: 'bg-terminal-bronze', type: 'fixed' },
    { name: 'House Keeping', bal: 0.00,    spent: 195.00,  budget: 195,  icon: 'fa-broom',                 colorClass: 'bg-terminal-bronze', type: 'fixed' },
    { name: 'Hydro',         bal: 0.00,    spent: 148.00,  budget: 148,  icon: 'fa-bolt',                  colorClass: 'bg-terminal-bronze', type: 'fixed' },
    { name: 'Hypotheque',    bal: 0.00,    spent: 2074.00, budget: 2074, icon: 'fa-house',                 colorClass: 'bg-terminal-bronze', type: 'fixed' },
    { name: 'Insurance',     bal: 0.00,    spent: 220.00,  budget: 220,  icon: 'fa-shield-halved',         colorClass: 'bg-terminal-bronze', type: 'fixed' },
    { name: 'REER Eric',     bal: 0.00,    spent: 500.00,  budget: 500,  icon: 'fa-piggy-bank',            colorClass: 'bg-terminal-bronze', type: 'fixed' },
    { name: 'REER-OIIQ',     bal: 0.00,    spent: 312.00,  budget: 312,  icon: 'fa-sack-dollar',           colorClass: 'bg-terminal-bronze', type: 'fixed' },
    { name: 'Reno',          bal: 0.00,    spent: 500.00,  budget: 500,  icon: 'fa-screwdriver-wrench',    colorClass: 'bg-terminal-bronze', type: 'fixed' },
    { name: 'STM',           bal: 0.00,    spent: 105.00,  budget: 105,  icon: 'fa-bus',                   colorClass: 'bg-terminal-bronze', type: 'fixed' },
    { name: 'Taxe M',        bal: 0.00,    spent: 285.00,  budget: 285,  icon: 'fa-landmark',              colorClass: 'bg-terminal-bronze', type: 'fixed' },
    { name: 'Taxe S',        bal: 0.00,    spent: 198.00,  budget: 198,  icon: 'fa-landmark',              colorClass: 'bg-terminal-bronze', type: 'fixed' },
    { name: 'Videotron',     bal: 0.00,    spent: 98.00,   budget: 98,   icon: 'fa-wifi',                  colorClass: 'bg-terminal-bronze', type: 'fixed' },
];

// 12 Transactions log
const mockTransactions = [
    { date: '2026 May 27', type: 'MAY - CASHFLOW', label: 'BANK TRANSFER', amount: 225.71, isPositive: true },
    { date: '2026 May 27', type: 'MAY - CASHFLOW', label: 'WITHDRAW ATM', amount: 138.03, isPositive: false },
    { date: '2026 May 24', type: 'MAY - CASHFLOW', label: 'INTERAC E-TRANSFER', amount: 127.86, isPositive: true },
    { date: '2026 May 24', type: 'MAY - CASHFLOW', label: 'BANK TRANSFER', amount: 105.28, isPositive: true },
    { date: '2026 May 20', type: 'MAY - CASHFLOW', label: 'WITHDRAW ATM', amount: 194.75, isPositive: false },
    { date: '2026 May 19', type: 'MAY - CASHFLOW', label: 'INTERAC E-TRANSFER', amount: 248.75, isPositive: true },
    { date: '2026 May 19', type: 'MAY - CASHFLOW', label: 'PAYPAL TRANSFER', amount: 140.98, isPositive: true },
    { date: '2026 May 18', type: 'MAY - CASHFLOW', label: 'WITHDRAW ATM', amount: 92.40, isPositive: false },
    { date: '2026 May 14', type: 'MAY - CASHFLOW', label: 'INTERAC E-TRANSFER', amount: 115.73, isPositive: true },
    { date: '2026 May 11', type: 'MAY - CASHFLOW', label: 'PAYPAL TRANSFER', amount: 195.00, isPositive: true },
    { date: '2026 May 07', type: 'MAY - CASHFLOW', label: 'WITHDRAW ATM', amount: 144.66, isPositive: false },
    { date: '2026 May 01', type: 'MAY - CASHFLOW', label: 'INTERAC E-TRANSFER', amount: 186.12, isPositive: true }
];

// Top categories
const mockTopCategories = [
    { name: 'Cashflow', amount: 15440, max: 18000 },
    { name: 'Hypotheque', amount: 7114, max: 18000 },
    { name: 'Crypto', amount: 5000, max: 18000 },
    { name: 'Food', amount: 4696, max: 18000 }
];

// Year Table Variable values
const mockYearTableData = [
    { account: 'Cashflow', jan: 2788, feb: 2079, mar: 2278, apr: 6379, may: 1915, jun: null, jul: null, aug: null, sep: null, oct: null, nov: null, dec: null, ytd: 15439.83 },
    { account: 'Crypto', jan: 5000, feb: null, mar: null, apr: null, may: null, jun: null, jul: null, aug: null, sep: null, oct: null, nov: null, dec: null, ytd: 5000.00 },
    { account: 'Food', jan: 1281, feb: 775, mar: 911, apr: 814, may: 916, jun: null, jul: null, aug: null, sep: null, oct: null, nov: null, dec: null, ytd: 4696.29 },
    { account: 'Media', jan: 39, feb: 69, mar: 53, apr: 85, may: 185, jun: null, jul: null, aug: null, sep: null, oct: null, nov: null, dec: null, ytd: 431.48 },
    { account: 'Resto', jan: 582, feb: 165, mar: 174, apr: 196, may: 169, jun: null, jul: null, aug: null, sep: null, oct: null, nov: null, dec: null, ytd: 1285.72 },
    { account: 'Stella', jan: 169, feb: 76, mar: 142, apr: 101, may: 288, jun: null, jul: null, aug: null, sep: null, oct: null, nov: null, dec: null, ytd: 776.24 },
    { account: 'Transport', jan: 555, feb: 188, mar: 432, apr: 215, may: 237, jun: null, jul: null, aug: null, sep: null, oct: null, nov: null, dec: null, ytd: 1627.68 }
];

// Investment indexes data
const mockIndices = [
    { name: 'S&P 500 Index', last: 5280.40, change: 0.45, icon: 'fa-chart-area', tag: 'SPX' },
    { name: 'NASDAQ Composite', last: 16830.25, change: 0.82, icon: 'fa-microchip', tag: 'IXIC' },
    { name: 'DOW JONES Industrial', last: 39120.50, change: -0.15, icon: 'fa-industry', tag: 'DJI' },
    { name: 'Gold Bullion spot', last: 2348.50, change: -0.12, icon: 'fa-cubes', tag: 'GC=F' },
    { name: 'S&P/TSX Composite', last: 22260.10, change: 0.18, icon: 'fa-leaf', tag: 'GSPTSE' }
];

// Registered Accounts TFSA & RRSP
const mockInvestmentAccounts = [
    {
        name: 'TAX-FREE SAVINGS ACCOUNT (TFSA)',
        bal: 34800.00,
        return: 12.4,
        holdings: [
            { asset: 'VFV (Vanguard S&P 500)', amt: '180 shares', val: 21450.00 },
            { asset: 'XEQT (iShares All-Equity)', amt: '310 shares', val: 9850.00 },
            { asset: 'CAD Cash Liquidity', amt: 'Liquid Balance', val: 3500.00 }
        ]
    },
    {
        name: 'REGISTERED RETIREMENT SAVINGS (RRSP)',
        bal: 12450.75,
        return: 8.9,
        holdings: [
            { asset: 'VUN (Vanguard US Total)', amt: '65 shares', val: 7850.75 },
            { asset: 'TEC (Global Tech ETF)', amt: '115 shares', val: 4600.00 }
        ]
    }
];

// Health and Fitness metrics log
const mockHealthMetrics = [
    { name: 'Daily Target Steps count', val: '8,450 / 10,000 steps', pct: 84.5, icon: 'fa-shoe-prints' },
    { name: 'Fluid Water Intake limit', val: '2.1L / 3.0 Liters', pct: 70.0, icon: 'fa-glass-water' },
    { name: 'Active Burned Calories', val: '480 / 600 kcal', pct: 80.0, icon: 'fa-fire-flame-curved' },
    { name: 'Sleep Quality efficiency', val: '7h 15m / 8h 00m (88%)', pct: 88.0, icon: 'fa-bed' }
];

const mockHealthGrid = [
    { title: 'NUTRITION LOG', tag: 'CALORIES_IN', val: '1,850 kcal', detail: 'Target: 2,200 max' },
    { title: 'HEART SENSOR', tag: 'RESTING_BPM', val: '62 bpm', detail: 'Daily Low: 58 bpm' }
];

// Mail messages
const mockMailMessages = [
    { sender: 'team@company.com', subject: 'Q2 Performance Review', tag: 'HIGH_PRIORITY', tagColor: 'border-terminal-red text-terminal-red bg-terminal-red/10', time: '10:23' },
    { sender: 'notifications@github.com', subject: 'PR #234 merged successfully', tag: '', tagColor: '', time: '09:45' }
];

// Calendar events
const mockCalendarEvents = [
    { title: 'Team Standup', time: '09:00 - 09:30', participants: 8, isLive: false },
    { title: 'Design Review', time: '11:00 - 12:00', participants: 4, isLive: true }
];

// AI insights
const mockAiInsights = [
    { category: 'BUDGET', text: 'Your spending is 15% below average this month. Great job!', statusClass: 'border-terminal-green/30 text-terminal-green bg-terminal-green/5', iconClass: 'fa-circle-check text-terminal-green' },
    { category: 'HEALTH', text: 'Hydration levels are below target. Drink more water today.', statusClass: 'border-terminal-gold/30 text-terminal-gold bg-terminal-gold/5', iconClass: 'fa-triangle-exclamation text-terminal-gold' },
    { category: 'CRYPTO', text: 'Optimal time to rebalance portfolio based on market trends.', statusClass: 'border-terminal-muted/30 text-terminal-muted bg-terminal-muted/5', iconClass: 'fa-circle-info text-terminal-muted' },
    { category: 'PRODUCTIVITY', text: 'Meeting efficiency improved by 23% this week.', statusClass: 'border-terminal-green/30 text-terminal-green bg-terminal-green/5', iconClass: 'fa-circle-check text-terminal-green' }
];

// AI predictions
const mockAiPredictions = [
    { title: 'Budget Forecast', confidence: 94, status: 'On track', colorClass: 'bg-terminal-gold' },
    { title: 'Health Goals', confidence: 87, status: 'Achievable', colorClass: 'bg-terminal-gold' },
    { title: 'Portfolio Growth', confidence: 76, status: '+12% est.', colorClass: 'bg-terminal-gold' }
];

// News headlines — general / markets (used in overview + news view col 1)
const mockNewsHeadlines = [
    { category: 'TECH',    tag: 'TRENDING', headline: 'AI breakthrough in quantum computing announced', source: 'TechCrunch', time: '2h ago' },
    { category: 'CRYPTO',  tag: 'TRENDING', headline: 'Bitcoin surges past $65K amid institutional adoption', source: 'CoinDesk', time: '4h ago' },
    { category: 'FINANCE', tag: '',         headline: 'Markets rally on positive economic indicators', source: 'Reuters', time: '6h ago' },
    { category: 'MACRO',   tag: '',         headline: 'Fed holds rates steady, signals two cuts in 2026', source: 'WSJ', time: '8h ago' },
    { category: 'MARKETS', tag: '',         headline: 'S&P 500 reaches new all-time high above 5,400', source: 'CNBC', time: '10h ago' },
    { category: 'FINANCE', tag: '',         headline: 'Canadian dollar strengthens on oil price recovery', source: 'Globe & Mail', time: '12h ago' },
];

// Crypto-specific news (news view col 2)
const mockCryptoNews = [
    { category: 'CRYPTO', tag: 'BREAKING', headline: 'Bitcoin ETF sees record $2.1B inflow in single day', source: 'Bloomberg', time: '1h ago' },
    { category: 'CRYPTO', tag: 'TRENDING', headline: 'Ethereum L2 transactions surpass mainnet for first time', source: 'CoinDesk', time: '3h ago' },
    { category: 'CRYPTO', tag: '',         headline: 'Solana DeFi TVL hits all-time high amid ecosystem growth', source: 'DeFiLlama', time: '5h ago' },
    { category: 'CRYPTO', tag: '',         headline: 'SEC approves spot Ethereum ETF options trading', source: 'Reuters', time: '8h ago' },
    { category: 'CRYPTO', tag: '',         headline: 'Kraken expands to 10 new markets in Southeast Asia', source: 'CoinTelegraph', time: '12h ago' },
    { category: 'DEFI',   tag: '',         headline: 'Total DeFi locked value surpasses $200B milestone', source: 'DeFiPulse', time: '14h ago' },
];

const mockCryptoInsights = [
    { category: 'PORTFOLIO',  text: 'BTC allocation has drifted 6% above target — consider rebalancing toward ETH.', cls: 'warn', icon: 'fa-triangle-exclamation' },
    { category: 'MARKET',     text: 'Fear & Greed index shifted from Neutral to Greed over the past 48 hours.', cls: 'info', icon: 'fa-circle-info' },
    { category: 'DCA',        text: 'Next scheduled buy executes in 2 days — projected at current price levels.', cls: 'ok',   icon: 'fa-circle-check' },
    { category: 'VOLATILITY', text: 'BTC 24h volatility up 18% — tighten stop levels on active positions.', cls: 'warn', icon: 'fa-triangle-exclamation' },
];

// Tech & AI news (news view col 3)
const mockTechNews = [
    { category: 'AI',   tag: 'TRENDING', headline: 'Anthropic releases Claude 4 with extended context window', source: 'TechCrunch', time: '2h ago' },
    { category: 'TECH', tag: '',         headline: 'NVIDIA announces next-gen Blackwell architecture roadmap', source: 'The Verge', time: '4h ago' },
    { category: 'AI',   tag: '',         headline: 'Google DeepMind achieves protein folding at atomic resolution', source: 'Nature', time: '6h ago' },
    { category: 'TECH', tag: '',         headline: 'Apple Vision Pro 2 rumoured with 8K displays and lighter chassis', source: 'MacRumors', time: '9h ago' },
    { category: 'TECH', tag: '',         headline: 'Microsoft Copilot integrated across all Office 365 products', source: 'ZDNet', time: '11h ago' },
    { category: 'AI',   tag: '',         headline: 'Meta open-sources latest LLaMA model with 405B parameters', source: 'Wired', time: '15h ago' },
];



// Corporate Crypto Dashboard — mock datasets
const CORP_TOTAL_SHARES = 10000;

const mockPortfolioHistory = [
    { label: 'May 07', value: 287400 },
    { label: 'May 10', value: 295200 },
    { label: 'May 13', value: 302100 },
    { label: 'May 16', value: 289800 },
    { label: 'May 19', value: 315600 },
    { label: 'May 22', value: 328400 },
    { label: 'May 25', value: 321000 },
    { label: 'May 28', value: 336500 },
    { label: 'May 31', value: 344000 },
    { label: 'Jun 04', value: 347200 },
];

const mockBtcOHLC = [
    { d: 'M26', o: 63200, h: 65800, l: 62500, c: 65100 },
    { d: 'M27', o: 65100, h: 67200, l: 64400, c: 66800 },
    { d: 'M28', o: 66800, h: 68900, l: 65700, c: 67500 },
    { d: 'M29', o: 67500, h: 68100, l: 65200, c: 65800 },
    { d: 'M30', o: 65800, h: 67400, l: 64800, c: 67100 },
    { d: 'M31', o: 67100, h: 69200, l: 66500, c: 68900 },
    { d: 'J01', o: 68900, h: 70100, l: 67800, c: 69400 },
    { d: 'J02', o: 69400, h: 71200, l: 68200, c: 70600 },
    { d: 'J03', o: 70600, h: 71800, l: 68900, c: 69200 },
    { d: 'J04', o: 69200, h: 70500, l: 67500, c: 67500 },
];

const mockKrakenTrades = [
    { date: '06/04', type: 'BUY',  asset: 'BTC', qty: '0.050', price: 67200, total: 3360  },
    { date: '06/03', type: 'SELL', asset: 'ETH', qty: '1.200', price: 3480,  total: 4176  },
    { date: '06/02', type: 'BUY',  asset: 'SOL', qty: '25.00', price: 162.5, total: 4063  },
    { date: '06/01', type: 'BUY',  asset: 'ETH', qty: '0.800', price: 3420,  total: 2736  },
    { date: '05/31', type: 'SELL', asset: 'BTC', qty: '0.030', price: 68900, total: 2067  },
];

const mockColdStorage = {
    balances: [
        { asset: 'BTC', amount: 0.85 },
        { asset: 'ETH', amount: 4.20 },
    ],
    log: [
        { date: '05/15', type: 'IN', asset: 'BTC', note: '0.250 BTC' },
        { date: '04/28', type: 'IN', asset: 'ETH', note: '2.000 ETH' },
        { date: '03/10', type: 'IN', asset: 'BTC', note: '0.300 BTC' },
        { date: '02/02', type: 'IN', asset: 'ETH', note: '2.200 ETH' },
    ],
};

const mockInventory = [
    { asset: 'BTC', amount: 1.2758, avgBuy: 52400 },
    { asset: 'ETH', amount: 6.35,   avgBuy: 2750  },
    { asset: 'SOL', amount: 12.50,  avgBuy: 142.5 },
    { asset: 'ADA', amount: 2840,   avgBuy: 0.38  },
];

const mockCapTable = [
    { name: 'Eric',       role: 'FOUNDING PARTNER', shares: 6000 },
    { name: 'Emilie',     role: 'CO-FOUNDER',       shares: 2500 },
    { name: 'Investor_A', role: 'SILENT INVESTOR',  shares: 1500 },
];


// ================= SYSTEM CLOCK OPERATOR =================
function updateClock() {
    const now = new Date();
    const clockEl = document.getElementById('system-clock');
    if (clockEl) {
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        clockEl.textContent = `${hh}:${mm}:${ss}`;
    }
    const dateEl = document.getElementById('system-date');
    if (dateEl) {
        const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
        const day  = days[now.getDay()];
        const yyyy = now.getFullYear();
        const mo   = String(now.getMonth() + 1).padStart(2, '0');
        const dd   = String(now.getDate()).padStart(2, '0');
        dateEl.textContent = `${day} ${yyyy}-${mo}-${dd}`;
    }
}
setInterval(updateClock, 1000);
updateClock();


// ================= NAVIGATION ENGINE =================
const navButtons = document.querySelectorAll('#sidebar-nav button');
const viewPanels = document.querySelectorAll('.view-panel');
const headerTitle = document.getElementById('header-view-title');
const headerSubtitle = document.getElementById('header-view-subtitle');

navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.getAttribute('data-tab');
        switchTab(tabName);
    });
});

function switchTab(tabName) {
    activeTab = tabName;
    // Handled by inline script in HTML — do nothing here to avoid double-running
}

function triggerViewRender(tabName) {
    if (tabName === 'overview') {
        renderOverviewScreen();
        updateBtcPrice();
        updateFearGreed();
    } else if (tabName === 'budget') {
        renderBudgetScreen();
    } else if (tabName === 'stella') {
        renderStellaScreen();
    } else if (tabName === 'crypto') {
        renderCryptoScreen();
    } else if (tabName === 'investments') {
        renderInvestmentsScreen();
    } else if (tabName === 'health') {
        renderHealthScreen();
    } else if (tabName === 'news') {
        renderNewsView();
    } else if (tabName === 'utilities') {
        renderUtilitiesScreen();
    }
}

// ================= VIEW: STELLA =================
function renderStellaScreen() {
    _renderStellaCalendar();
}

function _renderStellaCalendar() {
    const grid = document.getElementById('stella-cal-grid');
    if (!grid) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();

    const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
    let html = days.map(d => `<div class="cal-day-hdr">${d}</div>`).join('');

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();

    // days from previous month
    for (let i = firstDay - 1; i >= 0; i--) {
        html += `<div class="cal-day other-month">${prevDays - i}</div>`;
    }
    // current month days
    // Marked event dates in June 2026
    const eventDays = new Set([18, 24]);
    for (let d = 1; d <= daysInMonth; d++) {
        const isToday = d === today;
        const hasEvent = eventDays.has(d);
        const style = hasEvent && !isToday ? 'background:rgba(168,138,102,0.08);border-color:rgba(168,138,102,0.3);' : '';
        html += `<div class="cal-day${isToday ? ' today' : ''}" style="${style}">${d}</div>`;
    }
    // fill remaining cells to complete last row
    const total = firstDay + daysInMonth;
    const remainder = total % 7 === 0 ? 0 : 7 - (total % 7);
    for (let d = 1; d <= remainder; d++) {
        html += `<div class="cal-day other-month">${d}</div>`;
    }

    grid.innerHTML = html;
}


// ================= CONSOLE STREAM DIAGNOSTIC OUTPUT LOGGER =================
function appendConsoleLog(message, type = 'info') {
    const consoleEl = document.getElementById('diagnostics-console');
    if (!consoleEl) return;
    
    const time = new Date().toLocaleTimeString();
    let prefix = `[INFO]`;
    let colorClass = 'text-slate-300';
    
    if (type === 'warn') {
        prefix = `[WARN]`;
        colorClass = 'text-terminal-gold';
    } else if (type === 'error') {
        prefix = `[ERR]`;
        colorClass = 'text-terminal-red';
    } else if (type === 'success') {
        prefix = `[OK]`;
        colorClass = 'text-terminal-green';
    }
    
    const line = document.createElement('div');
    line.className = colorClass;
    line.textContent = `${time} ${prefix} ${message}`;
    consoleEl.appendChild(line);
    consoleEl.scrollTop = consoleEl.scrollHeight;
}


// ================= API GATEWAY COMMUNICATIONS =================
async function checkAPIStatus() {
    appendConsoleLog('Polling API gateway status target...');
    try {
        const res = await fetch(`${API_BASE_URL}/api/status`);
        if (!res.ok) throw new Error('API target gateway connection rejected');
        const data = await res.json();
        
        isLiveKraken = data.integrations.kraken.configured;
        isLiveSheets = data.integrations.google_sheets.configured;
        
        // Update header badges indicator lights
        updateStatusDot('kraken', data.integrations.kraken.mode);
        updateStatusDot('sheets', data.integrations.google_sheets.mode);
        
        // Update overview status listings
        const statusKrakenEl = document.getElementById('overview-status-kraken');
        const statusSheetsEl = document.getElementById('overview-status-sheets');
        
        if (statusKrakenEl) statusKrakenEl.className = isLiveKraken ? "text-terminal-green font-bold" : "text-terminal-bronze font-bold";
        if (statusKrakenEl) statusKrakenEl.textContent = isLiveKraken ? "CONNECTED LIVE" : "DEMO MOCK";
        
        if (statusSheetsEl) statusSheetsEl.className = isLiveSheets ? "text-terminal-green font-bold" : "text-terminal-bronze font-bold";
        if (statusSheetsEl) statusSheetsEl.textContent = isLiveSheets ? "CONNECTED LIVE" : "DEMO MOCK";

        if (!isLiveKraken || !isLiveSheets) {
            document.getElementById('global-mock-banner').classList.add('visible');
            appendConsoleLog('Simulated mocked pipelines active for incomplete keys', 'warn');
        } else {
            document.getElementById('global-mock-banner').classList.remove('visible');
            appendConsoleLog('All enterprise integrations loaded successfully', 'success');
        }
        
    } catch (err) {
        console.error('Offline diagnostic fallback:', err);
        updateStatusDot('kraken', 'offline');
        updateStatusDot('sheets', 'offline');
        
        document.getElementById('global-mock-banner').classList.add('visible');
        appendConsoleLog('Failed connection to REST backend server. Offline mock simulation activated.', 'error');
    }
}

function updateStatusDot(target, mode) {
    const dot = document.getElementById(`status-dot-${target}`);
    const badge = document.getElementById(`api-status-${target}`);
    if (!dot || !badge) return;

    // Remove all mode classes
    dot.classList.remove('live', 'mock', 'offline');
    badge.style.borderColor = '';
    badge.style.color = '';

    if (mode === 'live') {
        dot.classList.add('live');
        badge.style.borderColor = 'rgba(93,196,122,0.3)';
        badge.style.color = 'var(--green)';
        const label = badge.querySelector('span:last-child');
        if (label) { label.textContent = 'LIVE'; label.style.color = 'var(--green)'; }
    } else if (mode === 'mock') {
        dot.classList.add('mock');
        badge.style.borderColor = 'var(--border)';
        badge.style.color = 'var(--gold)';
        const label = badge.querySelector('span:last-child');
        if (label) { label.textContent = 'MOCK'; label.style.color = 'var(--gold)'; }
    } else {
        dot.classList.add('offline');
        badge.style.borderColor = 'rgba(200,90,90,0.3)';
        badge.style.color = 'var(--red)';
        const label = badge.querySelector('span:last-child');
        if (label) { label.textContent = 'OFFLINE'; label.style.color = 'var(--red)'; }
    }
}


function switchBudgetType(type) {
    ['variable', 'fixed'].forEach(t => {
        const btn = document.getElementById('budget-type-' + t);
        if (btn) btn.classList.toggle('active', t === type);
    });
    const container = document.getElementById('overview-budget-breakdown');
    if (!container) return;
    container.innerHTML = '';
    mockBudgetCategories.filter(c => c.type === type).forEach(cat => {
        const ratioPercent = cat.budget > 0 ? Math.round((cat.spent / cat.budget) * 100) : 0;
        const barWidth = Math.min(ratioPercent, 100);
        const isOver = ratioPercent > 100;
        const iconClass = cat.icon.startsWith('fa-brands') ? cat.icon : 'fa-solid ' + cat.icon;
        const line = document.createElement('div');
        line.className = 'breakdown-item';
        line.innerHTML = `
            <div class="breakdown-row">
                <div class="breakdown-name">
                    <i class="${iconClass}"></i>
                    <span>${cat.name}</span>
                    <span class="breakdown-bal">BAL: $${cat.bal.toFixed(0)}</span>
                </div>
                <div class="breakdown-amounts">$${cat.spent.toFixed(0)} / $${cat.budget.toFixed(0)}</div>
            </div>
            <div class="progress-wrap">
                <div class="progress-track">
                    <div class="progress-fill ${isOver ? 'over' : ''}" style="width:${barWidth}%"></div>
                </div>
                <span class="progress-pct ${isOver ? 'over' : ''}">${ratioPercent}%</span>
            </div>
        `;
        container.appendChild(line);
    });
}

// ================= VIEW: OVERVIEW MODULE =================
function renderOverviewScreen() {
    // 1. Budget category breakdown
    switchBudgetType('variable');

    // 2. Crypto holdings
    const overviewCryptoHoldings = document.getElementById('overview-crypto-holdings');
    if (overviewCryptoHoldings) {
        overviewCryptoHoldings.innerHTML = '';
        const mockHoldings = [
            { asset: 'BTC', name: 'Bitcoin',  amount: '0.245 BTC', val: 15680, change: 8.5,  isPos: true  },
            { asset: 'ETH', name: 'Ethereum', amount: '3.82 ETH',  val: 9240,  change: 5.2,  isPos: true  },
            { asset: 'SOL', name: 'Solana',   amount: '45.6 SOL',  val: 4560,  change: 2.3,  isPos: false },
            { asset: 'ADA', name: 'Cardano',  amount: '2840 ADA',  val: 1420,  change: 1.8,  isPos: true  }
        ];
        mockHoldings.forEach(hold => {
            const div = document.createElement('div');
            div.className = 'holding-row';
            div.innerHTML = `
                <div class="holding-left">
                    <div class="asset-icon ${hold.asset.toLowerCase()}">
                        <i class="${getAssetIcon(hold.asset)}"></i>
                    </div>
                    <div class="holding-info">
                        <div class="coin-name">${hold.asset} <span style="font-size:12px;color:var(--muted);font-weight:400">${hold.name}</span></div>
                        <div class="coin-sub">${hold.amount}</div>
                    </div>
                </div>
                <div class="holding-right">
                    <div class="coin-val">$${hold.val.toLocaleString()}</div>
                    <div class="coin-chg ${hold.isPos ? 'pos' : 'neg'}">${hold.isPos ? '▲ +' : '▼ -'}${Math.abs(hold.change)}%</div>
                </div>
            `;
            overviewCryptoHoldings.appendChild(div);
        });
    }

    // 3. Mail messages
    const overviewMailMessages = document.getElementById('overview-mail-messages');
    if (overviewMailMessages) {
        overviewMailMessages.innerHTML = '';
        mockMailMessages.forEach(msg => {
            const div = document.createElement('div');
            div.className = 'mail-item';
            let tagHtml = msg.tag ? `<span class="mail-tag priority">${msg.tag}</span>` : '';
            div.innerHTML = `
                <div class="mail-item-header">
                    <span class="mail-sender">${msg.sender}</span>
                    <span class="mail-time">${msg.time}</span>
                </div>
                <div class="mail-subject">${msg.subject}</div>
                ${tagHtml}
            `;
            overviewMailMessages.appendChild(div);
        });
    }

    // 4. Calendar grid
    renderCalGrid();

    // 5. Calendar schedule
    const overviewCalendarSchedule = document.getElementById('overview-calendar-schedule');
    if (overviewCalendarSchedule) {
        overviewCalendarSchedule.innerHTML = '';
        mockCalendarEvents.forEach(evt => {
            const div = document.createElement('div');
            div.className = 'schedule-item';
            div.innerHTML = `
                <div>
                    <div class="schedule-title">
                        <i class="fa-solid fa-calendar-day" style="font-size:12px;color:var(--gold)"></i>
                        ${evt.title}
                        ${evt.isLive ? '<span class="live-badge">LIVE</span>' : ''}
                    </div>
                    <div class="schedule-time">${evt.time}</div>
                </div>
                <div class="participants">${evt.participants} participants</div>
            `;
            overviewCalendarSchedule.appendChild(div);
        });
    }

    // 6. AI insights
    const overviewAiInsights = document.getElementById('overview-ai-insights');
    if (overviewAiInsights) {
        overviewAiInsights.innerHTML = '';
        const insightTypeMap = {
            'BUDGET':      { cls: 'ok',   icon: 'fa-circle-check' },
            'HEALTH':      { cls: 'warn', icon: 'fa-triangle-exclamation' },
            'CRYPTO':      { cls: 'info', icon: 'fa-circle-info' },
            'PRODUCTIVITY':{ cls: 'ok',   icon: 'fa-circle-check' }
        };
        mockAiInsights.forEach(ins => {
            const t = insightTypeMap[ins.category] || { cls: 'info', icon: 'fa-circle-info' };
            const div = document.createElement('div');
            div.className = `insight-item ${t.cls}`;
            div.innerHTML = `
                <i class="fa-solid ${t.icon}"></i>
                <div>
                    <div class="insight-cat">${ins.category}</div>
                    <div class="insight-text">${ins.text}</div>
                </div>
            `;
            overviewAiInsights.appendChild(div);
        });
    }

    // 7. AI predictions
    const overviewAiPredictions = document.getElementById('overview-ai-predictions');
    if (overviewAiPredictions) {
        overviewAiPredictions.innerHTML = '';
        mockAiPredictions.forEach(pred => {
            const div = document.createElement('div');
            div.className = 'pred-item';
            div.innerHTML = `
                <div class="pred-row">
                    <span class="pred-name">${pred.title}</span>
                    <span class="pred-status">${pred.status}</span>
                </div>
                <div class="progress-wrap">
                    <div class="progress-track">
                        <div class="progress-fill" style="width:${pred.confidence}%;background:var(--gold)"></div>
                    </div>
                    <span class="progress-pct">${pred.confidence}%</span>
                </div>
            `;
            overviewAiPredictions.appendChild(div);
        });
    }

    // 8. News headlines
    const overviewNewsHeadlines = document.getElementById('overview-news-headlines');
    if (overviewNewsHeadlines) {
        overviewNewsHeadlines.innerHTML = '';
        mockNewsHeadlines.forEach(hl => {
            const div = document.createElement('div');
            div.className = 'news-item';
            div.innerHTML = `
                <div class="news-tags">
                    <span class="news-cat-tag">${hl.category}</span>
                    ${hl.tag ? `<span class="news-trend-tag">&#8599; ${hl.tag}</span>` : ''}
                </div>
                <div class="news-headline">${hl.headline}</div>
                <div class="news-meta"><span>${hl.source}</span><span>${hl.time}</span></div>
            `;
            overviewNewsHeadlines.appendChild(div);
        });
    }

    renderRetirementTimeline();
    _renderRetirementGauge(33, '$500K', '1.5M');
}

function _renderRetirementGauge(pct, currentLabel, goalLabel) {
    const el = document.getElementById('retirement-gauge-svg');
    if (!el) return;

    const cx = 120, cy = 120, r1 = 76, r2 = 108, N = 40, gap = 1.8;
    const step     = 360 / N;
    const litCount = Math.round((pct / 100) * N);

    const pt = (deg, r) => {
        const rad = deg * Math.PI / 180;
        return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
    };

    let paths = '';
    for (let i = 0; i < N; i++) {
        // Segments run clockwise from 6 o'clock (90° in SVG = bottom)
        const a1 = 90 + i * step + gap;
        const a2 = 90 + (i + 1) * step - gap;
        const lit = i < litCount;

        const [x1o, y1o] = pt(a1, r2);
        const [x2o, y2o] = pt(a2, r2);
        const [x2i, y2i] = pt(a2, r1);
        const [x1i, y1i] = pt(a1, r1);

        // Outer arc CW (sweep=1), inner arc CCW back (sweep=0)
        const d = [
            `M${x1o.toFixed(1)} ${y1o.toFixed(1)}`,
            `A${r2} ${r2} 0 0 1 ${x2o.toFixed(1)} ${y2o.toFixed(1)}`,
            `L${x2i.toFixed(1)} ${y2i.toFixed(1)}`,
            `A${r1} ${r1} 0 0 0 ${x1i.toFixed(1)} ${y1i.toFixed(1)}Z`,
        ].join(' ');

        const style = lit
            ? 'fill:var(--gold);filter:drop-shadow(0 0 5px rgba(207,167,120,0.45))'
            : 'fill:var(--border-lt)';
        paths += `<path d="${d}" style="${style}"/>`;
    }

    // Outer and inner outline circles that frame the segment ring
    const outerRing = `<circle cx="${cx}" cy="${cy}" r="${r2 + 5}" fill="none" style="stroke:var(--border);stroke-width:1"/>`;
    const innerRing = `<circle cx="${cx}" cy="${cy}" r="${r1 - 5}" fill="none" style="stroke:var(--border);stroke-width:1"/>`;

    el.innerHTML = `<svg viewBox="0 0 240 240" style="width:100%;height:100%;display:block">
        ${outerRing}${innerRing}${paths}
    </svg>`;

    const pctEl = document.getElementById('ret-gauge-pct');
    const barEl = document.getElementById('ret-gauge-bar-fill');
    const amtEl = document.getElementById('ret-gauge-amounts');
    if (pctEl) pctEl.textContent = `${pct.toFixed(1)}%`;
    if (barEl) barEl.style.width = `${pct}%`;
    if (amtEl) amtEl.textContent = `${currentLabel} / ${goalLabel}`;
}


// ================= RETIREMENT PLAN TIMELINE =================
function renderRetirementTimeline() {
    const el = document.getElementById('retirement-plan-timeline');
    if (!el) return;

    const milestones = [
        { year: 2026, value: '$349K', label: 'Current position',        isNow: true  },
        { year: 2027, value: '$427K', label: 'Max RRSP contribution'                  },
        { year: 2029, value: '$590K', label: 'Crypto allocation shift'                },
        { year: 2032, value: '$750K', label: '50% to goal'                            },
        { year: 2036, value: '$1.1M', label: 'RRSP maturation'                        },
        { year: 2041, value: '$1.5M', label: 'Goal reached',            isGoal: true },
    ];

    el.innerHTML = '<div class="ret-tl-scroll"><div class="ret-tl-track">' +
        milestones.map((m, i) => `
            <div class="ret-tl-col${m.isNow ? ' now' : ''}${m.isGoal ? ' goal' : ''}">
                <div class="ret-tl-content">
                    <div class="ret-tl-year">${m.isNow ? '<span class="ret-tl-now-badge">NOW</span>' : ''}${m.year}</div>
                    <div class="ret-tl-val">${m.value}</div>
                    <div class="ret-tl-label">${m.label}</div>
                </div>
                <div class="ret-tl-spine">
                    <div class="ret-tl-dot${m.isNow ? ' now' : ''}${m.isGoal ? ' goal' : ''}"></div>
                    ${i < milestones.length - 1 ? '<div class="ret-tl-line"></div>' : ''}
                </div>
            </div>
        `).join('') +
    '</div></div>';
}

// ================= VIEW: BUDGET MODULE (MOCK SPECIFICITY RENDERER) =================
function renderBudgetScreen() {
    // 1. Render budget.sys categories breakdown list
    const breakdownContainer = document.getElementById('budget-breakdown-list');
    if (breakdownContainer) {
        breakdownContainer.innerHTML = '';
        mockBudgetCategories.forEach(cat => {
            const ratioPercent = cat.budget > 0 ? Math.round((cat.spent / cat.budget) * 100) : 0;
            const barWidth = Math.min(ratioPercent, 100);
            
            const card = document.createElement('div');
            card.className = 'border border-terminal-border p-3 rounded bg-[#131215] hover:border-terminal-bronze/30 transition duration-300';
            card.innerHTML = `
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <i class="fa-solid ${cat.icon} text-terminal-gold text-[9px] w-3 text-center"></i>
                        <span class="font-bold text-slate-200">${cat.name}</span>
                        <span class="text-[9px] text-terminal-muted">BAL: $${cat.bal.toFixed(2)}</span>
                    </div>
                    <div class="text-terminal-muted text-[9px]">
                        $${cat.spent.toFixed(2)} / $${cat.budget.toFixed(2)}
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <div class="flex-grow bg-terminal-border h-1.5 rounded-full overflow-hidden">
                        <div class="h-full ${cat.colorClass}" style="width: ${barWidth}%"></div>
                    </div>
                    <span class="text-[9px] font-bold ${ratioPercent > 100 ? 'text-terminal-red' : 'text-terminal-gold'} min-w-[28px] text-right">${ratioPercent}%</span>
                </div>
            `;
            breakdownContainer.appendChild(card);
        });
    }

    // 2. Render transactions logs list
    populateTransactionsList(mockTransactions);

    // 3. Render Top Categories
    const topCatContainer = document.getElementById('budget-top-categories');
    if (topCatContainer) {
        topCatContainer.innerHTML = '';
        mockTopCategories.forEach(cat => {
            const width = Math.min(Math.round((cat.amount / cat.max) * 100), 100);
            const line = document.createElement('div');
            line.className = 'space-y-1';
            line.innerHTML = `
                <div class="flex justify-between items-center text-slate-300">
                    <span>${cat.name}</span>
                    <span class="font-bold font-sans text-slate-100">$${cat.amount.toLocaleString()}</span>
                </div>
                <div class="w-full bg-terminal-border h-1 rounded overflow-hidden">
                    <div class="bg-terminal-bronze h-full" style="width: ${width}%"></div>
                </div>
            `;
            topCatContainer.appendChild(line);
        });
    }

    // 4. Render Year Table Variable
    const tableBody = document.getElementById('budget-year-table-body');
    if (tableBody) {
        tableBody.innerHTML = '';
        
        // Add categories rows
        mockYearTableData.forEach(row => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-[#16151a]/40 transition text-slate-300 text-center text-[9px]';
            tr.innerHTML = `
                <td class="p-2 border-r border-terminal-border text-left font-bold text-slate-300 uppercase text-[8px] bg-[#121114]">${row.account}</td>
                <td class="p-1">${formatTableCell(row.jan)}</td>
                <td class="p-1">${formatTableCell(row.feb)}</td>
                <td class="p-1">${formatTableCell(row.mar)}</td>
                <td class="p-1">${formatTableCell(row.apr)}</td>
                <td class="p-1">${formatTableCell(row.may)}</td>
                <td class="p-1">${formatTableCell(row.jun)}</td>
                <td class="p-1">${formatTableCell(row.jul)}</td>
                <td class="p-1">${formatTableCell(row.aug)}</td>
                <td class="p-1">${formatTableCell(row.sep)}</td>
                <td class="p-1">${formatTableCell(row.oct)}</td>
                <td class="p-1">${formatTableCell(row.nov)}</td>
                <td class="p-1">${formatTableCell(row.dec)}</td>
                <td class="p-2 border-l border-terminal-border font-bold text-terminal-green bg-[#132317]/10">$${row.ytd.toFixed(0)}</td>
            `;
            tableBody.appendChild(tr);
        });

        // Add TOTAL row at the bottom matching values in screenshot
        const totalTr = document.createElement('tr');
        totalTr.className = 'bg-[#131215] font-bold text-center text-slate-200 border-t border-terminal-border text-[8px]';
        totalTr.innerHTML = `
            <td class="p-2 border-r border-terminal-border text-left uppercase text-slate-100 bg-[#121114]">TOTAL</td>
            <td class="p-1 text-terminal-green">$18414</td>
            <td class="p-1 text-terminal-green">$3353</td>
            <td class="p-1 text-terminal-green">$3989</td>
            <td class="p-1 text-terminal-green">$7790</td>
            <td class="p-1 text-terminal-green">$3711</td>
            <td class="p-1 text-terminal-muted">-</td>
            <td class="p-1 text-terminal-muted">-</td>
            <td class="p-1 text-terminal-muted">-</td>
            <td class="p-1 text-terminal-muted">-</td>
            <td class="p-1 text-terminal-muted">-</td>
            <td class="p-1 text-terminal-muted">-</td>
            <td class="p-1 text-terminal-muted">-</td>
            <td class="p-2 border-l border-terminal-border font-bold text-terminal-green bg-[#132317]/20">$29257</td>
        `;
        tableBody.appendChild(totalTr);
    }
}

function formatTableCell(val) {
    if (val === null || val === undefined) return '-';
    return `$${val}`;
}

function populateTransactionsList(txs) {
    const listContainer = document.getElementById('budget-transactions-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    
    // Group transactions by date/month header
    const grouped = {};
    txs.forEach(tx => {
        if (!grouped[tx.type]) {
            grouped[tx.type] = [];
        }
        grouped[tx.type].push(tx);
    });

    for (const [groupName, groupTxs] of Object.entries(grouped)) {
        // Render Month title header
        const monthGroupVal = groupTxs.reduce((sum, current) => {
            return current.isPositive ? sum + current.amount : sum - current.amount;
        }, 0);

        const headerDiv = document.createElement('div');
        headerDiv.className = 'flex justify-between items-center text-[10px] font-bold pb-1 border-b border-terminal-border mt-2 mb-2 select-none text-terminal-muted';
        headerDiv.innerHTML = `
            <span>${groupName}</span>
            <span class="${monthGroupVal >= 0 ? 'text-terminal-green' : 'text-terminal-red'} font-sans">$${Math.abs(monthGroupVal).toFixed(2)}</span>
        `;
        listContainer.appendChild(headerDiv);

        // Render item nodes
        groupTxs.forEach(tx => {
            const item = document.createElement('div');
            item.className = 'flex items-center justify-between p-2.5 rounded bg-[#16151a]/40 border border-[#28252c]/50 hover:border-terminal-bronze/30 hover:bg-[#16151a] transition duration-200';
            item.innerHTML = `
                <div class="flex items-center gap-2.5">
                    <div class="w-6 h-6 rounded flex items-center justify-center text-[9px] ${tx.isPositive ? 'bg-[#132317] text-terminal-green' : 'bg-[#2a1313] text-terminal-red'}">
                        <i class="fa-solid ${tx.isPositive ? 'fa-arrow-down-left' : 'fa-arrow-up-right'}"></i>
                    </div>
                    <div>
                        <div class="font-bold text-slate-200 text-[9px] uppercase tracking-wide">${tx.label}</div>
                        <div class="text-[8px] text-terminal-muted mt-0.5">${tx.date}</div>
                    </div>
                </div>
                <div class="font-bold text-right font-sans ${tx.isPositive ? 'text-terminal-green' : 'text-terminal-bronze'} text-[10px]">
                    $${tx.amount.toFixed(2)}
                </div>
            `;
            listContainer.appendChild(item);
        });
    }
    
    document.getElementById('budget-tx-counter').textContent = `${txs.length} TX`;
}


// ================= VIEW: CRYPTO OPERATIONS (ENTERPRISE CCXT INTEGRATIONS) =================
// ================= CRYPTO TAB — CORPORATE TRADING DASHBOARD =================

async function renderCryptoScreen() {
    // Render synchronous parts immediately
    _renderAssetsChart();
    _renderCandlestickChart(tradingViewAsset);
    _renderTradingViewTickerList();
    _renderCryptoTradeLog('kraken-trade-log', mockKrakenTrades);
    _renderColdStorage();
    _renderInventory();
    _renderCapTable();
    _updateCorpMetrics();
    _renderCryptoAiInsights();
    renderNewsList('crypto-news-headlines', mockCryptoNews);

    // Fetch live data concurrently
    await Promise.allSettled([
        _fetchKrakenBalanceForCorp(),
        _updateTradingViewTicker(tradingViewAsset),
        _updateCorpFearGreed(),
    ]);

    // Refresh calculated metrics & PNL with live prices
    _updateCorpMetrics();
    _renderInventory();
    _renderTradingViewTickerList();
}

function _updateCorpMetrics() {
    let total = 12450.75; // USD cash at Kraken
    mockInventory.forEach(h => {
        total += h.amount * (currentPrices[h.asset] || h.avgBuy * 1.15);
    });
    mockColdStorage.balances.forEach(b => {
        total += b.amount * (currentPrices[b.asset] || 0);
    });

    const sharePrice = total / CORP_TOTAL_SHARES;
    const first      = mockPortfolioHistory[0].value;
    const pct        = ((total - first) / first * 100).toFixed(1);
    const isPos      = total >= first;

    const spEl  = document.getElementById('corp-share-price');
    const pvEl  = document.getElementById('corp-portfolio-val');
    const chgEl = document.getElementById('corp-portfolio-chg');
    if (spEl)  spEl.textContent  = `$${sharePrice.toFixed(2)}`;
    if (pvEl)  pvEl.textContent  = `$${Math.round(total).toLocaleString()}`;
    if (chgEl) {
        chgEl.textContent  = `${isPos ? '▲ +' : '▼ '}${Math.abs(pct)}% VS 30D AGO`;
        chgEl.style.color  = isPos ? 'var(--green)' : 'var(--red)';
    }
}

async function _updateTradingViewTicker(asset) {
    const pEl = document.getElementById('corp-btc-price');
    const cEl = document.getElementById('corp-btc-chg');
    try {
        const res = await fetch(`${API_BASE_URL}/api/kraken/ticker/${asset}%2FUSD`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        currentPrices[asset] = data.last;
        if (pEl) pEl.textContent = `$${data.last.toLocaleString(undefined, { maximumFractionDigits: data.last < 10 ? 4 : 2 })}`;
        if (cEl) {
            const isPos = data.change_24h >= 0;
            cEl.textContent = `${isPos ? '▲ +' : '▼ '}${Math.abs(data.change_24h).toFixed(2)}% 24H`;
            cEl.style.color = isPos ? 'var(--green)' : 'var(--red)';
        }
    } catch {
        const fallback = currentPrices[asset] || 0;
        if (pEl) pEl.textContent = `$${fallback.toLocaleString(undefined, { maximumFractionDigits: fallback < 10 ? 4 : 2 })}`;
        if (cEl) { cEl.textContent = '▲ +1.85% 24H'; cEl.style.color = 'var(--green)'; }
    }
}

function _renderTradingViewTickerList() {
    const container = document.getElementById('trading-view-ticker-list');
    if (!container) return;
    container.innerHTML = '';
    tradingViewAssets.forEach(asset => {
        const price = currentPrices[asset] || 0;
        const btn = document.createElement('button');
        btn.className = `ticker-switch-item${asset === tradingViewAsset ? ' active' : ''}`;
        btn.innerHTML = `
            <span class="ts-symbol"><i class="${getAssetIcon(asset)}"></i>${asset}</span>
            <span class="ts-price">$${price.toLocaleString(undefined, { maximumFractionDigits: price < 10 ? 4 : 2 })}</span>
        `;
        btn.onclick = () => _selectTradingViewAsset(asset);
        container.appendChild(btn);
    });
}

function _selectTradingViewAsset(asset) {
    if (asset === tradingViewAsset) return;
    tradingViewAsset = asset;
    _renderTradingViewTickerList();
    _renderCandlestickChart(asset);
    _updateTradingViewTicker(asset);
}

async function _updateCorpFearGreed() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/crypto/fear-greed`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        _renderFgGauge(data.value, data.label);
    } catch {
        _renderFgGauge(55, 'Neutral');
    }
}

function _renderFgGauge(value, label) {
    const color   = _fgColor(value);
    const gaugeEl = document.getElementById('corp-fg-gauge');
    const vEl     = document.getElementById('corp-fg-value');
    const lEl     = document.getElementById('corp-fg-label');
    if (gaugeEl) gaugeEl.innerHTML = _fgGaugeRingSvg(value);
    if (vEl) { vEl.textContent = value; vEl.style.color = color; }
    if (lEl) { lEl.textContent = label.toUpperCase(); lEl.style.color = color; }
}

// Half-ring segmented gauge in the same style as retirement_goal.sys, colored by fear/greed zone
function _fgGaugeRingSvg(value) {
    const cx = 120, cy = 122, r1 = 76, r2 = 108, N = 20, gap = 1.8;
    const startAngle = 180;   // 9 o'clock (left / FEAR)
    const totalArc   = 180;   // half ring spanning the top
    const step       = totalArc / N;
    const litCount   = Math.round((value / 100) * N);

    const pt = (deg, r) => {
        const rad = deg * Math.PI / 180;
        return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
    };

    // Zone color by segment position around the arc (fear → greed)
    const segColor = (i) => {
        const pct = i / N;
        if (pct < 0.22)  return '#cc2200';
        if (pct < 0.40)  return '#e05a00';
        if (pct < 0.58)  return '#c8a84b';
        if (pct < 0.76)  return '#5fa85f';
        return '#1f8c3b';
    };

    let paths = '';
    for (let i = 0; i < N; i++) {
        // Segments run clockwise from 9 o'clock (180° in SVG = left) over the top to 3 o'clock
        const a1 = startAngle + i * step + gap;
        const a2 = startAngle + (i + 1) * step - gap;
        const lit = i < litCount;

        const [x1o, y1o] = pt(a1, r2);
        const [x2o, y2o] = pt(a2, r2);
        const [x2i, y2i] = pt(a2, r1);
        const [x1i, y1i] = pt(a1, r1);

        // Outer arc CW (sweep=1), inner arc CCW back (sweep=0)
        const d = [
            `M${x1o.toFixed(1)} ${y1o.toFixed(1)}`,
            `A${r2} ${r2} 0 0 1 ${x2o.toFixed(1)} ${y2o.toFixed(1)}`,
            `L${x2i.toFixed(1)} ${y2i.toFixed(1)}`,
            `A${r1} ${r1} 0 0 0 ${x1i.toFixed(1)} ${y1i.toFixed(1)}Z`,
        ].join(' ');

        const c     = segColor(i);
        const style = lit
            ? `fill:${c};filter:drop-shadow(0 0 5px ${c})`
            : 'fill:var(--border-lt)';
        paths += `<path d="${d}" style="${style}"/>`;
    }

    // Outer and inner outline arcs that frame the segment half-ring
    const outerArc = `<path d="M${(cx - r2 - 5).toFixed(1)} ${cy} A${r2 + 5} ${r2 + 5} 0 0 1 ${(cx + r2 + 5).toFixed(1)} ${cy}" fill="none" style="stroke:var(--border);stroke-width:1"/>`;
    const innerArc = `<path d="M${(cx - r1 + 5).toFixed(1)} ${cy} A${r1 - 5} ${r1 - 5} 0 0 1 ${(cx + r1 - 5).toFixed(1)} ${cy}" fill="none" style="stroke:var(--border);stroke-width:1"/>`;

    return `<svg viewBox="0 0 240 138" style="width:100%;height:100%;display:block">
        ${outerArc}${innerArc}${paths}
    </svg>`;
}

async function _fetchKrakenBalanceForCorp() {
    const container = document.getElementById('kraken-balance-row');
    const badge     = document.getElementById('kraken-mode-badge');
    if (!container) return;
    try {
        const res  = await fetch(`${API_BASE_URL}/api/kraken/balance`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        const bals = data.free || data.total || {};
        _renderKrakenBalanceCards(container, bals, data.mode === 'live' ? 'ok' : 'stale');
        if (badge) {
            badge.textContent  = data.mode === 'live' ? 'LIVE' : 'MOCK';
            badge.style.color  = data.mode === 'live' ? 'var(--green)' : 'var(--gold)';
        }
    } catch {
        _renderKrakenBalanceCards(container, { USD: 12450.75, BTC: 0.4258, ETH: 2.15, SOL: 12.50 }, 'error');
    }
}

function _renderKrakenBalanceCards(container, balances, status) {
    const items = Object.entries(balances)
        .filter(([, amount]) => amount > 0)
        .map(([asset, amount]) => {
            const price = asset === 'USD' ? 1 : (currentPrices[asset] || 0);
            const usd   = (amount * price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            return { asset, amount, usd };
        });
    _renderCryptoBalanceList(container, items, status);
}

// Shared row layout for crypto balance lists (kraken.sys / ledger.sys):
// ticker icon · amount + ticker · USD value · connection-status circle
function _renderCryptoBalanceList(container, items, status) {
    if (!container) return;
    const meta = {
        ok:    { color: 'var(--green)', label: 'Up to date' },
        stale: { color: '#e0900a',      label: 'Connected — data may be stale' },
        error: { color: 'var(--red)',   label: 'Connection issue' },
    }[status] || { color: 'var(--green)', label: 'Up to date' };

    container.innerHTML = '';
    items.forEach(({ asset, amount, usd }) => {
        const decimals    = asset === 'USD' ? 2 : 4;
        const amountLabel = Number(amount).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
        const row = document.createElement('div');
        row.className = 'crypto-balance-row';
        row.innerHTML = `
            <span class="cb-icon"><i class="${getAssetIcon(asset)}"></i></span>
            <span class="cb-amount">${amountLabel} ${asset}</span>
            <span class="cb-usd">$${usd}</span>
            <span class="cb-status" style="background:${meta.color}" title="${meta.label}"></span>
        `;
        container.appendChild(row);
    });
}

function _renderCryptoTradeLog(containerId, trades) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    trades.forEach(t => {
        const typeClass = t.type === 'BUY' ? 'trade-type-buy' : 'trade-type-sell';
        const row = document.createElement('div');
        row.className = 'corp-trade-row';
        row.innerHTML = `
            <span style="color:var(--muted);min-width:36px">${t.date}</span>
            <span class="${typeClass}" style="min-width:34px">${t.type}</span>
            <span style="color:var(--text);font-weight:600;min-width:28px">${t.asset}</span>
            <span style="color:var(--muted)">${t.qty}</span>
            <span style="color:var(--gold);margin-left:auto">$${t.total.toLocaleString()}</span>
        `;
        container.appendChild(row);
    });
}

function _renderColdStorage() {
    const bCont = document.getElementById('cold-storage-balances');
    const lCont = document.getElementById('cold-storage-log');
    if (bCont) {
        const items = mockColdStorage.balances.map(b => ({
            asset:  b.asset,
            amount: b.amount,
            usd:    Math.round(b.amount * (currentPrices[b.asset] || 0)).toLocaleString(),
        }));
        _renderCryptoBalanceList(bCont, items, 'ok');
    }
    if (lCont) {
        lCont.innerHTML = '';
        mockColdStorage.log.forEach(entry => {
            const row = document.createElement('div');
            row.className = 'corp-trade-row';
            row.innerHTML = `
                <span style="color:var(--muted);min-width:36px">${entry.date}</span>
                <span style="color:var(--green);font-weight:700;min-width:24px">${entry.type}</span>
                <span style="color:var(--text);font-weight:600;min-width:28px">${entry.asset}</span>
                <span style="color:var(--muted);margin-left:auto">${entry.note}</span>
            `;
            lCont.appendChild(row);
        });
    }
}

function _renderCryptoAiInsights() {
    const container = document.getElementById('crypto-ai-insights');
    if (!container) return;
    container.innerHTML = '';
    const iconMap = { ok: 'fa-circle-check', warn: 'fa-triangle-exclamation', info: 'fa-circle-info' };
    mockCryptoInsights.forEach(ins => {
        const div = document.createElement('div');
        div.className = `insight-item ${ins.cls}`;
        div.innerHTML = `
            <i class="fa-solid ${ins.icon || iconMap[ins.cls] || 'fa-circle-info'}"></i>
            <div>
                <div class="insight-cat">${ins.category}</div>
                <div class="insight-text">${ins.text}</div>
            </div>
        `;
        container.appendChild(div);
    });
}

function _renderInventory() {
    const container = document.getElementById('corp-inventory');
    if (!container) return;
    let rows = '';
    mockInventory.forEach(h => {
        const cur   = currentPrices[h.asset] || h.avgBuy * 1.15;
        const pnl   = ((cur - h.avgBuy) / h.avgBuy * 100).toFixed(1);
        const isPos = parseFloat(pnl) >= 0;
        rows += `<tr>
            <td>${h.asset}</td>
            <td>${h.amount.toLocaleString(undefined,{maximumFractionDigits:4})}</td>
            <td>$${h.avgBuy.toLocaleString(undefined,{maximumFractionDigits:2})}</td>
            <td>$${cur.toLocaleString(undefined,{maximumFractionDigits:2})}</td>
            <td style="color:${isPos?'var(--green)':'var(--red)'}">${isPos?'+':''}${pnl}%</td>
        </tr>`;
    });
    container.innerHTML = `<table class="corp-inventory-table">
        <thead><tr>
            <th style="text-align:left">ASSET</th>
            <th>QTY</th><th>AVG BUY</th><th>CURRENT</th><th>PNL</th>
        </tr></thead>
        <tbody>${rows}</tbody>
    </table>`;
}

function _renderCapTable() {
    const container = document.getElementById('corp-cap-table');
    if (!container) return;
    let total = 12450.75;
    mockInventory.forEach(h => { total += h.amount * (currentPrices[h.asset] || h.avgBuy * 1.15); });
    mockColdStorage.balances.forEach(b => { total += b.amount * (currentPrices[b.asset] || 0); });

    container.innerHTML = '';
    mockCapTable.forEach(sh => {
        const pct  = (sh.shares / CORP_TOTAL_SHARES * 100).toFixed(0);
        const eqv  = Math.round(total * sh.shares / CORP_TOTAL_SHARES).toLocaleString();
        const card = document.createElement('div');
        card.className = 'cap-card';
        card.innerHTML = `
            <div class="cap-card-header">
                <span class="cap-card-name">${sh.name}</span>
                <span class="cap-card-role">${sh.role}</span>
            </div>
            <div class="cap-card-stats">
                <div class="cap-stat">
                    <div class="cap-stat-label">SHARES</div>
                    <div class="cap-stat-val">${sh.shares.toLocaleString()}</div>
                </div>
                <div class="cap-stat">
                    <div class="cap-stat-label">OWNERSHIP</div>
                    <div class="cap-stat-val">${pct}%</div>
                </div>
                <div class="cap-stat" style="grid-column:span 2">
                    <div class="cap-stat-label">EQUITY_VALUE</div>
                    <div class="cap-stat-val">$${eqv}</div>
                </div>
            </div>
            <div class="cap-ownership-bar">
                <div class="cap-ownership-fill" style="width:${pct}%"></div>
            </div>
        `;
        container.appendChild(card);
    });
}

function _renderAssetsChart() {
    const container = document.getElementById('corp-assets-chart');
    if (!container) return;
    const data = mockPortfolioHistory;
    const W=500, H=150, PL=48, PR=12, PT=10, PB=22;
    const iW=W-PL-PR, iH=H-PT-PB;
    const vals = data.map(d=>d.value);
    const minV = Math.min(...vals)*0.97, maxV = Math.max(...vals)*1.01;
    const range = maxV-minV;
    const xS = i => PL+(i/(data.length-1))*iW;
    const yS = v => PT+iH-((v-minV)/range)*iH;
    const pts = data.map((d,i)=>`${xS(i).toFixed(1)},${yS(d.value).toFixed(1)}`).join(' L');
    const area = `M${pts} L${xS(data.length-1).toFixed(1)},${(PT+iH).toFixed(1)} L${xS(0).toFixed(1)},${(PT+iH).toFixed(1)} Z`;
    let grid='';
    for(let i=0;i<=3;i++){
        const y=PT+(iH/3)*i, v=maxV-(range/3)*i;
        grid+=`<line x1="${PL}" y1="${y.toFixed(1)}" x2="${W-PR}" y2="${y.toFixed(1)}" stroke="var(--border)" stroke-width="0.5"/>`;
        grid+=`<text x="${PL-3}" y="${(y+3).toFixed(1)}" fill="var(--muted)" font-size="8" font-family="JetBrains Mono" text-anchor="end">$${Math.round(v/1000)}K</text>`;
    }
    let labels='';
    data.forEach((d,i)=>{ if(i%2===0) labels+=`<text x="${xS(i).toFixed(1)}" y="${H-2}" fill="var(--muted)" font-size="7" font-family="JetBrains Mono" text-anchor="middle">${d.label}</text>`; });
    const lx=xS(data.length-1).toFixed(1), ly=yS(data[data.length-1].value).toFixed(1);
    container.innerHTML=`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:150px;display:block">
        <defs><linearGradient id="corpGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--bronze)" stop-opacity="0.28"/>
            <stop offset="100%" stop-color="var(--bronze)" stop-opacity="0"/>
        </linearGradient></defs>
        ${grid}
        <path d="${area}" fill="url(#corpGrad)"/>
        <path d="M${pts}" fill="none" stroke="var(--bronze)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        ${labels}
        <circle cx="${lx}" cy="${ly}" r="3.5" fill="var(--gold)" style="filter:drop-shadow(0 0 4px rgba(207,167,120,0.8))"/>
    </svg>`;
}

function _scaledOHLC(asset) {
    if (asset === 'BTC') return mockBtcOHLC;
    const ref = mockBtcOHLC[mockBtcOHLC.length - 1].c;
    const ratio = (currentPrices[asset] || ref) / ref;
    return mockBtcOHLC.map(d => ({
        d: d.d,
        o: d.o * ratio,
        h: d.h * ratio,
        l: d.l * ratio,
        c: d.c * ratio,
    }));
}

function _renderCandlestickChart(asset = tradingViewAsset) {
    const container = document.getElementById('corp-btc-chart');
    if (!container) return;
    const data = _scaledOHLC(asset);
    const W=200, H=170, PL=8, PR=8, PT=8, PB=22;
    const iW=W-PL-PR, iH=H-PT-PB;
    const allP=data.flatMap(d=>[d.h,d.l]);
    const minP=Math.min(...allP)*0.999, maxP=Math.max(...allP)*1.001;
    const range=maxP-minP;
    const slotW=iW/data.length, bodyW=slotW*0.55;
    const xC=i=>PL+slotW*i+slotW/2;
    const yS=p=>PT+iH-((p-minP)/range)*iH;
    let candles='';
    data.forEach((d,i)=>{
        const isUp=d.c>=d.o, color=isUp?'var(--green)':'var(--red)';
        const cx=xC(i), bTop=yS(Math.max(d.o,d.c)), bBot=yS(Math.min(d.o,d.c));
        candles+=`<line x1="${cx.toFixed(1)}" y1="${yS(d.h).toFixed(1)}" x2="${cx.toFixed(1)}" y2="${yS(d.l).toFixed(1)}" stroke="${color}" stroke-width="1" opacity="0.9"/>`;
        candles+=`<rect x="${(cx-bodyW/2).toFixed(1)}" y="${bTop.toFixed(1)}" width="${bodyW.toFixed(1)}" height="${Math.max(bBot-bTop,1.5).toFixed(1)}" fill="${color}" opacity="0.85"/>`;
        candles+=`<text x="${cx.toFixed(1)}" y="${H-2}" fill="var(--muted)" font-size="7" font-family="JetBrains Mono" text-anchor="middle">${d.d}</text>`;
    });
    candles+=`<text x="${W-PR}" y="${PT+8}" fill="var(--muted)" font-size="7" font-family="JetBrains Mono" text-anchor="end">$${Math.round(maxP/1000)}K</text>`;
    candles+=`<text x="${W-PR}" y="${PT+iH}" fill="var(--muted)" font-size="7" font-family="JetBrains Mono" text-anchor="end">$${Math.round(minP/1000)}K</text>`;
    container.innerHTML=`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:100%;display:block">${candles}</svg>`;
}

function cryptoOrderStub(type) {
    const btn = document.querySelector(type==='buy'?'.corp-buy-btn':'.corp-sell-btn');
    if (!btn) return;
    const orig = btn.innerHTML;
    btn.textContent = type==='buy'?'ORDER ROUTING...':'SELL ROUTING...';
    btn.disabled = true;
    setTimeout(()=>{ btn.innerHTML=orig; btn.disabled=false; }, 2000);
}

// ================= UTILITIES — system_check.sys security scanner =================
function renderUtilitiesScreen() {
    const list = document.getElementById('security-findings-list');
    if (list && !securityScanRun) {
        list.innerHTML = '<div style="font-size:12px;color:var(--muted);padding:8px 0">Click RUN_SCAN to enumerate running processes and check for suspicious activity.</div>';
    }
}

function _mockSecurityScan() {
    return {
        mode: 'mock',
        scanned_at: new Date().toISOString(),
        process_count: 138,
        findings: [
            {
                pid: 9148,
                name: 'update_helper.exe',
                path: 'C:\\Users\\demo\\AppData\\Local\\Temp\\update_helper.exe',
                severity: 'medium',
                reason: 'Executable launched from an unusual location (appdata\\local\\temp).',
            },
            {
                pid: 5521,
                name: 'svchost.exe',
                path: null,
                severity: 'low',
                reason: 'Executable path could not be resolved (possibly protected or unsigned).',
            },
            {
                pid: 7734,
                name: 'node.exe',
                path: 'C:\\Program Files\\nodejs\\node.exe',
                severity: 'low',
                reason: 'Listening on uncommon port 41223 — verify this is an expected dev service.',
            },
        ],
    };
}

async function runSecurityScan() {
    const btn  = document.getElementById('security-scan-btn');
    const list = document.getElementById('security-findings-list');
    if (!btn || !list) return;

    securityScanRun = true;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> SCANNING...';
    list.innerHTML = '<div style="font-size:12px;color:var(--muted);padding:8px 0">Enumerating processes and checking for suspicious indicators...</div>';

    try {
        const res = await fetch(`${API_BASE_URL}/api/security/scan`);
        if (!res.ok) throw new Error();
        _renderSecurityScan(await res.json());
    } catch {
        _renderSecurityScan(_mockSecurityScan());
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> RUN_SCAN';
    }
}

function _renderSecurityScan(data) {
    const badge   = document.getElementById('security-scan-badge');
    const summary = document.getElementById('security-scan-summary');
    const list    = document.getElementById('security-findings-list');
    if (!list) return;

    const findings  = data.findings || [];
    const scannedAt = data.scanned_at ? new Date(data.scanned_at).toLocaleString() : '—';

    if (badge) {
        badge.textContent = data.mode === 'live' ? 'LIVE' : 'MOCK';
        badge.style.color = data.mode === 'live' ? 'var(--green)' : 'var(--gold)';
    }
    if (summary) {
        const noun = findings.length === 1 ? 'finding' : 'findings';
        summary.textContent = `Scanned ${data.process_count ?? '—'} processes at ${scannedAt} — ${findings.length} ${noun}.`;
    }

    list.innerHTML = '';
    if (!findings.length) {
        list.innerHTML = `
            <div class="finding-item low">
                <div class="finding-head"><i class="fa-solid fa-circle-check" style="color:var(--green)"></i><span class="finding-name">No suspicious activity detected</span></div>
            </div>`;
        return;
    }

    const sevIcon = { high: 'fa-triangle-exclamation', medium: 'fa-circle-exclamation', low: 'fa-circle-info' };
    findings.forEach(f => {
        const row = document.createElement('div');
        row.className = `finding-item ${f.severity}`;
        row.innerHTML = `
            <div class="finding-head">
                <i class="fa-solid ${sevIcon[f.severity] || 'fa-circle-info'}"></i>
                <span class="finding-name">${f.name}</span>
                <span class="finding-pid">PID ${f.pid ?? '—'}</span>
                <span class="finding-badge">${f.severity}</span>
            </div>
            <div class="finding-reason">${f.reason}</div>
            ${f.path ? `<div class="finding-path">${f.path}</div>` : ''}
            <div class="finding-actions">
                <button class="finding-action-btn" onclick="securityFindingAction('investigate', this)">Investigate</button>
                <button class="finding-action-btn danger" onclick="securityFindingAction('terminate', this)">Terminate Process</button>
                <button class="finding-action-btn" onclick="securityFindingAction('ignore', this)">Ignore</button>
            </div>
        `;
        list.appendChild(row);
    });
}

function securityFindingAction(action, btn) {
    if (!btn) return;
    const labels = { investigate: 'LOOKING UP...', terminate: 'TERMINATING...', ignore: 'IGNORED' };
    const orig = btn.textContent;
    btn.textContent = labels[action] || 'WORKING...';
    btn.disabled = true;
    setTimeout(() => {
        if (action === 'ignore') {
            btn.closest('.finding-item')?.remove();
        } else {
            btn.textContent = orig;
            btn.disabled = false;
        }
    }, 1500);
}


// Styling icons mappings
function getAssetIcon(asset) {
    const icons = {
        'BTC': 'fa-brands fa-bitcoin',
        'ETH': 'fa-brands fa-ethereum',
        'SOL': 'fa-solid fa-bolt',
        'USD': 'fa-solid fa-dollar-sign',
        'ADA': 'fa-solid fa-clover'
    };
    return icons[asset.toUpperCase()] || 'fa-solid fa-coins';
}

function getAssetBgColor(asset) {
    const colors = {
        'BTC': 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
        'ETH': 'bg-violet-600/10 text-violet-400 border border-violet-500/20',
        'SOL': 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
        'USD': 'bg-[#132317] text-terminal-green border border-terminal-green/20',
        'ADA': 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
    };
    return colors[asset.toUpperCase()] || 'bg-slate-800 text-slate-400';
}


// ================= VIEW: REGISTERED INVESTMENTS (INDEX & TFSA/RRSP DESKS) =================
function renderInvestmentsScreen() {
    // 1. Render Indices lists
    const indexContainer = document.getElementById('investment-indexes-list');
    if (indexContainer) {
        indexContainer.innerHTML = '';
        mockIndices.forEach(idx => {
            const isPos = idx.change >= 0;
            const div = document.createElement('div');
            div.className = 'border border-terminal-border p-3 rounded bg-[#131215] flex justify-between items-center hover:border-terminal-bronze/30 transition select-none';
            div.innerHTML = `
                <div class="flex items-center gap-2.5">
                    <div class="w-7 h-7 rounded border border-terminal-border bg-terminal-bg flex items-center justify-center text-terminal-muted">
                        <i class="fa-solid ${idx.icon}"></i>
                    </div>
                    <div>
                        <div class="font-bold text-slate-200 text-[11px]">${idx.name}</div>
                        <span class="text-[8px] text-terminal-muted uppercase tracking-wider">INDEX FEED</span>
                    </div>
                </div>
                <div class="text-right">
                    <div class="font-bold text-slate-200 font-sans">${idx.last.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                    <div class="text-[9px] font-sans font-bold mt-0.5 ${isPos ? 'text-terminal-green' : 'text-terminal-red'}">
                        ${isPos ? '▲ +' : '▼ '}${idx.change}%
                    </div>
                </div>
            `;
            indexContainer.appendChild(div);
        });
    }

    // 2. Render TFSA and RRSP breakdown lists
    const accountsContainer = document.getElementById('investment-accounts-grid');
    if (accountsContainer) {
        accountsContainer.innerHTML = '';
        mockInvestmentAccounts.forEach(acc => {
            let holdingsLines = '';
            acc.holdings.forEach(hold => {
                holdingsLines += `
                    <div class="flex justify-between items-center text-[10px] pb-1.5 border-b border-terminal-border/30">
                        <span class="text-slate-300 font-bold">${hold.asset}</span>
                        <div class="text-right font-sans">
                            <span class="text-terminal-muted mr-2">${hold.amt}</span>
                            <span class="text-terminal-gold font-bold">$${hold.val.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                        </div>
                    </div>
                `;
            });
            
            const card = document.createElement('div');
            card.className = 'border border-terminal-border p-4.5 rounded bg-[#131215] space-y-3.5 hover:border-terminal-bronze/30 transition flex flex-col justify-between';
            card.innerHTML = `
                <div>
                    <div class="flex justify-between items-center pb-2.5 border-b border-terminal-border">
                        <span class="font-bold text-slate-200 text-[9px] tracking-wider uppercase">${acc.name}</span>
                        <span class="text-terminal-green text-[9px] font-bold">▲ +${acc.return}% YTD</span>
                    </div>
                    <div class="space-y-2 mt-3">
                        ${holdingsLines}
                    </div>
                </div>
                <div class="pt-3 border-t border-terminal-border/60 flex justify-between items-center text-[10px]">
                    <span class="text-terminal-muted uppercase tracking-wider">Aggregate Balance:</span>
                    <span class="font-bold text-slate-100 font-sans text-sm">$${acc.bal.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                </div>
            `;
            accountsContainer.appendChild(card);
        });
    }
}


// ================= VIEW: HEALTH STATISTICS (MONOSPACE METRICS LOGGER) =================
function renderHealthScreen() {
    // 1. Render vertical checklists steps counts
    const logsContainer = document.getElementById('health-log-activities');
    if (logsContainer) {
        logsContainer.innerHTML = '';
        mockHealthMetrics.forEach(metric => {
            const width = Math.min(metric.pct, 100);
            const block = document.createElement('div');
            block.className = 'border border-terminal-border p-3.5 rounded bg-[#131215] space-y-2 hover:border-terminal-bronze/30 transition select-none';
            block.innerHTML = `
                <div class="flex justify-between items-center text-[10px]">
                    <div class="flex items-center gap-2">
                        <i class="fa-solid ${metric.icon} text-terminal-gold"></i>
                        <span class="font-bold text-slate-200 uppercase">${metric.name}</span>
                    </div>
                    <span class="text-slate-300">${metric.val}</span>
                </div>
                <div class="flex items-center gap-3">
                    <div class="flex-grow bg-terminal-border h-1 rounded overflow-hidden">
                        <div class="bg-terminal-bronze h-full" style="width: ${width}%"></div>
                    </div>
                    <span class="text-[9px] text-terminal-gold font-bold min-w-[28px] text-right">${metric.pct}%</span>
                </div>
            `;
            logsContainer.appendChild(block);
        });
    }

    // 2. Render sleeping / nutrition grid boxes
    const gridContainer = document.getElementById('health-nutrition-grid');
    if (gridContainer) {
        gridContainer.innerHTML = '';
        mockHealthGrid.forEach(box => {
            const col = document.createElement('div');
            col.className = 'border border-terminal-border p-4 rounded bg-[#131215] hover:border-terminal-bronze/30 transition duration-300';
            col.innerHTML = `
                <div class="text-terminal-muted text-[8px] font-bold tracking-widest uppercase">${box.title}</div>
                <div class="text-terminal-gold text-[9px] font-mono mt-0.5">${box.tag}</div>
                <div class="text-lg font-bold text-slate-100 mt-2 font-sans">${box.val}</div>
                <div class="text-[9px] text-terminal-muted mt-1">${box.detail}</div>
            `;
            gridContainer.appendChild(col);
        });
    }
}


// ================= TRANSACTION LOGGER WRITE-BACK MODAL LOGIC =================
const logModal = document.getElementById('tx-log-modal');
const openModalBtn = document.getElementById('open-log-modal-btn');
const closeModalBtn = document.getElementById('close-log-modal-btn');
const txModalForm = document.getElementById('tx-modal-form');

if (openModalBtn) {
    openModalBtn.addEventListener('click', () => {
        if (logModal) logModal.classList.remove('hidden');
    });
}

if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        if (logModal) logModal.classList.add('hidden');
    });
}

// Form write submission handlers
if (txModalForm) {
    txModalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const type = document.getElementById('modal-form-type').value;
        const asset = document.getElementById('modal-form-asset').value.toUpperCase().trim();
        const amount = parseFloat(document.getElementById('modal-form-amount').value);
        const price = parseFloat(document.getElementById('modal-form-price').value);
        const notes = document.getElementById('modal-form-notes').value.trim();
        const date = new Date().toISOString().split('T')[0];
        
        const total = amount * price;
        const submitBtn = document.getElementById('modal-form-submit-btn');
        const origText = submitBtn.innerHTML;

        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> COMMITTING PACKET...`;

        const payload = {
            sheet_name: 'transactions',
            row_values: [date, type, asset, amount, price, total, notes]
        };

        try {
            appendConsoleLog(`Sending payload request to sheet tab 'transactions'...`);
            const res = await fetch(`${API_BASE_URL}/api/sheets/append`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Append request rejected');
            const data = await res.json();
            
            appendConsoleLog(`Commit ledger sequence complete: ${data.message}`, 'success');
            
            // Success response animation
            submitBtn.innerHTML = `<i class="fa-solid fa-circle-check text-terminal-green"></i> PACKET COMMITTED!`;
            
            // Add entry into local memory for simulated instant update
            mockTransactions.unshift({
                date: date,
                type: 'MAY - CASHFLOW',
                label: `${type.toUpperCase()} ${asset}`,
                amount: total,
                isPositive: type.toLowerCase() === 'deposit' || type.toLowerCase() === 'sell'
            });

            // Update UI widgets
            txModalForm.reset();
            setTimeout(() => {
                if (logModal) logModal.classList.add('hidden');
                triggerViewRender(activeTab);
            }, 1000);

        } catch (err) {
            console.error('Modal commit error:', err);
            appendConsoleLog('Could not append row to sheets API. Simulating locally.', 'warn');
            
            // Simulate local fallback immediately
            mockTransactions.unshift({
                date: date,
                type: 'MAY - CASHFLOW',
                label: `${type.toUpperCase()} ${asset}`,
                amount: total,
                isPositive: type.toLowerCase() === 'deposit' || type.toLowerCase() === 'sell'
            });

            submitBtn.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-terminal-gold"></i> LOCAL MOCK SIMULATED`;
            txModalForm.reset();
            setTimeout(() => {
                if (logModal) logModal.classList.add('hidden');
                triggerViewRender(activeTab);
            }, 1000);
        } finally {
            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = origText;
            }, 1200);
        }
    });
}


// ================= UTILITIES DIALECT & MAINTENANCE TRIGGERS =================
const testConnBtn = document.getElementById('sheets-connection-test');
const clearCacheBtn = document.getElementById('system-clear-cache');

if (testConnBtn) {
    testConnBtn.addEventListener('click', async () => {
        testConnBtn.disabled = true;
        appendConsoleLog('Beginning secure handshake with backend host...', 'info');
        
        try {
            const res = await fetch(`${API_BASE_URL}/api/status`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            
            appendConsoleLog(`Handshake response: Gateway healthy. CCXT Live: ${data.integrations.kraken.configured}. Sheets Live: ${data.integrations.google_sheets.configured}`, 'success');
        } catch (err) {
            appendConsoleLog('Handshake timeout: REST backend host offline or blocking requests.', 'error');
        } finally {
            testConnBtn.disabled = false;
        }
    });
}

if (clearCacheBtn) {
    clearCacheBtn.addEventListener('click', () => {
        appendConsoleLog('Clearing client states and cache variables...', 'warn');
        setTimeout(() => {
            appendConsoleLog('Cache cleared. All modules recycled.', 'success');
        }, 800);
    });
}


// ================= GLOBAL REFRESH TRIGGER =================
const refreshGlobalBtn = document.getElementById('refresh-dashboard-btn');
if (refreshGlobalBtn) {
    refreshGlobalBtn.addEventListener('click', () => {
        const icon = refreshGlobalBtn.querySelector('i');
        icon.classList.add('animate-spin');
        
        appendConsoleLog('Recycling systems daemon and pulling price streams...');
        
        // Repoll status and rerender current screen
        Promise.all([
            checkAPIStatus(),
            new Promise(r => setTimeout(r, 600))
        ]).finally(() => {
            icon.classList.remove('animate-spin');
            triggerViewRender(activeTab);
            appendConsoleLog('All streams synchronized successfully.', 'success');
        });
    });
}


// ================= MAIL CLEANUP =================
async function mailCleanup() {
    const btn = document.getElementById('btn-mail-cleanup');
    const result = document.getElementById('mail-cleanup-result');
    if (!btn) return;

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> CLEANING...';
    if (result) result.textContent = '';

    try {
        const res = await fetch(`${API_BASE_URL}/api/mail/cleanup`, { method: 'POST' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const label = data.mode === 'mock'
            ? `${data.deleted} MSGS DELETED (MOCK)`
            : `${data.deleted} MSGS DELETED`;
        if (result) {
            result.textContent = label;
            result.style.color = data.mode === 'mock' ? 'var(--gold)' : 'var(--green)';
        }
        btn.innerHTML = '<i class="fa-solid fa-check"></i> DONE';
        setTimeout(() => {
            btn.innerHTML = '<i class="fa-solid fa-broom"></i> CLEAN UP';
            btn.disabled = false;
            if (result) result.textContent = '';
        }, 3000);
    } catch (err) {
        if (result) { result.textContent = 'ERROR'; result.style.color = 'var(--red)'; }
        btn.innerHTML = '<i class="fa-solid fa-broom"></i> CLEAN UP';
        btn.disabled = false;
    }
}


// ================= CALENDAR GRID =================
function renderCalGrid() {
    const container = document.getElementById('overview-cal-grid');
    if (!container) return;
    container.innerHTML = '';

    const today = new Date();
    const year  = today.getFullYear();
    const month = today.getMonth();

    // Day-of-week headers
    ['SU','MO','TU','WE','TH','FR','SA'].forEach(name => {
        const hdr = document.createElement('div');
        hdr.className = 'cal-day-hdr';
        hdr.textContent = name;
        container.appendChild(hdr);
    });

    const firstDow      = new Date(year, month, 1).getDay();   // 0=Sun
    const daysInMonth   = new Date(year, month + 1, 0).getDate();
    const daysInPrevMo  = new Date(year, month, 0).getDate();

    // Previous-month overflow
    for (let i = firstDow - 1; i >= 0; i--) {
        const cell = document.createElement('div');
        cell.className = 'cal-day other-month';
        cell.textContent = daysInPrevMo - i;
        container.appendChild(cell);
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
        const cell = document.createElement('div');
        cell.className = 'cal-day' + (d === today.getDate() ? ' today' : '');
        cell.textContent = d;
        container.appendChild(cell);
    }

    // Next-month overflow to fill the last row
    const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7;
    const trailing   = totalCells - firstDow - daysInMonth;
    for (let d = 1; d <= trailing; d++) {
        const cell = document.createElement('div');
        cell.className = 'cal-day other-month';
        cell.textContent = d;
        container.appendChild(cell);
    }
}


// ================= VIEW: NEWS FEED =================
function renderNewsView() {
    renderNewsList('news-general-list', mockNewsHeadlines);
    renderNewsList('news-crypto-list', mockCryptoNews);
    renderNewsList('news-tech-list', mockTechNews);
}

function renderNewsList(containerId, items) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '';
    items.forEach(hl => {
        const div = document.createElement('div');
        div.className = 'news-item';
        div.innerHTML = `
            <div class="news-tags">
                <span class="news-cat-tag">${hl.category}</span>
                ${hl.tag ? `<span class="news-trend-tag">&#8599; ${hl.tag}</span>` : ''}
            </div>
            <div class="news-headline">${hl.headline}</div>
            <div class="news-meta"><span>${hl.source}</span><span>${hl.time}</span></div>
        `;
        el.appendChild(div);
    });
}


// ================= RETIREMENT AI ANALYSIS =================
async function retirementAI(type) {
    const output = document.getElementById('retirement-ai-output');
    const modeEl = document.getElementById('retirement-ai-mode');
    const btnPlan = document.getElementById('btn-gen-plan');
    const btnAnalyze = document.getElementById('btn-analyze');
    if (!output) return;

    btnPlan.disabled = true;
    btnAnalyze.disabled = true;
    output.classList.add('visible');
    output.textContent = 'CONNECTING TO AI NODE... ▌';

    const endpoint = type === 'plan' ? '/api/retirement/ai-plan' : '/api/retirement/ai-insights';

    try {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'POST' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const text = data.plan || data.insights || 'No response received.';
        if (modeEl) {
            modeEl.textContent = data.mode === 'live' ? 'AI' : 'MOCK';
            modeEl.style.cssText = `font-size:12px;font-weight:700;color:${data.mode === 'live' ? 'var(--green)' : 'var(--gold)'}`;
        }
        output.textContent = text;
    } catch (err) {
        output.textContent = `ERROR: Could not reach backend.\n${err.message}`;
    }

    btnPlan.disabled = false;
    btnAnalyze.disabled = false;
}


// ================= BTC PRICE + FEAR & GREED =================
async function updateBtcPrice() {
    const priceEl = document.getElementById('btc-price-val');
    const chgEl   = document.getElementById('btc-price-chg');
    if (!priceEl) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/kraken/ticker/BTC%2FUSD`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        priceEl.textContent = `$${Math.round(data.last).toLocaleString()}`;
        if (chgEl) {
            const isPos = data.change_24h >= 0;
            chgEl.textContent = `${isPos ? '▲ +' : '▼ '}${Math.abs(data.change_24h).toFixed(2)}% 24h`;
            chgEl.style.color = isPos ? 'var(--green)' : 'var(--red)';
        }
    } catch {
        priceEl.textContent = '$67,500';
        if (chgEl) { chgEl.textContent = '▲ +1.85% 24h'; chgEl.style.color = 'var(--green)'; }
    }
}

function _fgColor(value) {
    if (value <= 25) return 'var(--red)';
    if (value <= 45) return '#e8844a';
    if (value <= 55) return '#c8a84b';
    if (value <= 75) return 'var(--green)';
    return '#2dcc70';
}

async function updateFearGreed() {
    const fillEl  = document.getElementById('fg-fill');
    const valueEl = document.getElementById('fg-value');
    const labelEl = document.getElementById('fg-label');
    if (!fillEl) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/crypto/fear-greed`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        const color = _fgColor(data.value);
        fillEl.style.width      = `${data.value}%`;
        fillEl.style.background = color;
        if (valueEl) valueEl.textContent = data.value;
        if (labelEl) { labelEl.textContent = data.label.toUpperCase(); labelEl.style.color = color; }
    } catch {
        const color = _fgColor(55);
        fillEl.style.width = '55%'; fillEl.style.background = color;
        if (valueEl) valueEl.textContent = '55';
        if (labelEl) { labelEl.textContent = 'NEUTRAL'; labelEl.style.color = color; }
    }
}


// ================= SIDEBAR GLOBE =================
function initGlobe() {
    const canvas = document.getElementById('sidebar-globe');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    canvas.width  = canvas.clientWidth  || 170;
    canvas.height = canvas.clientHeight || 130;

    const DEG = Math.PI / 180;

    // Financial hub coordinates [lat, lon]
    const HUBS = [
        [ 40.7,  -74.0],  // New York
        [ 51.5,   -0.1],  // London
        [ 35.7,  139.7],  // Tokyo
        [ 22.3,  114.2],  // Hong Kong
        [-23.5,  -46.6],  // São Paulo
        [-33.9,  151.2],  // Sydney
        [ 43.7,  -79.4],  // Toronto
        [ 50.1,    8.7],  // Frankfurt
        [  1.3,  103.8],  // Singapore
        [ 25.2,   55.3],  // Dubai
        [ 19.1,   72.9],  // Mumbai
        [ 31.2,  121.5],  // Shanghai
    ];

    // City pair connections
    const LINKS = [
        [0, 1], [1, 7], [2, 3], [3, 11],
        [8, 9], [5, 8], [9, 1], [0, 6],
    ];

    let rot = 0, pulse = 0, lastTs = null;

    function project(lat, lon, rotDeg) {
        const φ = lat * DEG;
        const λ = (lon + rotDeg) * DEG;
        return {
            x: Math.cos(φ) * Math.cos(λ),
            y: Math.sin(φ),
            z: Math.cos(φ) * Math.sin(λ),
        };
    }

    function toScreen(p, cx, cy, r) {
        return [cx + r * p.x, cy - r * p.y];
    }

    function drawSegmented(points, strokeStyle, lineWidth) {
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = strokeStyle;
        ctx.beginPath();
        let started = false;
        for (const [sx, sy, front] of points) {
            if (front) {
                if (!started) { ctx.moveTo(sx, sy); started = true; }
                else ctx.lineTo(sx, sy);
            } else { started = false; }
        }
        ctx.stroke();
    }

    function draw() {
        const W = canvas.width, H = canvas.height;
        const cx = W / 2, cy = H / 2;
        const r = Math.min(W, H) * 0.42;

        ctx.clearRect(0, 0, W, H);

        // Sphere fill
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(15,17,20,0.65)';
        ctx.fill();

        // Latitude lines
        for (const lat of [-60, -30, 0, 30, 60]) {
            const pts = [];
            for (let lon = -180; lon <= 180; lon += 2) {
                const p = project(lat, lon, rot);
                const [sx, sy] = toScreen(p, cx, cy, r);
                pts.push([sx, sy, p.z >= 0]);
            }
            drawSegmented(pts, 'rgba(168,138,102,0.20)', 0.5);
        }

        // Longitude meridians
        for (let lon = 0; lon < 360; lon += 30) {
            const pts = [];
            for (let lat = -88; lat <= 88; lat += 2) {
                const p = project(lat, lon, rot);
                const [sx, sy] = toScreen(p, cx, cy, r);
                pts.push([sx, sy, p.z >= 0]);
            }
            drawSegmented(pts, 'rgba(168,138,102,0.13)', 0.5);
        }

        // Connection arcs
        for (const [i, j] of LINKS) {
            const [aLat, aLon] = HUBS[i], [bLat, bLon] = HUBS[j];
            const pts = [];
            for (let t = 0; t <= 1; t += 0.025) {
                const p = project(
                    aLat + (bLat - aLat) * t,
                    aLon + (bLon - aLon) * t,
                    rot
                );
                const [sx, sy] = toScreen(p, cx, cy, r);
                pts.push([sx, sy, p.z > 0]);
            }
            drawSegmented(pts, 'rgba(207,167,120,0.22)', 0.8);
        }

        // Glowing data points
        const pulseAmp = 0.5 + 0.5 * Math.sin(pulse);
        for (const [lat, lon] of HUBS) {
            const p = project(lat, lon, rot);
            if (p.z <= 0.05) continue;
            const [sx, sy] = toScreen(p, cx, cy, r);
            const alpha = 0.45 + 0.55 * p.z;
            const dotR  = 1.8 + pulseAmp * 0.9;

            // Outer halo
            ctx.beginPath();
            ctx.arc(sx, sy, dotR * 3.2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(207,167,120,${(alpha * 0.06 * pulseAmp).toFixed(3)})`;
            ctx.fill();

            // Mid ring
            ctx.beginPath();
            ctx.arc(sx, sy, dotR * 1.9, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(207,167,120,${(alpha * 0.16).toFixed(3)})`;
            ctx.fill();

            // Core with glow
            ctx.save();
            ctx.shadowColor = '#cfa778';
            ctx.shadowBlur  = 4 + pulseAmp * 6;
            ctx.beginPath();
            ctx.arc(sx, sy, dotR, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(207,167,120,${alpha.toFixed(3)})`;
            ctx.fill();
            ctx.restore();
        }

        // Rim gradient
        const rim = ctx.createRadialGradient(cx, cy, r * 0.82, cx, cy, r);
        rim.addColorStop(0, 'rgba(168,138,102,0)');
        rim.addColorStop(1, 'rgba(168,138,102,0.10)');
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = rim;
        ctx.fill();

        // Sphere outline
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(168,138,102,0.28)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    function animate(ts) {
        if (!lastTs) lastTs = ts;
        const dt = Math.min((ts - lastTs) / 1000, 0.1);
        lastTs = ts;
        rot   += dt * 5;   // 5°/sec rotation
        pulse += dt * 1.8; // pulse ~1.8 rad/sec
        draw();
        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
}


// ================= INITIAL SYSTEM BOOTLOADER =================
document.addEventListener('DOMContentLoaded', () => {
    // Initial clock setup
    updateClock();

    // Animated globe in sidebar
    initGlobe();

    // Ping API integrations and update indicators
    checkAPIStatus();

    // Live crypto widgets
    updateBtcPrice();
    updateFearGreed();

    // Default boot view to OVERVIEW
    switchTab('overview');
});
