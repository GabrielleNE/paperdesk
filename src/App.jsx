import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
  AreaChart, Area,
} from "recharts";
import {
  TrendingUp, TrendingDown, BookOpen, BarChart3, Wallet, RotateCcw,
  ChevronRight, Check, X, Award, AlertTriangle, Play, Pause,
  Target, Calculator, Trash2,
} from "lucide-react";

/* ----------------------------------------------------------------------------
   TRADING SIMULATOR  —  self-contained paper-trading + learning environment
   - Simulated geometric-Brownian-motion price feed (no internet needed)
   - Lessons covering the fundamentals for a total beginner
   - Buy / sell with cash + holdings tracking, P/L, order history
---------------------------------------------------------------------------- */

const STARTING_CASH = 10000;

const TICKERS = [
  { sym: "NOVA", name: "Nova Robotics",   start: 142.5, vol: 0.018, drift: 0.0004 },
  { sym: "ATLS", name: "Atlas Energy",    start: 68.2,  vol: 0.012, drift: 0.0002 },
  { sym: "VERD", name: "Verdant Foods",   start: 31.9,  vol: 0.009, drift: 0.0001 },
  { sym: "QBIT", name: "Qubit Systems",   start: 211.0, vol: 0.028, drift: 0.0006 },
  { sym: "HRBR", name: "Harbor Freight",  start: 54.7,  vol: 0.014, drift: 0.00015 },
];

