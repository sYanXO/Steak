export const statCards = [
  {
    title: "Starting wallet",
    value: "5000",
    detail: "Granted once at account creation."
  },
  {
    title: "Supported auth",
    value: "Email + Google",
    detail: "Auth.js with role-aware sessions."
  },
  {
    title: "Settlement mode",
    value: "Manual",
    detail: "Admin-triggered results with audit logs."
  }
];

export const marketCards = [
  {
    id: "mi-csk-winner",
    kicker: "Mumbai Indians vs Chennai Super Kings",
    title: "Match winner",
    closesAt: "19:25 IST",
    outcomes: [
      { label: "Mumbai Indians", odds: "1.82x", poolShare: "55% of pool", stake: "12.4k staked" },
      { label: "Chennai Super Kings", odds: "2.17x", poolShare: "45% of pool", stake: "10.1k staked" }
    ]
  },
  {
    id: "rcb-kkr-toss",
    kicker: "Royal Challengers Bengaluru vs Kolkata Knight Riders",
    title: "Toss winner",
    closesAt: "15:55 IST",
    outcomes: [
      { label: "RCB", odds: "1.96x", poolShare: "51% of pool", stake: "4.7k staked" },
      { label: "KKR", odds: "2.03x", poolShare: "49% of pool", stake: "4.5k staked" }
    ]
  }
];

export const walletEntries = [
  { id: "1", label: "Starter grant", delta: "+5000", time: "Account creation" },
  { id: "2", label: "Stake: MI match winner", delta: "-500", time: "Today, 11:15 UTC" },
  { id: "3", label: "Stake: RCB toss winner", delta: "-240", time: "Today, 12:05 UTC" }
];

export const leaderboardRows = [
  { rank: "#1", player: "Anika S", balance: "8,960", winRate: "67%" },
  { rank: "#2", player: "Rohit K", balance: "8,420", winRate: "61%" },
  { rank: "#3", player: "Meera J", balance: "8,120", winRate: "59%" },
  { rank: "#18", player: "You", balance: "4,260", winRate: "52%" }
];

export const adminQueue = [
  {
    id: "1",
    title: "Settle MI vs CSK match winner",
    detail: "14 open stakes awaiting official result.",
    status: "Ready"
  },
  {
    id: "2",
    title: "Review manual top-up request",
    detail: "Support note attached for user `captain@stakeipl.app`.",
    status: "Pending"
  },
  {
    id: "3",
    title: "Close RCB vs KKR toss market",
    detail: "Scheduled closure in 6 minutes.",
    status: "Scheduled"
  }
];
