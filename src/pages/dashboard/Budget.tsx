import { useState, useEffect } from 'react';
import { Wallet, ArrowLeftRight, TrendingUp, Sparkles, RefreshCw, AlertCircle, Coins, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

const CURRENCIES: Record<string, { symbol: string; name: string; flag: string }> = {
  USD: { symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
  GBP: { symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  EUR: { symbol: '€', name: 'Euro', flag: '🇪🇺' },
  AUD: { symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  SGD: { symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
  NZD: { symbol: 'NZ$', name: 'New Zealand Dollar', flag: '🇳🇿' },
  INR: { symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  CNY: { symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
  PKR: { symbol: '₨', name: 'Pakistani Rupee', flag: '🇵🇰' },
  BDT: { symbol: '৳', name: 'Bangladeshi Taka', flag: '🇧🇩' },
  NGN: { symbol: '₦', name: 'Nigerian Naira', flag: '🇳🇬' },
  PHP: { symbol: '₱', name: 'Philippine Peso', flag: '🇵🇭' },
  MYR: { symbol: 'RM', name: 'Malaysian Ringgit', flag: '🇲🇾' },
  VND: { symbol: '₫', name: 'Vietnamese Dong', flag: '🇻🇳' },
  AED: { symbol: 'AED', name: 'UAE Dirham', flag: '🇦🇪' },
  SAR: { symbol: 'SR', name: 'Saudi Riyal', flag: '🇸🇦' },
  KRW: { symbol: '₩', name: 'South Korean Won', flag: '🇰🇷' }
};

const DEFAULT_RATES: Record<string, Record<string, number>> = {
  USD: { USD: 1, INR: 83.5, EUR: 0.92, GBP: 0.78, CAD: 1.37, AUD: 1.51, SGD: 1.35, NZD: 1.63, CNY: 7.25, PKR: 278, BDT: 117, NGN: 1500, PHP: 58.5, MYR: 4.71, VND: 25400, AED: 3.67, SAR: 3.75, KRW: 1380 },
  CAD: { CAD: 1, USD: 0.73, EUR: 0.67, GBP: 0.57, AUD: 1.1, SGD: 0.99, NZD: 1.19, INR: 60.9, CNY: 5.29, PKR: 202.9, BDT: 85.4, NGN: 1094, PHP: 42.7, MYR: 3.44, VND: 18540, AED: 2.68, SAR: 2.74, KRW: 1007 },
  GBP: { GBP: 1, USD: 1.28, CAD: 1.76, EUR: 1.18, AUD: 1.94, SGD: 1.73, NZD: 2.09, INR: 107.1, CNY: 9.29, PKR: 356.4, BDT: 150, NGN: 1923, PHP: 75, MYR: 6.04, VND: 32560, AED: 4.7, SAR: 4.8, KRW: 1769 },
  EUR: { EUR: 1, USD: 1.09, CAD: 1.49, GBP: 0.85, AUD: 1.64, SGD: 1.47, NZD: 1.77, INR: 90.8, CNY: 7.88, PKR: 302.2, BDT: 127.2, NGN: 1630, PHP: 63.6, MYR: 5.12, VND: 27600, AED: 4, SAR: 4.08, KRW: 1500 },
  AUD: { AUD: 1, USD: 0.66, CAD: 0.91, EUR: 0.61, GBP: 0.51, SGD: 0.89, NZD: 1.08, INR: 55.3, CNY: 4.8, PKR: 184.1, BDT: 77.5, NGN: 993, PHP: 38.7, MYR: 3.12, VND: 16820, AED: 2.43, SAR: 2.48, KRW: 914 }
};

export function BudgetPlanner() {
  // Expense states (input in base study currency)
  const [tuition, setTuition] = useState(35000);
  const [accommodation, setAccommodation] = useState(12000);
  const [food, setFood] = useState(4000);
  const [insurance, setInsurance] = useState(1500);
  const [transport, setTransport] = useState(1000);

  // Currency utility states
  const [studyCurrency, setStudyCurrency] = useState('USD');
  const [homeCurrency, setHomeCurrency] = useState('INR');
  const [useHomeCurrencyView, setUseHomeCurrencyView] = useState(false);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [rateSource, setRateSource] = useState<'live' | 'fallback' | 'offline'>('offline');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Quick Calculator Tool states
  const [calcAmount, setCalcAmount] = useState<string>('1200');
  const [calcFrequency, setCalcFrequency] = useState<'monthly' | 'weekly' | 'hourly'>('monthly');

  // Fetch real-time exchange rates via API
  useEffect(() => {
    let isMounted = true;
    const fetchRates = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/exchange-rates?base=${studyCurrency}`);
        const data = await response.json();
        if (isMounted) {
          if (data.success) {
            setRates(data.rates || {});
            setRateSource(data.source || 'fallback');
            setLastUpdated(data.last_updated || new Date().toUTCString());
          } else {
            throw new Error("Server succeeded but returned unsuccess payload");
          }
        }
      } catch (err) {
        console.warn("Error fetching exchange rates:", err);
        if (isMounted) {
          // Robust client fallback
          const fallbackRates = DEFAULT_RATES[studyCurrency] || DEFAULT_RATES['USD'];
          setRates(fallbackRates);
          setRateSource('offline');
          setLastUpdated(new Date().toUTCString());
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchRates();
    return () => { isMounted = false; };
  }, [studyCurrency]);

  const activeRate = rates[homeCurrency] || DEFAULT_RATES[studyCurrency]?.[homeCurrency] || 1;

  const getSymbol = (code: string) => CURRENCIES[code]?.symbol || '$';
  const getFlag = (code: string) => CURRENCIES[code]?.flag || '🌐';

  // Format currency helpers
  const formatCurrency = (val: number, code: string) => {
    const symbol = getSymbol(code);
    return `${symbol}${Math.round(val).toLocaleString()}`;
  };

  const getDisplayVal = (valInStudy: number) => {
    if (useHomeCurrencyView) {
      return valInStudy * activeRate;
    }
    return valInStudy;
  };

  const currentDisplayCurrencyCode = useHomeCurrencyView ? homeCurrency : studyCurrency;

  const data = [
    { name: 'Tuition', value: tuition, color: '#10B981' }, // Emerald
    { name: 'Accommodation', value: accommodation, color: '#4F46E5' }, // Indigo
    { name: 'Food', value: food, color: '#F59E0B' }, // Amber
    { name: 'Insurance', value: insurance, color: '#F43F5E' }, // Rose
    { name: 'Transport', value: transport, color: '#8B5CF6' }, // Purple
  ];

  const totalStudyCurrency = data.reduce((acc, curr) => acc + curr.value, 0);
  const totalHomeCurrency = totalStudyCurrency * activeRate;
  const currentTotalDisplay = useHomeCurrencyView ? totalHomeCurrency : totalStudyCurrency;

  // Chart data matching active view
  const chartData = data.map(item => ({
    ...item,
    value: getDisplayVal(item.value)
  }));

  // Smart Advisory based on converted budget
  const getBudgetAdvisory = () => {
    const totalInUSD = studyCurrency === 'USD' ? totalStudyCurrency : (totalStudyCurrency / (rates['USD'] || 1));
    if (totalInUSD < 15000) {
      return {
        title: "Budget is Ultra-Low",
        text: `Your budget of ${formatCurrency(totalStudyCurrency, studyCurrency)} is fairly low for dynamic international study. Make sure to identify fully funded scholarships or grant schemes.`,
        type: "warning"
      };
    } else if (totalInUSD < 45000) {
      return {
        title: "Thrifty & Well-Balanced Solution",
        text: `A yearly tuition & living budget under $45K USD is average and well-managed for Australia, Canada or Germany study paths.`,
        type: "info"
      };
    } else {
      return {
        title: "Comprehensive Budget Tier",
        text: `Your budget of ${formatCurrency(totalStudyCurrency, studyCurrency)} supports premium universities in core US/UK metropolitan cities securely. Consider exploring options for co-op terms to minimize out-of-pocket costs.`,
        type: "success"
      };
    }
  };

  const advisory = getBudgetAdvisory();

  // Quick calculator conversions
  const parsedCalcAmount = parseFloat(calcAmount.replace(/,/g, '')) || 0;
  let calcAnnualStudy = 0;
  if (calcFrequency === 'monthly') calcAnnualStudy = parsedCalcAmount * 12;
  else if (calcFrequency === 'weekly') calcAnnualStudy = parsedCalcAmount * 52;
  else if (calcFrequency === 'hourly') calcAnnualStudy = parsedCalcAmount * 20 * 52; // Assuming active student works 20h / week

  const calcAnnualHome = calcAnnualStudy * activeRate;

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 flex items-center gap-3">
            <Wallet className="w-8 h-8 text-emerald-500" />
            Budget Planner & Currency Hub
          </h1>
          <p className="text-slate-500 mt-1">
            Convert living and study costs into your home currency using real-time API integrations.
          </p>
        </div>

        {/* Live sync connection badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100/60 font-mono text-xs">
          <span className={`w-2 h-2 rounded-full ${rateSource === 'live' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="text-indigo-700 font-bold uppercase tracking-wider">{rateSource === 'live' ? 'API Active' : 'Cached Rate'}</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500 truncate max-w-[120px]">Base: {studyCurrency}</span>
        </div>
      </div>

      {/* Control Configuration Bar */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Study Country Dropdown */}
        <div className="col-span-12 md:col-span-4 flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-indigo-500" /> Study Destination Base Currency
          </label>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 hover:border-slate-300 transition-colors">
            <span className="text-xl shrink-0">{getFlag(studyCurrency)}</span>
            <select
              value={studyCurrency}
              onChange={(e) => setStudyCurrency(e.target.value)}
              className="bg-transparent border-none text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer w-full"
            >
              <option value="USD">USD - United States ($)</option>
              <option value="GBP">GBP - United Kingdom (£)</option>
              <option value="CAD">CAD - Canada (C$)</option>
              <option value="AUD">AUD - Australia (A$)</option>
              <option value="EUR">EUR - Germany/Netherlands (€)</option>
            </select>
          </div>
        </div>

        {/* Direction Indicator */}
        <div className="hidden md:flex col-span-1 justify-center align-middle pt-5">
          <div className="p-3 bg-slate-100 rounded-full text-slate-500 border border-slate-200">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
        </div>

        {/* Home Currency Dropdown */}
        <div className="col-span-12 md:col-span-4 flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Home Currency (For Comparison)
          </label>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 hover:border-slate-300 transition-colors">
            <span className="text-xl shrink-0">{getFlag(homeCurrency)}</span>
            <select
              value={homeCurrency}
              onChange={(e) => setHomeCurrency(e.target.value)}
              className="bg-transparent border-none text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer w-full"
            >
              {Object.entries(CURRENCIES).map(([code, details]) => (
                <option key={code} value={code}>
                  {code} - {details.name} ({details.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Interactive View Toggle */}
        <div className="col-span-12 md:col-span-3 flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Active Display Mode
          </label>
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => setUseHomeCurrencyView(false)}
              className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                !useHomeCurrencyView
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Study ({studyCurrency})
            </button>
            <button
              onClick={() => setUseHomeCurrencyView(true)}
              className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                useHomeCurrencyView
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Home ({homeCurrency})
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Input Workspace & Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Expenses Editor (7/12 width) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="rounded-[2rem] overflow-hidden border border-slate-200/60 shadow-sm">
            <CardContent className="p-8 space-y-6">
              <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-display font-bold text-slate-900">
                    Annual Expense Workspace
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Drag the sliders to estimate typical yearly costs in the destination country.
                  </p>
                </div>
                <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold">
                  Values in {studyCurrency}
                </div>
              </div>

              {/* Sliders Container */}
              <div className="space-y-6">
                {[
                  { label: 'Tuition Fees', value: tuition, setter: setTuition, max: 100000, desc: 'Cost of university programs annually' },
                  { label: 'Accommodation', value: accommodation, setter: setAccommodation, max: 40000, desc: 'Rent, student halls, sublets & deposits' },
                  { label: 'Food & Groceries', value: food, setter: setFood, max: 15000, desc: 'Weekly supermarkets and eating out budgets' },
                  { label: 'Health Insurance', value: insurance, setter: setInsurance, max: 8000, desc: 'Standard student health coverage & fees' },
                  { label: 'Transportation', value: transport, setter: setTransport, max: 8000, desc: 'Public transit passes, trains & flights' },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-slate-200/80 transition-all">
                    <div className="flex justify-between items-center mb-1">
                      <div>
                        <span className="text-sm font-bold text-slate-800 block">{item.label}</span>
                        <span className="text-[10px] text-slate-400 block">{item.desc}</span>
                      </div>
                      <div className="text-right">
                        {/* Always display target currency alongside home currency converts for superb clarity */}
                        <span className="text-sm font-extrabold text-slate-900 block">
                          {formatCurrency(item.value, studyCurrency)}
                        </span>
                        <span className="text-xs font-semibold text-indigo-600/80 block">
                          ≈ {formatCurrency(item.value * activeRate, homeCurrency)}
                        </span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={item.max}
                      step="250"
                      value={item.value}
                      onChange={(e) => item.setter(Number(e.target.value))}
                      className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer mt-3"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Converter Calculator */}
          <Card className="rounded-[2rem] overflow-hidden border border-slate-200/60 shadow-sm bg-gradient-to-br from-indigo-950 to-indigo-900 text-white">
            <CardContent className="p-8 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-indigo-300" />
                <h4 className="text-lg font-bold">Quick Rate Converter Calculator</h4>
              </div>
              <p className="text-indigo-200 text-xs">
                Quickly convert local numbers (like room rent, wages or course books) into your study base or home currency instantly.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
                <div className="col-span-12 md:col-span-5 flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">Amount ({studyCurrency})</span>
                  <input
                    type="text"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                    className="bg-indigo-900/60 border border-indigo-700/60 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder-indigo-400 w-full font-semibold"
                    placeholder="e.g. 1500"
                  />
                </div>

                <div className="col-span-12 md:col-span-4 flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">Billing Term</span>
                  <div className="flex bg-indigo-900/80 p-0.5 rounded-xl border border-indigo-700/60">
                    {['monthly', 'weekly', 'hourly'].map((freq) => (
                      <button
                        key={freq}
                        onClick={() => setCalcFrequency(freq as any)}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-colors ${
                          calcFrequency === freq ? 'bg-indigo-600 text-white' : 'text-indigo-300 hover:text-white'
                        }`}
                      >
                        {freq}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-span-12 md:col-span-3 flex flex-col justify-end pt-4 md:pt-0">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider mb-1 block">Live Exchange Rate</span>
                  <span className="text-sm font-semibold text-indigo-100 flex items-center gap-1 bg-indigo-900/40 p-2.5 rounded-xl border border-indigo-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    1 {studyCurrency} = {activeRate.toFixed(2)} {homeCurrency}
                  </span>
                </div>
              </div>

              {/* Converted Outputs display */}
              <div className="pt-4 border-t border-indigo-800/80 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-indigo-900/40 p-4 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-indigo-300">Equivalent Yearly Study Total</span>
                  <p className="text-2xl font-black mt-1 text-white">
                    {formatCurrency(calcAnnualStudy, studyCurrency)}
                    <span className="text-xs font-normal text-indigo-300 ml-1">/{studyCurrency} yr</span>
                  </p>
                  <p className="text-slate-400 text-[10px] mt-0.5">
                    {calcFrequency === 'hourly' && "*Based on standard 20 hours/week cap"}
                  </p>
                </div>

                <div className="bg-emerald-950/40 border border-emerald-800/40 p-4 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-emerald-400">Home Currency Target Cost</span>
                  <p className="text-2xl font-black mt-1 text-emerald-300">
                    {formatCurrency(calcAnnualHome, homeCurrency)}
                    <span className="text-xs font-normal text-emerald-400/80 ml-1">/{homeCurrency} yr</span>
                  </p>
                  <p className="text-emerald-400/60 text-[10px] mt-0.5">
                    Converted automatically at local market exchange rate.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Visual Analytics, Breakdown and Advisories */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main Financial Dashboard Widget */}
          <Card className="bg-slate-900 text-white border-none shrink-0 overflow-hidden relative rounded-[2rem]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px]"></div>
            <CardContent className="p-8 relative z-10 space-y-6 flex flex-col justify-between">
              
              {/* Secondary comparative totals always visible to protect against orientation confusion */}
              <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-2xl border border-slate-700/30">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Total Yearly Cost</span>
                  <span className="text-2xl font-black text-white">
                    {formatCurrency(currentTotalDisplay, currentDisplayCurrencyCode)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Converted Rate</span>
                  <span className="text-xs font-serif italic text-emerald-400/90 block font-bold">
                    1 {studyCurrency} = {activeRate.toFixed(4)} {homeCurrency}
                  </span>
                </div>
              </div>

              {/* Side-by-side display of both figures block */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300 block">Amount in Study</span>
                  <h3 className="text-xl font-bold mt-1 text-white">
                    {formatCurrency(totalStudyCurrency, studyCurrency)}
                  </h3>
                  <span className="text-[10px] text-indigo-200">Local country fees</span>
                </div>

                <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block">Amount in Home</span>
                  <h3 className="text-xl font-bold mt-1 text-emerald-300">
                    {formatCurrency(totalHomeCurrency, homeCurrency)}
                  </h3>
                  <span className="text-[10px] text-emerald-400/80">Converted conversion</span>
                </div>
              </div>

              {/* Dynamic last updated metadata text */}
              <div className="pt-2 text-[10px] text-slate-400 flex items-center justify-between text-right">
                <div className="flex items-center gap-1 text-slate-300">
                  <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Rates sync automatic</span>
                </div>
                <span>Last Updated: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'N/A'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Graphical Representation Card */}
          <Card className="rounded-[2rem] overflow-hidden border border-slate-200/60 shadow-sm">
            <CardContent className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-display font-bold text-slate-900">Expense Distribution</h3>
                <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-full">
                  Sorted in {currentDisplayCurrencyCode}
                </span>
              </div>
              <div className="h-60 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: number) => formatCurrency(value, currentDisplayCurrencyCode)}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontFamily: 'Inter' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Dynamic Smart Budget Advisory Card */}
          <Card className={`rounded-[2rem] border overflow-hidden shadow-sm ${
            advisory.type === 'warning' ? 'bg-amber-50/60 border-amber-200/50 text-amber-900' :
            advisory.type === 'success' ? 'bg-emerald-50/60 border-emerald-200/50 text-emerald-900' :
            'bg-indigo-50/60 border-indigo-200/50 text-indigo-900'
          }`}>
            <CardContent className="p-6 flex gap-4 items-start">
              <AlertCircle className={`w-6 h-6 shrink-0 ${
                advisory.type === 'warning' ? 'text-amber-600' :
                advisory.type === 'success' ? 'text-emerald-600' :
                'text-indigo-600'
              }`} />
              <div className="space-y-1">
                <h4 className="font-bold text-sm">{advisory.title}</h4>
                <p className="text-xs leading-relaxed opacity-90">{advisory.text}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