const LESSONS = [
  {
    id: "what-is-stock",
    title: "What is a stock?",
    body: [
      "A stock (also called a share or equity) is a unit of ownership in a company. When a business wants to raise money, one option is to sell pieces of itself to the public. Buy one share and you legally own a tiny fraction of that entire company — its buildings, its brand, its future profits.",
      "Imagine a pizza shop worth $1,000,000 that has divided itself into 1,000,000 shares. Each share represents one-millionth of the business and would cost about $1. If the shop becomes more valuable — say it opens new locations and is now worth $2,000,000 — each of those same shares is now worth about $2. You didn't do anything; the value of what you own simply grew.",
      "There are two main ways a stock makes you money. The first is capital appreciation: the share price rises and you sell for more than you paid. The second is dividends — many established companies pay out a slice of their profits to shareholders every quarter, like a small thank-you cheque for owning the stock.",
      "Prices move because a stock is only ever worth what someone else will pay for it right now. If more people want to buy than sell, the price drifts up; if more want to sell, it drifts down. Underneath that tug-of-war, prices tend to follow the company's real prospects over the long run — but in the short run they can swing on news, mood, and speculation.",
    ],
    example: {
      title: "Worked example: a simple gain",
      lines: [
        "You buy 10 shares of a company at $50 each. Total spent: 10 × $50 = $500.",
        "Six months later the company reports strong earnings and the price rises to $62.",
        "Your 10 shares are now worth 10 × $62 = $620.",
        "If you sell, your profit is $620 − $500 = $120, a 24% return on your $500.",
        "If the company also paid a $0.40 dividend per share along the way, that's another 10 × $0.40 = $4 in your pocket.",
      ],
    },
    mistakes: [
      "Thinking a low share price means a stock is 'cheap.' A $5 stock isn't a bargain and a $500 stock isn't expensive — what matters is the company's value relative to its price, not the sticker number.",
      "Assuming a share is a guaranteed claim on profits. Companies can cut dividends, and share prices can fall to zero if a business fails. Ownership means you share the downside too.",
      "Believing prices reflect 'the truth.' They reflect what buyers and sellers feel today, which can be wrong in both directions.",
    ],
    tryThis: "Open the Trade tab and buy 5 shares of any stock. Watch the Portfolio tab: your cash drops by the purchase amount and that money reappears as 'holdings value.' Nothing was lost — you converted cash into ownership. Let it sit a minute and watch the value tick up and down on its own.",
    quiz: [
      {
        q: "When you buy a share of a company, what do you actually own?",
        options: ["A loan to the company", "A small piece of the company", "A guarantee of profit"],
        answer: 1,
      },
      {
        q: "Two companies trade at $8 and $400 per share. Which is the better buy?",
        options: ["The $8 one — it's cheaper", "The $400 one — it's higher quality", "Can't tell from price alone"],
        answer: 2,
      },
      {
        q: "Besides the price going up, how else can a stock make you money?",
        options: ["Dividends — a share of profits paid to owners", "Interest, like a savings account", "A tax refund each year"],
        answer: 0,
      },
    ],
  },
  {
    id: "bid-ask-spread",
    title: "Price, orders & the spread",
    body: [
      "A stock doesn't have one single price — it has two at any moment. The bid is the highest price buyers are currently willing to pay. The ask (or offer) is the lowest price sellers are willing to accept. The quoted 'price' you see is usually the most recent trade, sitting somewhere between them.",
      "The gap between the bid and the ask is called the spread, and it's a real cost of trading that beginners often miss. If a stock has a bid of $20.00 and an ask of $20.10, you'd buy at $20.10 and — if you turned around and sold instantly — only get $20.00. That ten-cent spread is gone before the price has moved at all. Heavily traded stocks have tiny spreads (a penny or two); obscure ones can have wide, costly spreads.",
      "How you buy matters as much as what you buy. A market order says 'fill me right now at whatever the going price is.' It's fast and almost always executes, but you don't control the exact price — in a fast-moving market you might pay more than you expected (this is called slippage). A limit order says 'only fill me at $20.00 or better.' You control the price, but the trade might never happen if the stock doesn't reach your number.",
      "A good rule of thumb: use market orders when getting filled matters more than a few cents (liquid stocks, small positions), and limit orders when price precision matters more than certainty of execution.",
    ],
    example: {
      title: "Worked example: the spread as a hidden fee",
      lines: [
        "A stock shows bid $49.90 / ask $50.00. The spread is $0.10.",
        "You place a market buy for 100 shares — you pay the ask: 100 × $50.00 = $5,000.",
        "You immediately change your mind and sell at market — you get the bid: 100 × $49.90 = $4,990.",
        "You lost $10 instantly, despite the 'price' never moving. That's the spread.",
        "On a stock with a $0.01 spread instead, the same round-trip would cost just $1.",
      ],
    },
    mistakes: [
      "Using market orders on thinly-traded stocks with wide spreads — you can lose a percent or more to the spread alone before you're even in the game.",
      "Setting a limit order and forgetting about it. If the price never reaches your limit, you simply never buy, and may miss the move entirely.",
      "Ignoring the spread on frequent trades. Trading in and out ten times a day means paying the spread twenty times — it adds up fast.",
    ],
    tryThis: "In the Trade tab, place a buy and then immediately sell the same shares without waiting. Check your net worth on the Portfolio tab — notice you're slightly down even though no time passed. (This sim keeps it simple, but real brokers make that gap larger.) The lesson: every round-trip has a cost, so trade with intention.",
    quiz: [
      {
        q: "A market order is filled...",
        options: ["At a price you choose", "Immediately at the current price", "Only when the market closes"],
        answer: 1,
      },
      {
        q: "The 'spread' is the gap between...",
        options: ["Today's high and low price", "The highest bid and the lowest ask", "The buy price and the dividend"],
        answer: 1,
      },
      {
        q: "You want to buy a stock only if it drops to exactly $30. Which order do you use?",
        options: ["A market order", "A limit order set at $30", "Neither — you can't control price"],
        answer: 1,
      },
    ],
  },
  {
    id: "risk-diversify",
    title: "Risk & diversification",
    body: [
      "Risk and reward are joined at the hip. Any investment that could realistically double in value can also realistically halve — there's no such thing as high return with no risk, and anyone promising that is selling something. The skill isn't avoiding risk; it's choosing how much to take and making sure no single bet can wipe you out.",
      "Volatility is the word for how much a price bounces around. A stable utility company might drift a percent or two a day; a small biotech can leap or crash 30% on a single announcement. Higher volatility means higher potential gains and higher potential losses. Neither is 'better' — it depends on how much swing you can stomach and how long you can wait.",
      "Diversification is the closest thing investing has to a free lunch. The idea: spread your money across many different investments so that no single failure can sink you. If you own one stock and it drops 50%, you've lost half your money. If you own twenty stocks and one drops 50%, you've lost about 2.5% of your total. The losers are cushioned by the winners.",
      "The key is owning things that don't all move together. Ten different tech stocks aren't truly diversified — they tend to rise and fall as a group. Mixing industries (tech, energy, healthcare, consumer goods) and asset types gives you real protection, because when one corner of the market struggles, another often holds up.",
    ],
    example: {
      title: "Worked example: why diversification cushions losses",
      lines: [
        "Portfolio A: $10,000 all in one stock. That stock falls 40%. You now have $6,000 — a $4,000 loss.",
        "Portfolio B: $10,000 split evenly across 10 stocks ($1,000 each).",
        "One of them falls 40% (−$400). Three are flat. Six rise an average of 8% (+$480 total).",
        "Portfolio B is now worth $10,000 − $400 + $480 = $10,080 — actually up slightly.",
        "Same bad stock, wildly different outcome, purely because of how the money was spread.",
      ],
    },
    mistakes: [
      "'Diworsification' in reverse — putting everything in one stock because you're sure about it. Confidence is not a risk management strategy.",
      "Fake diversification: owning five stocks that are all in the same industry. They'll crash together when that sector turns.",
      "Investing money you'll need soon. Markets can stay down for months or years; never put rent or emergency savings into stocks.",
      "Over-diversifying into 100+ positions you can't track — you end up owning the market with extra effort and no real insight.",
    ],
    tryThis: "Start fresh (hit Reset), then split your $10,000 across at least four different stocks instead of one. Watch the Portfolio performance chart over a few minutes: notice how the overall line is smoother than any single holding's swings. That smoothing is diversification working in real time.",
    quiz: [
      {
        q: "What is the main benefit of diversification?",
        options: ["Guarantees higher returns", "Reduces the impact of any single loss", "Eliminates all risk"],
        answer: 1,
      },
      {
        q: "Which of these is genuinely diversified?",
        options: ["Five different social-media stocks", "Stocks across tech, energy, healthcare & consumer goods", "One stock you're very confident in"],
        answer: 1,
      },
      {
        q: "A stock that can double in a year most likely also...",
        options: ["Can fall sharply — high reward means high risk", "Is guaranteed by the government", "Carries no real downside"],
        answer: 0,
      },
    ],
  },
  {
    id: "psychology",
    title: "Emotions & discipline",
    body: [
      "Here's an uncomfortable truth: most of the time, the thing standing between you and decent returns isn't a lack of knowledge — it's your own emotions. The two classic wreckers are fear and greed, and they show up exactly when they'll do the most damage.",
      "Fear strikes at the bottom. A stock you own is falling, the red numbers feel like a wound, and every instinct screams 'make the pain stop.' So you sell — often within hours of the low — locking in a loss right before the rebound. Greed strikes at the top. A stock has already soared, everyone's talking about it, and the fear of missing out pulls you in to buy at the peak, right before it cools off. Buy high, sell low: the exact opposite of the goal, driven entirely by feeling.",
      "The antidote is a plan made in advance, when you're calm. Before you buy, you decide three things: why you're buying, the price at which you'll take profits, and the price at which you'll cut a loss. Once it's written down, your job in the heat of the moment isn't to decide — it's just to follow the plan you already made. This is the single biggest difference between disciplined investors and the crowd.",
      "Two more traps worth naming. Confirmation bias: once you own something, you start seeking out only the news that says you're right and dismissing the rest. And loss aversion: the pain of a $100 loss feels far bigger than the pleasure of a $100 gain, which pushes people to hold losers too long ('I'll sell when it gets back to even') and sell winners too early.",
    ],
    example: {
      title: "Worked example: the cost of panic selling",
      lines: [
        "You buy 50 shares at $40 ($2,000). Bad news hits and it drops to $32 — a $400 paper loss.",
        "Panicked, you sell at $32, turning the paper loss into a real $400 loss.",
        "Two weeks later the panic fades and the stock recovers to $43.",
        "Had you stuck to a plan and held, you'd have $43 × 50 = $2,150 — a $150 gain instead of a $400 loss.",
        "The $550 swing came entirely from the emotional decision, not the company.",
      ],
    },
    mistakes: [
      "Checking your portfolio constantly. The more often you look, the more the random daily noise tempts you into reacting.",
      "Moving your 'sell if it drops to X' line lower every time it gets close, so you never actually cut a loss.",
      "Buying a stock purely because it's been going up and you feel left out. The move you're chasing is often already over.",
      "Selling a winner the moment it's up a little, then watching it climb for months without you.",
    ],
    tryThis: "Before your next sim trade, write down on paper: your buy reason, a target sell price (say +10%), and a stop price (say −7%). Then trade and hold to one of those two lines — no matter what the wiggling price tempts you to do. Notice how much calmer it feels to follow a decision instead of making one under pressure.",
    quiz: [
      {
        q: "Why trade in a simulator before using real money?",
        options: ["Simulated gains are real", "To build skill & discipline risk-free", "It guarantees you'll win later"],
        answer: 1,
      },
      {
        q: "'Buy high, sell low' usually happens because of...",
        options: ["Careful analysis", "Fear and greed overriding a plan", "Following a written strategy"],
        answer: 1,
      },
      {
        q: "What's the best defense against emotional trading?",
        options: ["Watching the price every minute", "A plan with target and stop prices set in advance", "Trusting your gut in the moment"],
        answer: 1,
      },
    ],
  },
  {
    id: "valuation",
    title: "Valuation: P/E & fundamentals",
    level: "advanced",
    body: [
      "Price tells you what a stock costs. Valuation tells you whether that cost is reasonable. The two are completely different questions, and confusing them is one of the most common beginner errors. A $500 stock can be a screaming bargain and a $4 stock can be wildly overpriced — it all depends on what you get for your money.",
      "The most common quick gauge is the P/E ratio: price divided by earnings per share. If a company earns $4 per share in annual profit and trades at $80, its P/E is 80 ÷ 4 = 20. The intuition: you're paying $20 for every $1 of yearly profit the company currently generates. All else equal, a lower P/E means you're paying less for each dollar of earnings.",
      "But all else is rarely equal. A high P/E isn't automatically 'expensive' — it often means investors expect profits to grow fast, so they'll pay up today for bigger earnings tomorrow. A low P/E isn't automatically 'cheap' — it can signal a company in decline that the market has given up on (a so-called value trap). Context is everything: you compare a company's P/E to its own history and to its direct competitors, not to the whole market.",
      "P/E is just the doorway. Fundamental analysis looks at the whole business: is revenue growing? Are profit margins healthy or shrinking? How much debt is on the books? Does the company have a durable advantage competitors can't easily copy? The goal is to estimate what a business is genuinely worth, then buy only when the market is offering it for less than that.",
    ],
    example: {
      title: "Worked example: comparing two stocks by P/E",
      lines: [
        "Company A trades at $120 and earns $6 per share. P/E = 120 ÷ 6 = 20.",
        "Company B trades at $30 and earns $1 per share. P/E = 30 ÷ 1 = 30.",
        "Despite its far lower share price, Company B is the more 'expensive' of the two — you pay $30 per dollar of earnings versus $20.",
        "If both grow at the same rate, A is the better value. But if B is growing profits 40% a year and A is flat, B's higher P/E may be fully justified.",
        "The number alone never decides — growth and quality complete the picture.",
      ],
    },
    mistakes: [
      "Treating a low P/E as an automatic 'buy.' Cheap stocks are sometimes cheap for very good reasons.",
      "Comparing P/E across unrelated industries. A fast-growing software firm and a stable utility naturally carry very different ratios.",
      "Ignoring debt. A company can look profitable on a P/E basis while quietly drowning in loans it can't repay.",
      "Relying on a single metric. P/E is a starting question, not a final answer.",
    ],
    tryThis: "This sim doesn't model earnings, so treat this one as a real-world exercise: pick any well-known company, search its current P/E ratio, then look up a direct competitor's. Ask yourself what would justify the gap between them — faster growth? Better margins? That habit of asking 'why is this priced where it is?' is the core of valuation.",
    quiz: [
      {
        q: "A company with a P/E of 25 means investors are paying...",
        options: ["$25 per share", "$25 for every $1 of annual earnings", "25% interest per year"],
        answer: 1,
      },
      {
        q: "Stock X: $200 price, $10 earnings/share. Stock Y: $40 price, $1 earnings/share. Which has the higher P/E?",
        options: ["X (P/E 20)", "Y (P/E 40)", "They're equal"],
        answer: 1,
      },
      {
        q: "A very low P/E might be a warning sign of...",
        options: ["A company the market expects to decline", "Guaranteed future gains", "Too little debt"],
        answer: 0,
      },
    ],
  },
  {
    id: "dca",
    title: "Dollar-cost averaging",
    level: "advanced",
    body: [
      "Timing the market — buying right before it rises and selling right before it falls — is something almost nobody does consistently, including professionals with teams and supercomputers. Dollar-cost averaging (DCA) is a strategy that simply gives up on trying, and wins by not playing that losing game.",
      "The mechanic is dead simple: you invest a fixed dollar amount on a regular schedule — say $500 on the first of every month — regardless of what the price is doing. You don't wait for a 'good' moment. You don't check whether it feels high or low. You just buy, mechanically, on schedule.",
      "Here's the quiet magic. Because you're spending a fixed dollar amount, your money automatically buys more shares when prices are low and fewer shares when prices are high. Over time this pulls your average purchase price below the simple average of the prices you bought at — you're systematically loading up more at the cheap moments without ever having to predict them.",
      "DCA won't beat a perfectly-timed lump sum — if you could nail the exact bottom, going all-in there would win. But nobody can do that reliably, and the bigger benefit is behavioral: DCA removes emotion, enforces discipline, and protects you from the disaster of dumping your entire savings in the day before a crash. It's the strategy behind every automatic retirement contribution, and it works precisely because it's boring.",
    ],
    example: {
      title: "Worked example: DCA vs. buying all at once",
      lines: [
        "You invest $300/month for 3 months. Prices those months: $30, $20, $15.",
        "Month 1: $300 ÷ $30 = 10 shares. Month 2: $300 ÷ $20 = 15 shares. Month 3: $300 ÷ $15 = 20 shares.",
        "Total: $900 spent, 45 shares owned. Your average cost = $900 ÷ 45 = $20.00 per share.",
        "But the simple average of the three prices was ($30+$20+$15) ÷ 3 = $21.67.",
        "DCA got you in at $20.00 instead of $21.67 — cheaper, automatically, because your fixed $300 bought more shares when the price was low.",
      ],
    },
    mistakes: [
      "Abandoning the schedule the moment prices drop — which is exactly when DCA is buying you the most shares. The discipline is the whole point.",
      "Confusing DCA with a guarantee. It lowers timing risk; it does not promise a profit if the investment itself is bad.",
      "Using DCA on a single risky stock and calling it safe. Spreading entries over time doesn't fix a lack of diversification across holdings.",
      "Trying to 'improve' DCA by skipping months you think are too expensive — now you're market-timing again, which is what you were avoiding.",
    ],
    tryThis: "Simulate DCA in the sandbox: pick one stock and buy a fixed dollar amount (say ~$1,000 worth) several times over a few minutes as the price moves, instead of spending it all at once. Check your average cost on the Trade tab (the gold dashed line). Notice it lands between the high and low prices you bought at — that's your averaging in action.",
    quiz: [
      {
        q: "Under dollar-cost averaging, when prices fall your fixed payment buys...",
        options: ["Fewer shares", "More shares", "The same number of shares"],
        answer: 1,
      },
      {
        q: "The main advantage of DCA over a lump sum is that it...",
        options: ["Always earns more money", "Removes timing pressure and emotion", "Avoids all losses"],
        answer: 1,
      },
      {
        q: "You DCA $200 at prices $40, $25, $20. Roughly how many total shares?",
        options: ["About 15", "About 23", "About 30"],
        answer: 1,
      },
    ],
  },
  {
    id: "orders-risk",
    title: "Stop-losses & position sizing",
    level: "advanced",
    body: [
      "Professionals obsess less over picking winners and more over surviving losers. The reason is mathematical: a 50% loss requires a 100% gain just to break even. Protect the downside and the upside tends to take care of itself. Two tools do most of that protecting — the stop-loss and position sizing.",
      "A stop-loss is a price, decided in advance, at which you'll sell to cap your loss. Set it the moment you buy, while you're still calm and objective, not in the panic of a falling price. It turns 'how much could I lose?' from an open-ended nightmare into a known, bounded number. The discipline of honoring it — actually selling when it triggers — is what separates a small, planned loss from a portfolio-wrecking one.",
      "Position sizing answers 'how many shares should I buy?' — and the professional answer is never 'as many as I can afford.' A widely-used guideline is to risk only about 1–2% of your total account on any single trade. 'Risk' here means the amount you'd lose if your stop-loss triggers, not the total you invest.",
      "The two tools work together through one formula: shares to buy = (dollars you're willing to risk) ÷ (risk per share). The distance to your stop sets your size. A tight stop lets you buy more shares; a wide stop forces you to buy fewer. Your gut feeling about the stock never enters the calculation — the math does.",
    ],
    example: {
      title: "Worked example: sizing a position properly",
      lines: [
        "Account size: $10,000. You decide to risk 2% on this trade → $200 maximum loss.",
        "You want to buy a stock at $50 and you'll set your stop-loss at $45.",
        "Risk per share = $50 − $45 = $5.",
        "Shares to buy = $200 ÷ $5 = 40 shares. That's a $2,000 position.",
        "If the stop triggers at $45, you lose 40 × $5 = $200 — exactly your planned 2%. Your size came from the math, not a hunch.",
      ],
    },
    mistakes: [
      "Setting a stop-loss and then moving it lower when the price approaches, so it never actually protects you. A stop you won't honor isn't a stop.",
      "Sizing by 'how much can I afford' instead of 'how much can I lose if I'm wrong.' This is how one bad trade erases months of gains.",
      "Placing the stop so tight that normal daily wiggle triggers it constantly, bleeding you with many tiny losses.",
      "Risking wildly different amounts on each trade, so one oversized loser undoes several disciplined winners.",
    ],
    tryThis: "Practice the formula in the sim. Before buying, pick a stop price below the current price and decide your max loss is $200. Compute shares = $200 ÷ (price − stop), buy roughly that many, and mentally commit to selling if it hits your stop. Doing the arithmetic a few times makes position sizing automatic.",
    quiz: [
      {
        q: "What primarily determines how many shares you should buy?",
        options: ["How confident you feel", "Your stop distance and the amount you're willing to risk", "The stock's current price alone"],
        answer: 1,
      },
      {
        q: "Risking 2% of a $10,000 account with a $4 stop distance, how many shares?",
        options: ["50 shares", "200 shares", "500 shares"],
        answer: 0,
      },
      {
        q: "After a 50% loss, what gain do you need just to break even?",
        options: ["50%", "75%", "100%"],
        answer: 2,
      },
    ],
  },
  {
    id: "compounding",
    title: "Compounding & the long game",
    level: "advanced",
    body: [
      "Compounding is the engine behind nearly every great fortune built in markets, and it's almost absurdly simple: you earn returns, then you earn returns on those returns, then returns on that larger pile, and so on. Each year's growth builds on a bigger base than the year before, so the gains don't add up — they accelerate.",
      "A handy mental shortcut is the Rule of 72: divide 72 by your annual return rate to estimate how many years it takes your money to double. At 10% a year, 72 ÷ 10 ≈ 7 years to double. At 8%, about 9 years. It's an approximation, not a promise, but it makes the power vivid: at ~10%, $10,000 becomes roughly $20k in 7 years, $40k in 14, $80k in 21, $160k in 28. The curve barely moves early, then bends sharply upward — most of the magic happens in the later years, which is why starting early and staying in matters so much.",
      "This is the case for 'time in the market beats timing the market.' The investor who stays put for decades, letting compounding run, usually ends up far ahead of the one who hops in and out trying to catch every move — because every exit risks missing the handful of big up-days that drive most long-term returns, and because jumping around interrupts the compounding itself.",
      "Two silent enemies eat compounding alive: costs and taxes. Every trade can incur fees and the spread, and selling a winner often triggers a tax bill that shrinks the base that would have kept compounding. Frequent trading doesn't just risk worse decisions — it quietly drains the very engine that builds wealth. The boring strategy of buying quality and holding is, more often than not, the winning one.",
    ],
    example: {
      title: "Worked example: compounding vs. simple growth",
      lines: [
        "Start with $10,000 earning 10% per year, reinvested.",
        "Year 1: +$1,000 → $11,000. Year 2: +$1,100 (10% of the new total) → $12,100. Year 3: +$1,210 → $13,310.",
        "Notice each year's gain is bigger than the last, even though the rate never changed — that's compounding.",
        "After 30 years at 10%, $10,000 grows to about $174,000.",
        "If instead you earned a flat $1,000 every year (no compounding), 30 years gives just $40,000. Same starting point, same rate — the difference is letting gains build on gains.",
      ],
    },
    mistakes: [
      "Cashing out gains frequently 'to be safe,' which resets the compounding base and often triggers taxes.",
      "Underestimating how much fees and frequent trading costs drag down decades of growth — small percentages compound against you too.",
      "Waiting for the 'perfect' time to start. Time in the market is the scarcest ingredient; a mediocre start beats a delayed one.",
      "Chasing a higher return by taking reckless risk — a single large loss can undo years of compounding in one stroke.",
    ],
    tryThis: "This is a long-game idea, so use the Challenge tab to feel the discipline side of it: aim for the 'Big League' goal (reach $12,500) using as few trades as possible. Resisting the urge to constantly buy and sell — and letting a good position simply run — is exactly the behavior that lets compounding work in the real world.",
    quiz: [
      {
        q: "At roughly 10% per year, about how often does money double?",
        options: ["Every year", "Every 7 years", "Every 30 years"],
        answer: 1,
      },
      {
        q: "Using the Rule of 72, an 8% annual return doubles your money in about...",
        options: ["3 years", "9 years", "20 years"],
        answer: 1,
      },
      {
        q: "Why does frequent trading often hurt long-term compounding?",
        options: ["It's against the rules", "Costs and taxes shrink the base that compounds", "Markets punish active investors on purpose"],
        answer: 1,
      },
    ],
  },
];

/* ---------- challenges ----------
   Each challenge derives pass/fail purely from live account state so it
   tracks automatically. `check` returns { done, progress (0..1), label }.   */
const CHALLENGES = [
  {
    id: "first-profit",
    title: "First Profit",
    desc: "Grow your account to $10,500 — your first 5% gain.",
    icon: "🌱",
    target: 10500,
    check: ({ netWorth }) => ({
      done: netWorth >= 10500,
      progress: Math.min(1, (netWorth - STARTING_CASH) / 500),
      label: `${fmt(netWorth)} / ${fmt(10500)}`,
    }),
  },
  {
    id: "double-digits",
    title: "Double Digits",
    desc: "Reach $11,000 (a 10% return) in 15 trades or fewer.",
    icon: "📈",
    target: 11000,
    check: ({ netWorth, orderCount }) => ({
      done: netWorth >= 11000 && orderCount <= 15,
      failed: netWorth < 11000 && orderCount > 15,
      progress: Math.min(1, (netWorth - STARTING_CASH) / 1000),
      label: `${fmt(netWorth)} / ${fmt(11000)} · ${orderCount}/15 trades`,
    }),
  },
  {
    id: "steady-hand",
    title: "Steady Hand",
    desc: "Reach $11,000 without your net worth ever dropping below $9,500.",
    icon: "🧘",
    target: 11000,
    check: ({ netWorth, lowestNW }) => ({
      done: netWorth >= 11000 && lowestNW >= 9500,
      failed: lowestNW < 9500,
      progress: Math.min(1, (netWorth - STARTING_CASH) / 1000),
      label: lowestNW < 9500
        ? `Dipped to ${fmt(lowestNW)} — floor broken`
        : `${fmt(netWorth)} / ${fmt(11000)} · low ${fmt(lowestNW)}`,
    }),
  },
  {
    id: "big-league",
    title: "Big League",
    desc: "Build your account to $12,500 — a 25% return.",
    icon: "🏆",
    target: 12500,
    check: ({ netWorth }) => ({
      done: netWorth >= 12500,
      progress: Math.min(1, (netWorth - STARTING_CASH) / 2500),
      label: `${fmt(netWorth)} / ${fmt(12500)}`,
    }),
  },
];

/* ---------- price engine ---------- */
function nextPrice(prev, vol, drift) {
  const shock = (Math.random() - 0.5) * 2; // -1..1
  const change = drift + vol * shock;
  const p = prev * (1 + change);
  return Math.max(0.5, +p.toFixed(2));
}

const fmt = (n) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

/* ---------- persistence (localStorage) ----------
   Saves progress on the user's own device. Wrapped in try/catch so it
   degrades silently where storage is unavailable (e.g. artifact preview). */
const SAVE_KEY = "paperdesk_save_v1";

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSave(data) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable — skip silently */
  }
}

function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* no-op */
  }
}

/* read once at module load so initializers can use it */
const SAVED = typeof window !== "undefined" ? loadSave() : null;

export default function App() {
  const [tab, setTab] = useState("trade");

  /* market state */
  const [prices, setPrices] = useState(() =>
    SAVED?.prices || Object.fromEntries(TICKERS.map((t) => [t.sym, t.start]))
  );
  const [history, setHistory] = useState(() =>
    SAVED?.history || Object.fromEntries(TICKERS.map((t) => [t.sym, [{ t: 0, p: t.start }]]))
  );
  const [tick, setTick] = useState(SAVED?.tick || 0);
  const [running, setRunning] = useState(true);
  const [selected, setSelected] = useState(TICKERS[0].sym);

  /* account state */
  const [cash, setCash] = useState(SAVED?.cash ?? STARTING_CASH);
  const [holdings, setHoldings] = useState(SAVED?.holdings || {}); // sym -> {shares, avgCost}
  const [orders, setOrders] = useState(SAVED?.orders || []);
  const [qty, setQty] = useState(1);
  const [nwHistory, setNwHistory] = useState(SAVED?.nwHistory || [{ t: 0, v: STARTING_CASH }]);

  /* lessons */
  const [openLesson, setOpenLesson] = useState(null);
  const [completed, setCompleted] = useState(SAVED?.completed || {});
  const [quizPicks, setQuizPicks] = useState({}); // qIndex -> optionIndex
  const [quizChecked, setQuizChecked] = useState(false);

  /* challenges */
  const [challengeDone, setChallengeDone] = useState(SAVED?.challengeDone || {}); // id -> true (latched)
  const [challengeFailed, setChallengeFailed] = useState(SAVED?.challengeFailed || {}); // id -> true (latched)
  const [celebrate, setCelebrate] = useState(null); // id of just-completed challenge

  /* intro / welcome gate — skip if returning with saved progress */
  const [showIntro, setShowIntro] = useState(!SAVED);

  /* persist progress to this device whenever saved state changes */
  useEffect(() => {
    writeSave({
      prices, history, tick, cash, holdings, orders, nwHistory,
      completed, challengeDone, challengeFailed,
    });
  }, [prices, history, tick, cash, holdings, orders, nwHistory,
      completed, challengeDone, challengeFailed]);

  /* advance the simulated market */
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setTick((tk) => tk + 1);
      setPrices((prev) => {
        const next = { ...prev };
        TICKERS.forEach((t) => {
          next[t.sym] = nextPrice(prev[t.sym], t.vol, t.drift);
        });
        setHistory((h) => {
          const nh = { ...h };
          TICKERS.forEach((t) => {
            const arr = [...nh[t.sym], { t: nh[t.sym].length, p: next[t.sym] }];
            if (arr.length > 80) arr.shift();
            nh[t.sym] = arr;
          });
          return nh;
        });
        return next;
      });
    }, 1200);
    return () => clearInterval(id);
  }, [running]);

  const holdingsValue = Object.entries(holdings).reduce(
    (sum, [sym, h]) => sum + h.shares * prices[sym], 0
  );
  const netWorth = cash + holdingsValue;
  const totalPL = netWorth - STARTING_CASH;
  const orderCount = orders.length;
  const lowestNW = nwHistory.reduce((m, p) => Math.min(m, p.v), netWorth);

  /* record net worth as the market advances */
  useEffect(() => {
    if (tick === 0) return;
    setNwHistory((prev) => {
      const arr = [...prev, { t: tick, v: +netWorth.toFixed(2) }];
      if (arr.length > 200) arr.shift();
      return arr;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  /* evaluate challenges whenever relevant state changes */
  useEffect(() => {
    const ctx = { netWorth, orderCount, lowestNW };
    CHALLENGES.forEach((c) => {
      const r = c.check(ctx);
      if (r.done && !challengeDone[c.id]) {
        setChallengeDone((d) => ({ ...d, [c.id]: true }));
        setCelebrate(c.id);
      }
      if (r.failed && !challengeFailed[c.id] && !challengeDone[c.id]) {
        setChallengeFailed((f) => ({ ...f, [c.id]: true }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [netWorth, orderCount, lowestNW]);

  const buy = useCallback(() => {
    const price = prices[selected];
    const cost = price * qty;
    if (qty <= 0 || cost > cash) return;
    setCash((c) => c - cost);
    setHoldings((h) => {
      const cur = h[selected] || { shares: 0, avgCost: 0 };
      const newShares = cur.shares + qty;
      const newAvg = (cur.avgCost * cur.shares + cost) / newShares;
      return { ...h, [selected]: { shares: newShares, avgCost: newAvg } };
    });
    setOrders((o) => [
      { id: Date.now(), side: "BUY", sym: selected, qty, price, t: tick }, ...o,
    ]);
  }, [prices, selected, qty, cash, tick]);

  const sell = useCallback(() => {
    const cur = holdings[selected];
    if (!cur || qty <= 0 || qty > cur.shares) return;
    const price = prices[selected];
    const proceeds = price * qty;
    setCash((c) => c + proceeds);
    setHoldings((h) => {
      const remaining = cur.shares - qty;
      const nh = { ...h };
      if (remaining <= 0) delete nh[selected];
      else nh[selected] = { ...cur, shares: remaining };
      return nh;
    });
    setOrders((o) => [
      { id: Date.now(), side: "SELL", sym: selected, qty, price, t: tick }, ...o,
    ]);
  }, [holdings, selected, qty, prices, tick]);

  const reset = () => {
    setCash(STARTING_CASH);
    setHoldings({});
    setOrders([]);
    setNwHistory([{ t: 0, v: STARTING_CASH }]);
    setPrices(Object.fromEntries(TICKERS.map((t) => [t.sym, t.start])));
    setHistory(Object.fromEntries(TICKERS.map((t) => [t.sym, [{ t: 0, p: t.start }]])));
    setTick(0);
    setChallengeFailed({}); // give a clean shot at challenges again; earned trophies stay
  };

  const resetEverything = () => {
    const ok = typeof window === "undefined" ||
      window.confirm("Erase ALL saved progress — portfolio, orders, completed lessons, and earned trophies — and start completely fresh? This can't be undone.");
    if (!ok) return;
    clearSave();
    reset();                 // wipes account, orders, prices, failed flags
    setCompleted({});        // wipe lesson progress
    setChallengeDone({});    // wipe earned trophies
    setOpenLesson(null);
    setQuizPicks({});
    setQuizChecked(false);
  };

  const curMeta = TICKERS.find((t) => t.sym === selected);
  const curHist = history[selected];
  const firstP = curHist[0].p;
  const curP = prices[selected];
  const dayChange = ((curP - firstP) / firstP) * 100;
  const curHolding = holdings[selected];

  const submitQuiz = () => {
    if (!openLesson) return;
    const qs = openLesson.quiz;
    if (Object.keys(quizPicks).length < qs.length) return; // require all answered
    setQuizChecked(true);
    const allCorrect = qs.every((q, i) => quizPicks[i] === q.answer);
    if (allCorrect) setCompleted((c) => ({ ...c, [openLesson.id]: true }));
  };

  const retryQuiz = () => {
    setQuizPicks({});
    setQuizChecked(false);
  };

  const openLessonReset = (l) => {
    setOpenLesson(l);
    setQuizPicks({});
    setQuizChecked(false);
  };

  /* ---------- Intro / welcome screen ---------- */
  if (showIntro) {
    return (
      <div style={S.root}>
        <style>{CSS}</style>
        <div style={S.introWrap}>
          <div style={S.introCard}>
            <h1 style={S.introLogo}>
              PAPER<span style={{ color: "var(--accent)" }}>DESK</span>
            </h1>
            <p style={S.introTagline}>learn · simulate · trade — with zero real risk</p>

            <p style={S.introLead}>
              A hands-on sandbox for learning how trading and investing work,
              using $10,000 of pretend money. Practice buying and selling,
              work through bite-sized lessons, and take on challenges —
              all without risking a single real cent.
            </p>

            <div style={S.introFeatures}>
              <div style={S.introFeature}>
                <BarChart3 size={18} color="var(--accent)" />
                <div>
                  <div style={S.introFeatureTitle}>Trade</div>
                  <div style={S.introFeatureDesc}>Buy & sell simulated stocks with live-moving prices.</div>
                </div>
              </div>
              <div style={S.introFeature}>
                <BookOpen size={18} color="var(--accent)" />
                <div>
                  <div style={S.introFeatureTitle}>Learn</div>
                  <div style={S.introFeatureDesc}>Eight lessons with worked examples and quizzes.</div>
                </div>
              </div>
              <div style={S.introFeature}>
                <Target size={18} color="var(--accent)" />
                <div>
                  <div style={S.introFeatureTitle}>Challenge</div>
                  <div style={S.introFeatureDesc}>Hit goals that track your progress automatically.</div>
                </div>
              </div>
            </div>

            <div style={S.introNotice}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                <b>Your progress is saved on this device.</b> Your portfolio,
                lessons, and challenges are remembered in this browser, so you can
                pick up where you left off. They won't follow you to a different
                device or browser, and clearing your browser data will erase them.
                There's a "Reset all" button inside if you'd like a fresh start.
              </span>
            </div>

            <button style={S.introBtn} onClick={() => setShowIntro(false)}>
              Enter the trading floor →
            </button>

            <p style={S.introFinePrint}>
              Educational simulation only. Prices are randomly generated and don't
              represent any real security. Nothing here is financial advice.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.root}>
      <style>{CSS}</style>

      {/* ---------- Header ---------- */}
      <header style={S.header}>
        <div>
          <h1 style={S.logo}>
            PAPER<span style={{ color: "var(--accent)" }}>DESK</span>
          </h1>
          <p style={S.tagline}>learn · simulate · trade — with zero real risk</p>
        </div>
        <div style={S.networthBox}>
          <span style={S.nwLabel}>NET WORTH</span>
          <span style={S.nwValue}>{fmt(netWorth)}</span>
          <span style={{ ...S.nwPL, color: totalPL >= 0 ? "var(--up)" : "var(--down)" }}>
            {totalPL >= 0 ? "▲" : "▼"} {fmt(Math.abs(totalPL))} (
            {((totalPL / STARTING_CASH) * 100).toFixed(2)}%)
          </span>
        </div>
      </header>

      {/* ---------- Tabs ---------- */}
      <nav style={S.tabs}>
        <Tab id="trade" tab={tab} setTab={setTab} icon={<BarChart3 size={16} />} label="Trade" />
        <Tab id="portfolio" tab={tab} setTab={setTab} icon={<Wallet size={16} />} label="Portfolio" />
        <Tab id="learn" tab={tab} setTab={setTab} icon={<BookOpen size={16} />} label="Learn" />
        <Tab id="challenge" tab={tab} setTab={setTab} icon={<Target size={16} />} label="Challenges" />
        <div style={{ flex: 1 }} />
        <button style={S.simBtn} onClick={() => setRunning((r) => !r)}>
          {running ? <Pause size={14} /> : <Play size={14} />}
          {running ? "Pause market" : "Resume"}
        </button>
        <button style={S.resetBtn} onClick={reset} title="Reset your account, but keep completed lessons and earned trophies">
          <RotateCcw size={14} /> Reset trades
        </button>
        <button style={S.resetAllBtn} onClick={resetEverything} title="Erase everything, including lessons and trophies">
          <Trash2 size={14} /> Reset all
        </button>
      </nav>

      {/* ====================== TRADE ====================== */}
      {tab === "trade" && (
        <div style={S.tradeGrid}>
          {/* ticker list */}
          <div style={S.tickerList}>
            {TICKERS.map((t) => {
              const p = prices[t.sym];
              const h = history[t.sym];
              const ch = ((p - h[0].p) / h[0].p) * 100;
              const active = selected === t.sym;
              return (
                <button
                  key={t.sym}
                  onClick={() => setSelected(t.sym)}
                  style={{ ...S.tickerRow, ...(active ? S.tickerActive : {}) }}
                >
                  <div>
                    <div style={S.tickerSym}>{t.sym}</div>
                    <div style={S.tickerName}>{t.name}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={S.tickerPrice}>{fmt(p)}</div>
                    <div style={{ fontSize: 11, color: ch >= 0 ? "var(--up)" : "var(--down)" }}>
                      {ch >= 0 ? "+" : ""}{ch.toFixed(2)}%
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* chart + ticket */}
          <div style={S.chartCol}>
            <div style={S.chartHead}>
              <div>
                <div style={S.chartSym}>
                  {curMeta.sym}
                  <span style={S.chartFull}>{curMeta.name}</span>
                </div>
                <div style={S.chartPriceRow}>
                  <span style={S.chartPrice}>{fmt(curP)}</span>
                  <span style={{
                    ...S.chartChange,
                    color: dayChange >= 0 ? "var(--up)" : "var(--down)",
                    background: dayChange >= 0 ? "rgba(52,211,153,.12)" : "rgba(248,113,113,.12)",
                  }}>
                    {dayChange >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                    {dayChange >= 0 ? "+" : ""}{dayChange.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            <div style={{ width: "100%", height: 230 }}>
              <ResponsiveContainer>
                <LineChart data={curHist} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <XAxis dataKey="t" hide />
                  <YAxis domain={["dataMin", "dataMax"]} tick={{ fill: "#5f6f63", fontSize: 11 }}
                    width={54} tickFormatter={(v) => "$" + v.toFixed(0)} />
                  <Tooltip
                    contentStyle={{ background: "#0e120e", border: "1px solid #2c3a2e", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ display: "none" }}
                    formatter={(v) => [fmt(v), "Price"]}
                  />
                  {curHolding && (
                    <ReferenceLine y={curHolding.avgCost} stroke="var(--gold)"
                      strokeDasharray="4 4"
                      label={{ value: "your cost", fill: "var(--gold)", fontSize: 10, position: "insideTopLeft" }} />
                  )}
                  <Line type="monotone" dataKey="p" stroke={dayChange >= 0 ? "var(--up)" : "var(--down)"}
                    strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* order ticket */}
            <div style={S.ticket}>
              <div style={S.ticketRow}>
                <label style={S.ticketLabel}>Shares</label>
                <div style={S.qtyBox}>
                  <button style={S.qtyBtn} onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                  <input
                    style={S.qtyInput}
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                  <button style={S.qtyBtn} onClick={() => setQty((q) => q + 1)}>+</button>
                </div>
                <div style={S.estCost}>
                  est. {fmt(curP * qty)}
                </div>
              </div>
              <div style={S.btnRow}>
                <button
                  style={{ ...S.buyBtn, opacity: curP * qty > cash ? 0.4 : 1 }}
                  onClick={buy}
                  disabled={curP * qty > cash}
                >
                  Buy {qty}
                </button>
                <button
                  style={{ ...S.sellBtn, opacity: !curHolding || qty > curHolding.shares ? 0.4 : 1 }}
                  onClick={sell}
                  disabled={!curHolding || qty > curHolding.shares}
                >
                  Sell {qty}
                </button>
              </div>
              <div style={S.ticketFoot}>
                <span>Buying power: <b style={{ color: "var(--fg)" }}>{fmt(cash)}</b></span>
                {curHolding && (
                  <span>You own <b style={{ color: "var(--fg)" }}>{curHolding.shares}</b> @ {fmt(curHolding.avgCost)} avg</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================== PORTFOLIO ====================== */}
      {tab === "portfolio" && (
        <div style={S.panel}>
          <div style={S.statRow}>
            <Stat label="Cash" value={fmt(cash)} />
            <Stat label="Holdings value" value={fmt(holdingsValue)} />
            <Stat label="Net worth" value={fmt(netWorth)} />
            <Stat label="Total P/L" value={fmt(totalPL)}
              color={totalPL >= 0 ? "var(--up)" : "var(--down)"} />
          </div>

          <h3 style={S.sectionH}>Performance</h3>
          {nwHistory.length < 2 ? (
            <p style={S.empty}>Your net-worth curve will appear here as the market moves.</p>
          ) : (
            <div style={{ width: "100%", height: 200, marginTop: 4 }}>
              <ResponsiveContainer>
                <AreaChart data={nwHistory} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
                  <defs>
                    <linearGradient id="nwFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={totalPL >= 0 ? "var(--up)" : "var(--down)"} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={totalPL >= 0 ? "var(--up)" : "var(--down)"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="t" hide />
                  <YAxis domain={["dataMin", "dataMax"]} tick={{ fill: "#5f6f63", fontSize: 11 }}
                    width={62} tickFormatter={(v) => "$" + (v / 1000).toFixed(1) + "k"} />
                  <Tooltip
                    contentStyle={{ background: "#0e120e", border: "1px solid #2c3a2e", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ display: "none" }}
                    formatter={(v) => [fmt(v), "Net worth"]}
                  />
                  <ReferenceLine y={STARTING_CASH} stroke="#5f6f63" strokeDasharray="4 4"
                    label={{ value: "start", fill: "#5f6f63", fontSize: 10, position: "insideTopLeft" }} />
                  <Area type="monotone" dataKey="v" stroke={totalPL >= 0 ? "var(--up)" : "var(--down)"}
                    strokeWidth={2} fill="url(#nwFill)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <h3 style={S.sectionH}>Holdings</h3>
          {Object.keys(holdings).length === 0 ? (
            <p style={S.empty}>No positions yet. Head to the Trade tab to buy your first shares.</p>
          ) : (
            <div style={S.table}>
              <div style={{ ...S.trHead }}>
                <span>Symbol</span><span>Shares</span><span>Avg cost</span>
                <span>Price</span><span>Value</span><span>P/L</span>
              </div>
              {Object.entries(holdings).map(([sym, h]) => {
                const val = h.shares * prices[sym];
                const pl = val - h.shares * h.avgCost;
                return (
                  <div key={sym} style={S.tr}>
                    <span style={{ fontWeight: 700 }}>{sym}</span>
                    <span>{h.shares}</span>
                    <span>{fmt(h.avgCost)}</span>
                    <span>{fmt(prices[sym])}</span>
                    <span>{fmt(val)}</span>
                    <span style={{ color: pl >= 0 ? "var(--up)" : "var(--down)" }}>
                      {pl >= 0 ? "+" : ""}{fmt(pl)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <h3 style={S.sectionH}>Order history</h3>
          {orders.length === 0 ? (
            <p style={S.empty}>No orders placed yet.</p>
          ) : (
            <div style={S.orderList}>
              {orders.map((o) => (
                <div key={o.id} style={S.orderRow}>
                  <span style={{
                    ...S.sideTag,
                    color: o.side === "BUY" ? "var(--up)" : "var(--down)",
                    borderColor: o.side === "BUY" ? "var(--up)" : "var(--down)",
                  }}>{o.side}</span>
                  <span style={{ fontWeight: 700 }}>{o.sym}</span>
                  <span>{o.qty} sh</span>
                  <span>@ {fmt(o.price)}</span>
                  <span style={{ color: "var(--muted)" }}>{fmt(o.qty * o.price)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ====================== LEARN ====================== */}
      {tab === "learn" && (
        <div style={S.panel}>
          {!openLesson ? (
            <>
              <div style={S.learnIntro}>
                <h2 style={S.learnTitle}>Trading 101</h2>
                <p style={S.learnSub}>
                  Four short lessons. Each ends with a one-question check.
                  Finish a lesson, then practice the idea live in the Trade tab.
                </p>
                <div style={S.progressWrap}>
                  <div style={{
                    ...S.progressFill,
                    width: `${(Object.keys(completed).length / LESSONS.length) * 100}%`,
                  }} />
                </div>
                <span style={S.progressTxt}>
                  {Object.keys(completed).length} / {LESSONS.length} completed
                </span>
              </div>
              <div style={S.lessonGrid}>
                {LESSONS.map((l, i) => (
                  <button key={l.id} style={S.lessonCard}
                    onClick={() => openLessonReset(l)}>
                    <div style={S.lessonNum}>{String(i + 1).padStart(2, "0")}</div>
                    <div style={{ flex: 1 }}>
                      <div style={S.lessonCardTitle}>
                        {l.title}
                        {l.level === "advanced" && <span style={S.advBadge}>ADVANCED</span>}
                      </div>
                      <div style={S.lessonCardMeta}>
                        {completed[l.id]
                          ? <span style={{ color: "var(--up)" }}><Check size={12} /> completed</span>
                          : <span style={{ color: "var(--muted)" }}>{l.body.length + 2} min read · {l.quiz.length} questions</span>}
                      </div>
                    </div>
                    <ChevronRight size={18} color="#5f6f63" />
                  </button>
                ))}
              </div>
              <div style={S.disclaimer}>
                <AlertTriangle size={15} />
                <span>
                  Educational simulation only. Prices here are randomly generated and
                  do not reflect any real security. This is not financial advice — when
                  you invest real money, consider consulting a licensed professional.
                </span>
              </div>
            </>
          ) : (
            <div style={S.reader}>
              <button style={S.backBtn} onClick={() => setOpenLesson(null)}>← All lessons</button>
              <h2 style={S.readerTitle}>
                {openLesson.title}
                {openLesson.level === "advanced" && <span style={S.advBadge}>ADVANCED</span>}
              </h2>

              {openLesson.body.map((p, i) => (
                <p key={i} style={S.readerP}>{p}</p>
              ))}

              {/* worked example */}
              {openLesson.example && (
                <div style={S.exampleBox}>
                  <div style={S.exampleHead}>
                    <Calculator size={15} /> {openLesson.example.title}
                  </div>
                  {openLesson.example.lines.map((ln, i) => (
                    <div key={i} style={S.exampleLine}>
                      <span style={S.exampleDot}>{i + 1}</span>
                      <span>{ln}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* common mistakes */}
              {openLesson.mistakes && (
                <div style={S.mistakeBox}>
                  <div style={S.mistakeHead}>
                    <AlertTriangle size={15} /> Common mistakes to avoid
                  </div>
                  {openLesson.mistakes.map((m, i) => (
                    <div key={i} style={S.mistakeLine}>
                      <X size={14} color="var(--down)" style={{ flexShrink: 0, marginTop: 3 }} />
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* try this in the simulator */}
              {openLesson.tryThis && (
                <div style={S.tryBox}>
                  <div style={S.tryHead}>
                    <Target size={15} /> Try this in the simulator
                  </div>
                  <p style={S.tryText}>{openLesson.tryThis}</p>
                </div>
              )}

              {/* quiz — multiple questions */}
              <div style={S.quizBox}>
                <div style={S.quizHeader}>
                  Quick check · {openLesson.quiz.length} questions
                </div>
                {openLesson.quiz.map((qq, qi) => (
                  <div key={qi} style={{ marginBottom: 18 }}>
                    <div style={S.quizQ}>{qi + 1}. {qq.q}</div>
                    {qq.options.map((opt, oi) => {
                      const picked = quizPicks[qi] === oi;
                      const isAnswer = oi === qq.answer;
                      let bg = "transparent", bd = "#2c3a2e";
                      if (quizChecked) {
                        if (isAnswer) { bg = "rgba(52,211,153,.12)"; bd = "var(--up)"; }
                        else if (picked) { bg = "rgba(248,113,113,.12)"; bd = "var(--down)"; }
                      } else if (picked) { bd = "var(--accent)"; }
                      return (
                        <button key={oi} style={{ ...S.quizOpt, background: bg, borderColor: bd }}
                          onClick={() => !quizChecked && setQuizPicks((p) => ({ ...p, [qi]: oi }))}>
                          <span>{opt}</span>
                          {quizChecked && isAnswer && <Check size={16} color="var(--up)" />}
                          {quizChecked && picked && !isAnswer && <X size={16} color="var(--down)" />}
                        </button>
                      );
                    })}
                  </div>
                ))}

                {!quizChecked ? (
                  <button
                    style={{ ...S.checkBtn, opacity: Object.keys(quizPicks).length < openLesson.quiz.length ? 0.4 : 1 }}
                    onClick={submitQuiz}
                    disabled={Object.keys(quizPicks).length < openLesson.quiz.length}>
                    Check answers
                  </button>
                ) : (() => {
                  const correctCount = openLesson.quiz.filter((q, i) => quizPicks[i] === q.answer).length;
                  const all = correctCount === openLesson.quiz.length;
                  return (
                    <div>
                      <div style={{ ...S.quizFeedback, color: all ? "var(--up)" : "var(--gold)" }}>
                        {all
                          ? <><Award size={16} /> Perfect — {correctCount}/{openLesson.quiz.length}. Lesson complete!</>
                          : <><AlertTriangle size={16} /> {correctCount}/{openLesson.quiz.length} correct. Review the misses and try again to complete it.</>}
                      </div>
                      <button style={{ ...S.checkBtn, marginTop: 12, background: "transparent", color: "var(--accent)", border: "1px solid var(--accent)" }}
                        onClick={retryQuiz}>
                        {all ? "Retake quiz" : "Try again"}
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================== CHALLENGES ====================== */}
      {tab === "challenge" && (
        <div style={S.panel}>
          <div style={S.learnIntro}>
            <h2 style={S.learnTitle}>Challenge mode</h2>
            <p style={S.learnSub}>
              Goals that track automatically as you trade. They get harder as you
              go — and some add constraints, like a trade limit or a net-worth floor.
              Earned trophies stay even after you reset your account.
            </p>
            <div style={S.progressWrap}>
              <div style={{
                ...S.progressFill,
                width: `${(Object.keys(challengeDone).length / CHALLENGES.length) * 100}%`,
              }} />
            </div>
            <span style={S.progressTxt}>
              {Object.keys(challengeDone).length} / {CHALLENGES.length} trophies earned
            </span>
          </div>

          <div style={S.lessonGrid}>
            {CHALLENGES.map((c) => {
              const r = c.check({ netWorth, orderCount, lowestNW });
              const done = !!challengeDone[c.id];
              const failed = !done && !!challengeFailed[c.id];
              const pct = Math.round((done ? 1 : r.progress) * 100);
              return (
                <div key={c.id} style={{
                  ...S.challengeCard,
                  borderColor: done ? "var(--up)" : failed ? "rgba(248,113,113,.4)" : "#1c241d",
                }}>
                  <div style={{
                    ...S.challengeIcon,
                    filter: failed ? "grayscale(1) opacity(.5)" : "none",
                  }}>{done ? "🏆" : c.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={S.challengeTitle}>
                      {c.title}
                      {done && <span style={{ ...S.challengeTag, color: "var(--up)", borderColor: "var(--up)" }}><Check size={11} /> done</span>}
                      {failed && <span style={{ ...S.challengeTag, color: "var(--down)", borderColor: "var(--down)" }}>missed — reset to retry</span>}
                    </div>
                    <div style={S.challengeDesc}>{c.desc}</div>
                    <div style={S.challengeBarWrap}>
                      <div style={{
                        ...S.challengeBarFill,
                        width: `${pct}%`,
                        background: done ? "var(--up)" : failed ? "var(--down)" : "linear-gradient(90deg,var(--accent),var(--gold))",
                      }} />
                    </div>
                    <div style={S.challengeStat}>{done ? "Complete!" : r.label}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={S.disclaimer}>
            <AlertTriangle size={15} />
            <span>
              These goals are practice targets in a random simulation — hitting them
              proves you can execute a plan, not that a strategy will work in real
              markets. Real investing has no reset button.
            </span>
          </div>
        </div>
      )}

      {/* ---------- celebration overlay ---------- */}
      {celebrate && (
        <div style={S.celebrateOverlay} onClick={() => setCelebrate(null)}>
          <div style={S.celebrateCard} onClick={(e) => e.stopPropagation()}>
            <div style={S.celebrateTrophy}>🏆</div>
            <div style={S.celebrateKicker}>CHALLENGE COMPLETE</div>
            <h2 style={S.celebrateTitle}>
              {CHALLENGES.find((c) => c.id === celebrate)?.title}
            </h2>
            <p style={S.celebrateDesc}>
              {CHALLENGES.find((c) => c.id === celebrate)?.desc}
            </p>
            <button style={S.celebrateBtn} onClick={() => setCelebrate(null)}>
              Keep trading
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- small components ---------- */
function Tab({ id, tab, setTab, icon, label }) {
  const active = tab === id;
  return (
    <button onClick={() => setTab(id)}
      style={{ ...S.tab, ...(active ? S.tabActive : {}) }}>
      {icon}{label}
    </button>
  );
}
function Stat({ label, value, color }) {
  return (
    <div style={S.statCard}>
      <span style={S.statLabel}>{label}</span>
      <span style={{ ...S.statValue, color: color || "var(--fg)" }}>{value}</span>
    </div>
  );
}

/* ---------- styles ---------- */
const S = {
  root: { fontFamily: "'DM Sans', system-ui, sans-serif", background: "var(--bg)", color: "var(--fg)", minHeight: "100%", padding: 20, maxWidth: 980, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 },
  logo: { fontFamily: "'Playfair Display', serif", fontSize: 30, margin: 0, letterSpacing: -0.5, fontWeight: 800 },
  tagline: { margin: "2px 0 0", color: "var(--muted)", fontSize: 13 },
  networthBox: { display: "flex", flexDirection: "column", alignItems: "flex-end" },
  nwLabel: { fontSize: 10, letterSpacing: 2, color: "var(--muted)" },
  nwValue: { fontSize: 26, fontWeight: 700, fontFamily: "'Playfair Display', serif" },
  nwPL: { fontSize: 13, fontWeight: 600 },
  tabs: { display: "flex", gap: 6, alignItems: "center", marginBottom: 18, flexWrap: "wrap" },
  tab: { display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "1px solid #2c3a2e", background: "transparent", color: "var(--muted)", borderRadius: 9, cursor: "pointer", fontSize: 14, fontWeight: 600 },
  tabActive: { background: "var(--card)", color: "var(--fg)", borderColor: "var(--accent)" },
  simBtn: { display: "flex", alignItems: "center", gap: 5, padding: "7px 11px", border: "1px solid #2c3a2e", background: "transparent", color: "var(--muted)", borderRadius: 8, cursor: "pointer", fontSize: 12.5 },
  resetBtn: { display: "flex", alignItems: "center", gap: 5, padding: "7px 11px", border: "1px solid #2c3a2e", background: "transparent", color: "var(--muted)", borderRadius: 8, cursor: "pointer", fontSize: 12.5 },
  resetAllBtn: { display: "flex", alignItems: "center", gap: 5, padding: "7px 11px", border: "1px solid rgba(248,113,113,.4)", background: "transparent", color: "var(--down)", borderRadius: 8, cursor: "pointer", fontSize: 12.5 },
  tradeGrid: { display: "grid", gridTemplateColumns: "260px 1fr", gap: 16 },
  tickerList: { display: "flex", flexDirection: "column", gap: 6 },
  tickerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 13px", border: "1px solid #1c241d", background: "var(--card)", borderRadius: 10, cursor: "pointer", textAlign: "left" },
  tickerActive: { borderColor: "var(--accent)", boxShadow: "0 0 0 1px var(--accent)" },
  tickerSym: { fontWeight: 700, fontSize: 15 },
  tickerName: { fontSize: 11, color: "var(--muted)" },
  tickerPrice: { fontWeight: 600, fontSize: 14 },
  chartCol: { background: "var(--card)", border: "1px solid #1c241d", borderRadius: 14, padding: 16 },
  chartHead: { marginBottom: 8 },
  chartSym: { fontSize: 22, fontWeight: 800, display: "flex", alignItems: "baseline", gap: 10 },
  chartFull: { fontSize: 13, fontWeight: 400, color: "var(--muted)" },
  chartPriceRow: { display: "flex", alignItems: "center", gap: 10, marginTop: 2 },
  chartPrice: { fontSize: 26, fontWeight: 700, fontFamily: "'Playfair Display', serif" },
  chartChange: { display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 600, padding: "3px 8px", borderRadius: 7 },
  ticket: { marginTop: 12, borderTop: "1px solid #1c241d", paddingTop: 14 },
  ticketRow: { display: "flex", alignItems: "center", gap: 14, marginBottom: 12 },
  ticketLabel: { fontSize: 13, color: "var(--muted)" },
  qtyBox: { display: "flex", alignItems: "center", border: "1px solid #2c3a2e", borderRadius: 9, overflow: "hidden" },
  qtyBtn: { width: 34, height: 36, border: "none", background: "transparent", color: "var(--fg)", fontSize: 18, cursor: "pointer" },
  qtyInput: { width: 56, height: 36, border: "none", borderLeft: "1px solid #2c3a2e", borderRight: "1px solid #2c3a2e", background: "transparent", color: "var(--fg)", textAlign: "center", fontSize: 15 },
  estCost: { fontSize: 13, color: "var(--muted)", marginLeft: "auto" },
  btnRow: { display: "flex", gap: 10 },
  buyBtn: { flex: 1, padding: "12px", border: "none", borderRadius: 10, background: "var(--up)", color: "#04130c", fontWeight: 700, fontSize: 15, cursor: "pointer" },
  sellBtn: { flex: 1, padding: "12px", border: "none", borderRadius: 10, background: "var(--down)", color: "#180404", fontWeight: 700, fontSize: 15, cursor: "pointer" },
  ticketFoot: { display: "flex", justifyContent: "space-between", marginTop: 11, fontSize: 12.5, color: "var(--muted)" },
  panel: { background: "var(--card)", border: "1px solid #1c241d", borderRadius: 14, padding: 20 },
  statRow: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 8 },
  statCard: { background: "var(--bg)", border: "1px solid #1c241d", borderRadius: 10, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 3 },
  statLabel: { fontSize: 11, color: "var(--muted)", letterSpacing: 0.5 },
  statValue: { fontSize: 19, fontWeight: 700 },
  sectionH: { fontFamily: "'Playfair Display', serif", fontSize: 19, margin: "22px 0 10px" },
  empty: { color: "var(--muted)", fontSize: 14 },
  table: { display: "flex", flexDirection: "column", gap: 2 },
  trHead: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr", fontSize: 11, color: "var(--muted)", padding: "6px 10px", letterSpacing: 0.5 },
  tr: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr", fontSize: 14, padding: "11px 10px", background: "var(--bg)", borderRadius: 8, alignItems: "center" },
  orderList: { display: "flex", flexDirection: "column", gap: 6 },
  orderRow: { display: "grid", gridTemplateColumns: "70px 70px 70px 1fr 1fr", alignItems: "center", fontSize: 13.5, padding: "9px 12px", background: "var(--bg)", borderRadius: 8 },
  sideTag: { fontSize: 11, fontWeight: 700, border: "1px solid", borderRadius: 6, padding: "2px 7px", width: "fit-content", letterSpacing: 0.5 },
  learnIntro: { marginBottom: 18 },
  learnTitle: { fontFamily: "'Playfair Display', serif", fontSize: 26, margin: "0 0 6px" },
  learnSub: { color: "var(--muted)", fontSize: 14, lineHeight: 1.6, maxWidth: 620, margin: 0 },
  progressWrap: { height: 6, background: "#1c241d", borderRadius: 4, marginTop: 16, overflow: "hidden" },
  progressFill: { height: "100%", background: "linear-gradient(90deg,var(--accent),var(--gold))", transition: "width .4s" },
  progressTxt: { fontSize: 12, color: "var(--muted)", marginTop: 6, display: "inline-block" },
  lessonGrid: { display: "flex", flexDirection: "column", gap: 8 },
  lessonCard: { display: "flex", alignItems: "center", gap: 16, padding: "15px 16px", background: "var(--bg)", border: "1px solid #1c241d", borderRadius: 11, cursor: "pointer", textAlign: "left" },
  lessonNum: { fontFamily: "'Playfair Display', serif", fontSize: 22, color: "var(--accent)", fontWeight: 700, width: 32 },
  lessonCardTitle: { fontSize: 15.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 10 },
  advBadge: { fontSize: 9.5, fontWeight: 700, letterSpacing: 0.8, color: "var(--gold)", border: "1px solid rgba(200,169,110,.4)", borderRadius: 5, padding: "2px 6px" },
  lessonCardMeta: { fontSize: 12, marginTop: 3, display: "flex", alignItems: "center", gap: 4 },
  disclaimer: { display: "flex", gap: 10, alignItems: "flex-start", marginTop: 22, padding: "13px 15px", background: "rgba(200,169,110,.07)", border: "1px solid rgba(200,169,110,.25)", borderRadius: 10, color: "var(--gold)", fontSize: 12.5, lineHeight: 1.55 },
  reader: { maxWidth: 640 },
  backBtn: { background: "transparent", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 13.5, padding: 0, marginBottom: 12 },
  readerTitle: { fontFamily: "'Playfair Display', serif", fontSize: 28, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  readerP: { fontSize: 15, lineHeight: 1.7, color: "#c9d3cb", margin: "0 0 14px" },

  exampleBox: { marginTop: 18, padding: "16px 18px", background: "rgba(109,170,109,.07)", border: "1px solid rgba(109,170,109,.3)", borderRadius: 12 },
  exampleHead: { display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 700, color: "var(--accent)", marginBottom: 12, letterSpacing: 0.3 },
  exampleLine: { display: "flex", gap: 11, alignItems: "flex-start", fontSize: 14, lineHeight: 1.55, color: "#cfe0d0", marginBottom: 9 },
  exampleDot: { flexShrink: 0, width: 20, height: 20, borderRadius: "50%", background: "rgba(109,170,109,.2)", color: "var(--accent)", fontSize: 11.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 },

  mistakeBox: { marginTop: 16, padding: "16px 18px", background: "rgba(248,113,113,.06)", border: "1px solid rgba(248,113,113,.25)", borderRadius: 12 },
  mistakeHead: { display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 700, color: "var(--down)", marginBottom: 12, letterSpacing: 0.3 },
  mistakeLine: { display: "flex", gap: 9, alignItems: "flex-start", fontSize: 14, lineHeight: 1.55, color: "#e3d2d2", marginBottom: 9 },

  tryBox: { marginTop: 16, padding: "16px 18px", background: "rgba(200,169,110,.07)", border: "1px solid rgba(200,169,110,.3)", borderRadius: 12 },
  tryHead: { display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 700, color: "var(--gold)", marginBottom: 8, letterSpacing: 0.3 },
  tryText: { fontSize: 14, lineHeight: 1.6, color: "#e4dcc9", margin: 0 },

  quizBox: { marginTop: 22, padding: 18, background: "var(--bg)", border: "1px solid #1c241d", borderRadius: 12 },
  quizHeader: { fontSize: 12, letterSpacing: 1, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #1c241d" },
  quizQ: { fontSize: 15, fontWeight: 600, marginBottom: 12, lineHeight: 1.45 },
  quizOpt: { display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "12px 14px", marginBottom: 8, border: "1px solid #2c3a2e", borderRadius: 9, background: "transparent", color: "var(--fg)", cursor: "pointer", fontSize: 14, textAlign: "left" },
  checkBtn: { marginTop: 6, padding: "11px 20px", border: "none", borderRadius: 9, background: "var(--accent)", color: "#04130c", fontWeight: 700, fontSize: 14, cursor: "pointer" },
  quizFeedback: { marginTop: 8, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 7 },

  challengeCard: { display: "flex", gap: 16, alignItems: "flex-start", padding: "16px 18px", background: "var(--bg)", border: "1px solid #1c241d", borderRadius: 12 },
  challengeIcon: { fontSize: 30, lineHeight: 1, width: 40, textAlign: "center" },
  challengeTitle: { fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" },
  challengeTag: { fontSize: 10, fontWeight: 700, letterSpacing: 0.5, border: "1px solid", borderRadius: 5, padding: "2px 7px", display: "inline-flex", alignItems: "center", gap: 3 },
  challengeDesc: { fontSize: 13, color: "var(--muted)", margin: "4px 0 10px", lineHeight: 1.5 },
  challengeBarWrap: { height: 7, background: "#1c241d", borderRadius: 4, overflow: "hidden" },
  challengeBarFill: { height: "100%", borderRadius: 4, transition: "width .4s" },
  challengeStat: { fontSize: 12, color: "var(--muted)", marginTop: 6 },

  celebrateOverlay: { position: "fixed", inset: 0, background: "rgba(6,9,6,.78)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 },
  celebrateCard: { background: "var(--card)", border: "1px solid var(--gold)", borderRadius: 18, padding: "34px 36px", textAlign: "center", maxWidth: 380, boxShadow: "0 20px 60px rgba(0,0,0,.5)", animation: "pop .4s cubic-bezier(.2,1.2,.4,1)" },
  celebrateTrophy: { fontSize: 56, animation: "float 2.4s ease-in-out infinite" },
  celebrateKicker: { fontSize: 11, letterSpacing: 3, color: "var(--gold)", fontWeight: 700, marginTop: 8 },
  celebrateTitle: { fontFamily: "'Playfair Display', serif", fontSize: 27, margin: "6px 0 8px" },
  celebrateDesc: { fontSize: 14, color: "var(--muted)", lineHeight: 1.55, margin: "0 0 22px" },
  celebrateBtn: { padding: "12px 26px", border: "none", borderRadius: 10, background: "linear-gradient(90deg,var(--accent),var(--gold))", color: "#04130c", fontWeight: 700, fontSize: 14.5, cursor: "pointer" },

  introWrap: { minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "30px 0" },
  introCard: { maxWidth: 540, width: "100%", background: "var(--card)", border: "1px solid #1c241d", borderRadius: 18, padding: "38px 36px", textAlign: "center" },
  introLogo: { fontFamily: "'Playfair Display', serif", fontSize: 42, margin: 0, letterSpacing: -0.5, fontWeight: 800 },
  introTagline: { margin: "4px 0 0", color: "var(--muted)", fontSize: 14 },
  introLead: { fontSize: 15, lineHeight: 1.65, color: "#c9d3cb", margin: "24px 0 0", textAlign: "left" },
  introFeatures: { display: "flex", flexDirection: "column", gap: 14, margin: "26px 0", textAlign: "left" },
  introFeature: { display: "flex", gap: 13, alignItems: "flex-start" },
  introFeatureTitle: { fontSize: 14.5, fontWeight: 700 },
  introFeatureDesc: { fontSize: 13, color: "var(--muted)", marginTop: 2, lineHeight: 1.5 },
  introNotice: { display: "flex", gap: 11, alignItems: "flex-start", textAlign: "left", padding: "14px 16px", background: "rgba(200,169,110,.08)", border: "1px solid rgba(200,169,110,.3)", borderRadius: 11, color: "var(--gold)", fontSize: 13, lineHeight: 1.55 },
  introBtn: { marginTop: 24, width: "100%", padding: "15px", border: "none", borderRadius: 11, background: "linear-gradient(90deg,var(--accent),var(--gold))", color: "#04130c", fontWeight: 700, fontSize: 16, cursor: "pointer" },
  introFinePrint: { fontSize: 11.5, color: "var(--muted)", lineHeight: 1.5, margin: "18px 0 0" },
};

const CSS = `
:root{
  --bg:#0e120e; --card:#141a14; --fg:#eef3ee; --muted:#7f8f83;
  --accent:#6daa6d; --gold:#c8a96e; --up:#34d399; --down:#f87171;
}
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;}
input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
button:hover{filter:brightness(1.08);}
@keyframes pop{0%{transform:scale(.8);opacity:0;}100%{transform:scale(1);opacity:1;}}
@keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-8px);}}
@media(max-width:760px){
  .tradeGrid{grid-template-columns:1fr !important;}
}
`;
