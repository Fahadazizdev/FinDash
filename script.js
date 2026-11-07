const FIAT_URL = "https://open.er-api.com/v6/latest/USD";
const COINGECKO_URL = "https://api.coingecko.com/api/v3/coins/markets";
const BACKUP_URLS = [
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json",
  "https://latest.currency-api.pages.dev/v1/currencies/usd.min.json",
];
const GRAMS_PER_OUNCE = 31.1034768;
const UNIT_GRAMS = { g: 1, oz: GRAMS_PER_OUNCE, kg: 1000 };
const REFRESH_SECONDS = 60;

const SYMBOLS = {
  USD: "$", EUR: "€", GBP: "£", JPY: "¥", CNY: "¥",
  INR: "₹", KRW: "₩", TRY: "₺", RUB: "₽", ILS: "₪",
  PHP: "₱", VND: "₫", THB: "฿", NGN: "₦", UAH: "₴",
  KZT: "₸", AZN: "₼", GEL: "₾", BDT: "৳", PKR: "₨",
  IDR: "Rp", MYR: "RM", BRL: "R$", ZAR: "R", CHF: "CHF ",
  CAD: "C$", AUD: "A$", NZD: "NZ$", HKD: "HK$", SGD: "S$",
  MXN: "MX$", PLN: "zł", CZK: "Kč", SEK: "kr", NOK: "kr",
  DKK: "kr", HUF: "Ft", EGP: "E£",
  SAR: "ر.س", AED: "د.إ", KWD: "د.ك", QAR: "ر.ق",
  BHD: "د.ب", OMR: "ر.ع", JOD: "د.ا",
};

const SYMBOL_AFTER = ["SAR", "AED", "KWD", "QAR", "BHD", "OMR", "JOD",
  "PLN", "CZK", "SEK", "NOK", "DKK", "HUF"];

const METALS = [
  { code: "XAU", name: "Gold", arabic: "ذهب", key: "xau", badge: "Au", color: "gold" },
  { code: "XAG", name: "Silver", arabic: "فضة", key: "xag", badge: "Ag", color: "silver" },
  { code: "XPT", name: "Platinum", arabic: "بلاتين", key: "xpt", badge: "Pt", color: "platinum" },
];

const COINS = [
  { code: "BTC", name: "Bitcoin", arabic: "بيتكوين", id: "bitcoin" },
  { code: "ETH", name: "Ethereum", arabic: "إيثيريوم", id: "ethereum" },
  { code: "USDT", name: "Tether", arabic: "تيثر", id: "tether" },
  { code: "BNB", name: "BNB", arabic: "بينانس", id: "binancecoin" },
  { code: "SOL", name: "Solana", arabic: "سولانا", id: "solana" },
  { code: "XRP", name: "XRP", arabic: "ريبل", id: "ripple" },
  { code: "USDC", name: "USD Coin", arabic: "", id: "usd-coin" },
  { code: "DOGE", name: "Dogecoin", arabic: "دوجكوين", id: "dogecoin" },
  { code: "ADA", name: "Cardano", arabic: "كاردانو", id: "cardano" },
  { code: "TRX", name: "TRON", arabic: "ترون", id: "tron" },
  { code: "TON", name: "Toncoin", arabic: "تون", id: "the-open-network" },
  { code: "LTC", name: "Litecoin", arabic: "لايتكوين", id: "litecoin" },
];

const MARKET_CARDS = ["XAU", "XAG", "BTC", "ETH", "SOL", "XRP"];

const currencyNames = new Intl.DisplayNames(["en"], { type: "currency" });
const countryNames = new Intl.DisplayNames(["en"], { type: "region" });
const arabicCurrencyNames = new Intl.DisplayNames(["ar"], { type: "currency" });
const arabicCountryNames = new Intl.DisplayNames(["ar"], { type: "region" });

const homeView = document.getElementById("homeView");
const currencyView = document.getElementById("currencyView");
const cryptoView = document.getElementById("cryptoView");
const stocksView = document.getElementById("stocksView");
const topbar = document.getElementById("topbar");
const tabs = document.querySelectorAll(".tab");
const updatedText = document.getElementById("updated");

const amountInput = document.getElementById("amount");
const amountSymbol = document.getElementById("amountSymbol");
const swapButton = document.getElementById("swap");
const equalsText = document.getElementById("equals");
const resultText = document.getElementById("result");
const resultName = document.getElementById("resultName");
const ratesBox = document.getElementById("rates");
const rateLine = document.getElementById("rateLine");
const inverseLine = document.getElementById("inverseLine");
const copyButton = document.getElementById("copy");
const subtitle = document.getElementById("subtitle");

const assetAmount = document.getElementById("assetAmount");
const assetUnit = document.getElementById("assetUnit");
const unitChips = document.getElementById("unitChips");
const karatChips = document.getElementById("karatChips");
const assetEquals = document.getElementById("assetEquals");
const assetResult = document.getElementById("assetResult");
const assetResultName = document.getElementById("assetResultName");
const assetRates = document.getElementById("assetRates");
const assetPriceLine = document.getElementById("assetPriceLine");
const assetSecondLine = document.getElementById("assetSecondLine");
const marketGrid = document.getElementById("marketGrid");

let fiatRates = {};
let fiatLoaded = false;
let fiatUpdated = "";
let currencyItems = [];

let assets = {};
let assetOrder = [];
let marketUpdated = "";
let cryptoIsLive = false;
let marketLoaded = false;
let marketLoading = false;
let refreshTimer = null;

let selectedUnit = loadSaved("asset-unit", "g", UNIT_GRAMS);
let selectedKarat = Number(loadSaved("asset-karat", "24", { 24: 1, 22: 1, 21: 1, 18: 1 }));
let currentView = "home";


function safeName(names, key) {
  try {
    const name = names.of(key);
    return name === key ? "" : name;
  } catch (error) {
    return "";
  }
}

function countryCode(code) {
  if (code.startsWith("X")) {
    return "";
  }
  if (code === "EUR") {
    return "EU";
  }
  return code.slice(0, 2);
}

function nameOf(code) {
  return safeName(currencyNames, code) || code;
}

function countryOf(code) {
  const country = countryCode(code);
  return country ? safeName(countryNames, country) : "";
}

function formatNumber(value, decimals) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function decimalsFor(value) {
  const size = Math.abs(value);
  if (value === 0 || size >= 1) {
    return 2;
  }
  if (size >= 0.01) {
    return 4;
  }
  return 6;
}

function money(amount, code, compact) {
  let decimals = decimalsFor(amount);
  if (compact && Math.abs(amount) >= 1000) {
    decimals = 0;
  }

  const number = formatNumber(amount, decimals);
  const symbol = SYMBOLS[code];

  if (!symbol) {
    return number + " " + code;
  }
  if (SYMBOL_AFTER.includes(code)) {
    return number + " " + symbol + "‎";
  }
  return symbol + number;
}

function rateText(value) {
  if (value >= 100) {
    return formatNumber(value, 2);
  }
  if (value >= 0.01) {
    return formatNumber(value, 4);
  }
  return formatNumber(value, 6);
}

function plainAmount(value) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 8 });
}

function changeText(change) {
  const arrow = change >= 0 ? "▲ " : "▼ ";
  return arrow + Math.abs(change).toFixed(2) + "%";
}

function loadSaved(key, fallback, validValues) {
  try {
    const saved = localStorage.getItem(key);
    if (saved && validValues[saved]) {
      return saved;
    }
  } catch (error) {}
  return fallback;
}

function save(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {}
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Request failed: " + response.status);
  }
  return response.json();
}

async function fetchFirst(urls) {
  for (const url of urls) {
    try {
      return await fetchJson(url);
    } catch (error) {}
  }
  throw new Error("All sources failed");
}


function makeIcon(item) {
  if (item.image) {
    const image = document.createElement("img");
    image.className = "icon " + (item.round ? "round" : "flag");
    image.alt = "";
    image.loading = "lazy";
    image.src = item.image;
    image.addEventListener("error", () => {
      image.style.visibility = "hidden";
    });
    return image;
  }

  const badge = document.createElement("span");
  if (item.badge) {
    badge.className = "icon badge " + (item.color || "coin");
    badge.textContent = item.badge;
  } else {
    badge.className = "icon flag";
    badge.style.visibility = "hidden";
  }
  return badge;
}

function createPicker(element, placeholder, onChange) {
  element.innerHTML = `
    <button type="button" class="field picker-button">
      <span class="icon-slot"></span>
      <span class="picker-label">Loading…</span>
      <span class="chevron">▼</span>
    </button>
    <div class="picker-panel" hidden>
      <input class="picker-search" type="text" autocomplete="off">
      <ul class="picker-list"></ul>
      <p class="picker-empty" hidden>Nothing found</p>
    </div>`;

  const button = element.querySelector(".picker-button");
  const iconSlot = element.querySelector(".icon-slot");
  const label = element.querySelector(".picker-label");
  const panel = element.querySelector(".picker-panel");
  const search = element.querySelector(".picker-search");
  const list = element.querySelector(".picker-list");
  const empty = element.querySelector(".picker-empty");

  search.placeholder = placeholder;
  iconSlot.style.display = "contents";

  let items = [];
  let value = "";
  let shown = [];
  let active = 0;

  function setValue(newValue) {
    const item = items.find((entry) => entry.value === newValue);
    if (!item) {
      return;
    }
    value = newValue;
    label.textContent = item.title;
    iconSlot.replaceChildren(makeIcon(item));
  }

  function setItems(newItems) {
    items = newItems;
    if (value) {
      setValue(value);
    }
    if (!panel.hidden) {
      render();
    }
  }

  function highlight() {
    const rows = list.children;
    for (let i = 0; i < rows.length; i++) {
      rows[i].classList.toggle("active", i === active);
    }
    if (rows[active]) {
      rows[active].scrollIntoView({ block: "nearest" });
    }
  }

  function render() {
    const query = search.value.trim().toLowerCase();
    shown = items.filter((item) => query === "" || item.search.includes(query));
    list.innerHTML = "";

    shown.forEach((item, index) => {
      const row = document.createElement("li");
      row.className = "picker-item" + (item.value === value ? " selected" : "");

      const text = document.createElement("span");
      const title = document.createElement("strong");
      title.textContent = item.title;
      const subtitleText = document.createElement("small");
      subtitleText.textContent = item.subtitle;
      text.append(title, subtitleText);

      row.append(makeIcon(item), text);
      row.addEventListener("click", () => choose(item.value));
      row.addEventListener("mousemove", () => {
        if (active !== index) {
          active = index;
          highlight();
        }
      });
      list.append(row);
    });

    empty.hidden = shown.length > 0;
    active = query === "" ? Math.max(0, shown.findIndex((item) => item.value === value)) : 0;
    highlight();
  }

  function open() {
    panel.hidden = false;
    search.value = "";
    render();
    search.focus();
  }

  function close() {
    panel.hidden = true;
  }

  function choose(newValue) {
    setValue(newValue);
    close();
    button.focus();
    onChange();
  }

  button.addEventListener("click", () => {
    if (panel.hidden) {
      open();
    } else {
      close();
    }
  });

  search.addEventListener("input", render);

  search.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      active = Math.min(active + 1, shown.length - 1);
      highlight();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      active = Math.max(active - 1, 0);
      highlight();
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (shown[active]) {
        choose(shown[active].value);
      }
    } else if (event.key === "Escape") {
      close();
      button.focus();
    }
  });

  document.addEventListener("click", (event) => {
    if (!element.contains(event.target)) {
      close();
    }
  });

  return {
    getValue: () => value,
    setValue: setValue,
    setItems: setItems,
  };
}


function buildCurrencyItems(codes) {
  return codes.map((code) => {
    const country = countryCode(code);
    const search = [
      code,
      nameOf(code),
      countryOf(code),
      safeName(arabicCurrencyNames, code),
      country ? safeName(arabicCountryNames, country) : "",
    ].join(" ").toLowerCase();

    return {
      value: code,
      title: code + " — " + nameOf(code),
      subtitle: countryOf(code),
      image: country ? "https://flagcdn.com/w40/" + country.toLowerCase() + ".png" : "",
      search: search,
    };
  });
}

function buildAssetItems() {
  return assetOrder.map((code) => {
    const asset = assets[code];
    const isMetal = asset.type === "metal";
    return {
      value: code,
      title: isMetal ? asset.name : code + " — " + asset.name,
      subtitle: isMetal ? "Precious metal" : "Cryptocurrency",
      image: asset.image || "",
      round: true,
      badge: asset.badge || code.slice(0, 1),
      color: asset.color || "coin",
      search: [code, asset.name, asset.arabic, isMetal ? "metal" : "crypto coin"].join(" ").toLowerCase(),
    };
  });
}


function showError(message) {
  resultText.textContent = message;
  resultText.classList.add("error");
  equalsText.textContent = "";
  resultName.textContent = "";
  ratesBox.hidden = true;
  copyButton.hidden = true;
  currencyAlertButton.hidden = true;
}

function convert() {
  const from = fromPicker.getValue();
  const to = toPicker.getValue();
  if (!fiatRates[from] || !fiatRates[to]) {
    return;
  }

  amountSymbol.textContent = (SYMBOLS[from] || from).trim();
  save("currency-from", from);
  save("currency-to", to);

  const amount = Number(amountInput.value);
  if (amountInput.value === "" || isNaN(amount)) {
    showError("Please type an amount");
    return;
  }
  if (amount < 0) {
    showError("The amount can't be negative");
    return;
  }

  const oneUnit = fiatRates[to] / fiatRates[from];
  const result = amount * oneUnit;
  const fromName = nameOf(from);
  const toName = nameOf(to);

  resultText.classList.remove("error");
  equalsText.textContent = money(amount, from) + (fromName !== from ? " " + fromName : "") + " equals";
  resultText.textContent = money(result, to);
  resultName.textContent = toName !== to ? toName : "";
  rateLine.textContent = "1 " + from + " = " + rateText(oneUnit) + " " + to;
  inverseLine.textContent = "1 " + to + " = " + rateText(1 / oneUnit) + " " + from;
  ratesBox.hidden = false;
  copyButton.hidden = false;
  currencyAlertButton.hidden = false;
}

function swap() {
  const oldFrom = fromPicker.getValue();
  fromPicker.setValue(toPicker.getValue());
  toPicker.setValue(oldFrom);
  convert();
}

async function copyResult() {
  try {
    await navigator.clipboard.writeText(resultText.textContent.replace(/‎/g, ""));
    copyButton.textContent = "Copied ✓";
  } catch (error) {
    copyButton.textContent = "Couldn't copy";
  }
  setTimeout(() => {
    copyButton.textContent = "Copy result";
  }, 1500);
}


function priceInCurrency(asset, currency) {
  return asset.priceUsd * fiatRates[currency];
}

function gramPrice(asset, currency, karat) {
  const purity = asset.code === "XAU" ? karat / 24 : 1;
  return priceInCurrency(asset, currency) / GRAMS_PER_OUNCE * purity;
}

function showAssetError(message) {
  assetResult.textContent = message;
  assetResult.classList.add("error");
  assetEquals.textContent = "";
  assetResultName.textContent = "";
  assetRates.hidden = true;
  assetAlertButton.hidden = true;
}

function updateChips() {
  for (const chip of unitChips.querySelectorAll(".chip")) {
    chip.classList.toggle("active", chip.dataset.unit === selectedUnit);
  }
  for (const chip of karatChips.querySelectorAll(".chip")) {
    chip.classList.toggle("active", Number(chip.dataset.karat) === selectedKarat);
  }
}

function convertAsset() {
  const code = assetPicker.getValue();
  const currency = assetCurrencyPicker.getValue();
  const asset = assets[code];
  if (!asset || !fiatRates[currency]) {
    return;
  }

  const isMetal = asset.type === "metal";
  const isGold = code === "XAU";
  unitChips.hidden = !isMetal;
  karatChips.hidden = !isGold;
  assetUnit.textContent = isMetal ? selectedUnit : code;
  updateChips();

  save("asset-code", code);
  save("asset-currency", currency);
  save("asset-unit", selectedUnit);
  save("asset-karat", String(selectedKarat));

  for (const card of marketGrid.children) {
    card.classList.toggle("selected", card.dataset.code === code);
  }

  const amount = Number(assetAmount.value);
  if (assetAmount.value === "" || isNaN(amount)) {
    showAssetError("Please type an amount");
    return;
  }
  if (amount < 0) {
    showAssetError("The amount can't be negative");
    return;
  }

  assetResult.classList.remove("error");
  assetRates.hidden = false;
  assetAlertButton.hidden = false;
  assetSecondLine.className = "";

  if (isMetal) {
    const karatText = isGold ? selectedKarat + "K " : "";
    const perGram = gramPrice(asset, currency, selectedKarat);
    const result = amount * perGram * UNIT_GRAMS[selectedUnit];

    assetEquals.textContent = plainAmount(amount) + " " + selectedUnit + " of " + karatText + asset.name.toLowerCase() + " equals";
    assetResult.textContent = money(result, currency);
    assetResultName.textContent = nameOf(currency);
    assetPriceLine.textContent = "1 g " + karatText + asset.name.toLowerCase() + " = " + money(perGram, currency);
    assetSecondLine.textContent = "1 oz = " + money(perGram * GRAMS_PER_OUNCE, currency) + "  •  1 kg = " + money(perGram * 1000, currency, true);
  } else {
    const unitPrice = priceInCurrency(asset, currency);
    const result = amount * unitPrice;

    assetEquals.textContent = plainAmount(amount) + " " + code + " (" + asset.name + ") equals";
    assetResult.textContent = money(result, currency);
    assetResultName.textContent = nameOf(currency);
    assetPriceLine.textContent = "1 " + code + " = " + money(unitPrice, currency);

    if (typeof asset.change === "number") {
      assetSecondLine.textContent = changeText(asset.change) + " in the last 24 hours";
      assetSecondLine.className = "change " + (asset.change >= 0 ? "up" : "down");
    } else {
      assetSecondLine.textContent = "Daily price";
    }
  }
}

function sparkline(prices) {
  const svgNS = "http://www.w3.org/2000/svg";
  const width = 100;
  const height = 30;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const step = width / (prices.length - 1);

  const points = prices.map((price, index) => {
    const x = index * step;
    const y = height - ((price - min) / (max - min || 1)) * height;
    return x.toFixed(1) + "," + y.toFixed(1);
  }).join(" ");

  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 " + width + " " + height);
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("class", "spark " + (prices[prices.length - 1] >= prices[0] ? "up" : "down"));

  const line = document.createElementNS(svgNS, "polyline");
  line.setAttribute("points", points);
  svg.append(line);
  return svg;
}

function renderMarket() {
  const currency = assetCurrencyPicker.getValue();
  if (!marketLoaded || !fiatRates[currency]) {
    return;
  }

  marketGrid.innerHTML = "";
  const itemsByCode = {};
  for (const item of buildAssetItems()) {
    itemsByCode[item.value] = item;
  }

  for (const code of MARKET_CARDS) {
    const asset = assets[code];
    if (!asset) {
      continue;
    }

    const card = document.createElement("button");
    card.className = "market-card";
    card.dataset.code = code;

    const top = document.createElement("div");
    top.className = "market-top";
    const names = document.createElement("span");
    const title = document.createElement("strong");
    title.textContent = asset.name;
    const small = document.createElement("small");
    small.textContent = asset.type === "metal" ? "per gram" + (code === "XAU" ? " (24K)" : "") : code;
    names.append(title, small);
    top.append(makeIcon(itemsByCode[code]), names);

    const price = document.createElement("div");
    price.className = "market-price";
    const value = asset.type === "metal" ? gramPrice(asset, currency, 24) : priceInCurrency(asset, currency);
    price.textContent = money(value, currency, true);

    const bottom = document.createElement("div");
    bottom.className = "market-bottom";
    if (typeof asset.change === "number") {
      const change = document.createElement("span");
      change.className = "change " + (asset.change >= 0 ? "up" : "down");
      change.textContent = changeText(asset.change);
      bottom.append(change);
    } else {
      const note = document.createElement("span");
      note.className = "market-note";
      note.textContent = asset.type === "metal" ? "Updated daily" : "Daily price";
      bottom.append(note);
    }
    if (asset.sparkline && asset.sparkline.length > 1) {
      bottom.append(sparkline(asset.sparkline));
    }

    card.append(top, price, bottom);
    card.addEventListener("click", () => {
      assetPicker.setValue(code);
      convertAsset();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    marketGrid.append(card);
  }

  for (const card of marketGrid.children) {
    card.classList.toggle("selected", card.dataset.code === assetPicker.getValue());
  }
}

async function loadMarket() {
  if (marketLoading) {
    return;
  }
  marketLoading = true;

  let backup = null;
  try {
    backup = await fetchFirst(BACKUP_URLS);
  } catch (error) {}

  let live = null;
  try {
    const ids = COINS.map((coin) => coin.id).join(",");
    live = await fetchJson(COINGECKO_URL + "?vs_currency=usd&ids=" + ids + "&sparkline=true&price_change_percentage=24h");
  } catch (error) {}

  const daily = backup && backup.usd ? backup.usd : {};

  for (const metal of METALS) {
    if (daily[metal.key]) {
      assets[metal.code] = { ...metal, type: "metal", priceUsd: 1 / daily[metal.key] };
    }
  }

  for (const coin of COINS) {
    const liveCoin = Array.isArray(live) ? live.find((entry) => entry.id === coin.id) : null;
    const dailyKey = coin.code.toLowerCase();

    if (liveCoin && liveCoin.current_price) {
      assets[coin.code] = {
        ...coin,
        type: "crypto",
        priceUsd: liveCoin.current_price,
        change: liveCoin.price_change_percentage_24h,
        image: liveCoin.image,
        sparkline: liveCoin.sparkline_in_7d ? liveCoin.sparkline_in_7d.price : null,
      };
    } else if (!assets[coin.code] && daily[dailyKey]) {
      assets[coin.code] = { ...coin, type: "crypto", priceUsd: 1 / daily[dailyKey] };
    }
  }

  cryptoIsLive = Array.isArray(live);
  assetOrder = [...METALS, ...COINS].map((asset) => asset.code).filter((code) => assets[code]);
  marketLoading = false;

  if (assetOrder.length === 0) {
    showAssetError("Couldn't load prices. Check your internet and refresh the page.");
    return;
  }

  const firstLoad = !marketLoaded;
  marketLoaded = true;
  marketUpdated = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  assetPicker.setItems(buildAssetItems());
  if (firstLoad) {
    assetPicker.setValue(loadSaved("asset-code", "XAU", assets));
  }
  convertAsset();
  renderMarket();
  refreshMoneyViews();
  updateFooter();
}

function startMarket() {
  if (!marketLoaded) {
    loadMarket();
  }
  if (!refreshTimer) {
    refreshTimer = setInterval(loadMarket, REFRESH_SECONDS * 1000);
  }
}

function stopMarket() {
  clearInterval(refreshTimer);
  refreshTimer = null;
}


async function loadFiat() {
  try {
    const data = await fetchJson(FIAT_URL);
    if (data.result !== "success") {
      throw new Error("Bad response");
    }
    fiatRates = data.rates;
    fiatUpdated = data.time_last_update_utc.slice(0, 16);
  } catch (error) {
    if (!fiatLoaded) {
      showError("Couldn't load rates. Check your internet and refresh the page.");
      showAssetError("Couldn't load rates. Check your internet and refresh the page.");
    }
    return;
  }

  if (fiatLoaded) {
    convert();
    convertAsset();
    renderMarket();
    refreshMoneyViews();
    return;
  }
  fiatLoaded = true;

  const codes = Object.keys(fiatRates).sort();
  currencyItems = buildCurrencyItems(codes);
  subtitle.textContent = codes.length + " currencies • live rates";

  fromPicker.setItems(currencyItems);
  toPicker.setItems(currencyItems);
  assetCurrencyPicker.setItems(currencyItems);

  fromPicker.setValue(loadSaved("currency-from", "USD", fiatRates));
  toPicker.setValue(loadSaved("currency-to", "SAR", fiatRates));
  assetCurrencyPicker.setValue(loadSaved("asset-currency", "SAR", fiatRates));

  setupMoneyPickers();
  convert();
  convertAsset();
  renderMarket();
  refreshMoneyViews();
  updateFooter();
}


const TRADINGVIEW_URL = "https://s3.tradingview.com/external-embedding/embed-widget-";

const STOCKS = [
  { label: "S&P 500", symbol: "FOREXCOM:SPXUSD", index: true },
  { label: "Nasdaq 100", symbol: "FOREXCOM:NSXUSD", index: true },
  { label: "Apple", symbol: "NASDAQ:AAPL" },
  { label: "Nvidia", symbol: "NASDAQ:NVDA" },
  { label: "Microsoft", symbol: "NASDAQ:MSFT" },
  { label: "Tesla", symbol: "NASDAQ:TSLA" },
  { label: "Amazon", symbol: "NASDAQ:AMZN" },
  { label: "Google", symbol: "NASDAQ:GOOGL" },
  { label: "Meta", symbol: "NASDAQ:META" },
];

const TICKER_SYMBOLS = [
  { proName: "FOREXCOM:SPXUSD", title: "S&P 500" },
  { proName: "FOREXCOM:NSXUSD", title: "Nasdaq 100" },
  { proName: "NASDAQ:AAPL", title: "Apple" },
  { proName: "NASDAQ:NVDA", title: "Nvidia" },
  { proName: "NASDAQ:MSFT", title: "Microsoft" },
  { proName: "NASDAQ:TSLA", title: "Tesla" },
  { proName: "NASDAQ:AMZN", title: "Amazon" },
  { proName: "NASDAQ:GOOGL", title: "Google" },
  { proName: "NASDAQ:META", title: "Meta" },
  { proName: "OANDA:XAUUSD", title: "Gold" },
  { proName: "BITSTAMP:BTCUSD", title: "Bitcoin" },
];

const tickerTape = document.getElementById("tickerTape");
const stockChart = document.getElementById("stockChart");
const symbolInfo = document.getElementById("symbolInfo");
const heatmap = document.getElementById("heatmap");
const stockChips = document.getElementById("stockChips");
const watchChips = document.getElementById("watchChips");
const starButton = document.getElementById("starButton");
const stockSearch = document.getElementById("stockSearch");
const stockInput = document.getElementById("stockInput");
const detailsTitle = document.getElementById("detailsTitle");
const technicalBox = document.getElementById("technicalBox");
const profilePanel = document.getElementById("profilePanel");
const profileBox = document.getElementById("profileBox");
const numbersPanel = document.getElementById("numbersPanel");
const numbersBox = document.getElementById("numbersBox");
const newsTitle = document.getElementById("newsTitle");
const newsBox = document.getElementById("newsBox");
const moversBox = document.getElementById("moversBox");
const marketStatus = document.getElementById("marketStatus");
const darkMode = window.matchMedia("(prefers-color-scheme: dark)");

let selectedStock = loadText("stock-symbol", "NASDAQ:AAPL");
let watchlist = loadList("watchlist");
let stocksLoaded = false;
let statusTimer = null;


function loadText(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch (error) {
    return fallback;
  }
}

function loadList(key) {
  try {
    const list = JSON.parse(localStorage.getItem(key));
    return Array.isArray(list) ? list.filter((item) => typeof item === "string") : [];
  } catch (error) {
    return [];
  }
}

function symbolLabel(symbol) {
  const known = STOCKS.find((stock) => stock.symbol === symbol);
  if (known) {
    return known.label;
  }
  return symbol.includes(":") ? symbol.split(":")[1] : symbol;
}

function isIndex(symbol) {
  return STOCKS.some((stock) => stock.symbol === symbol && stock.index);
}

function pageUrl() {
  if (location.protocol !== "http:" && location.protocol !== "https:") {
    return "";
  }
  return location.origin + location.pathname + "#stocks";
}

function themeName() {
  return darkMode.matches ? "dark" : "light";
}

function addWidget(container, name, config) {
  container.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "tradingview-widget-container";

  const widget = document.createElement("div");
  widget.className = "tradingview-widget-container__widget";
  widget.style.height = "100%";

  const script = document.createElement("script");
  script.src = TRADINGVIEW_URL + name + ".js";
  script.async = true;
  script.textContent = JSON.stringify(config);

  wrapper.append(widget, script);
  container.append(wrapper);
}


function showTicker() {
  const symbols = [...TICKER_SYMBOLS];
  for (const symbol of watchlist) {
    if (!symbols.some((item) => item.proName === symbol)) {
      symbols.push({ proName: symbol, title: symbolLabel(symbol) });
    }
  }

  addWidget(tickerTape, "ticker-tape", {
    symbols: symbols,
    showSymbolLogo: true,
    colorTheme: themeName(),
    isTransparent: true,
    displayMode: "adaptive",
    largeChartUrl: pageUrl(),
    locale: "en",
  });
}

function showChart() {
  addWidget(symbolInfo, "symbol-info", {
    symbol: selectedStock,
    width: "100%",
    locale: "en",
    colorTheme: themeName(),
    isTransparent: true,
  });

  addWidget(stockChart, "advanced-chart", {
    autosize: true,
    symbol: selectedStock,
    interval: "D",
    timezone: "Etc/UTC",
    theme: themeName(),
    style: "1",
    locale: "en",
    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue("--card").trim(),
    allow_symbol_change: true,
    calendar: false,
    support_host: "https://www.tradingview.com",
  });
}

function showDetails() {
  const index = isIndex(selectedStock);
  detailsTitle.textContent = symbolLabel(selectedStock) + " details";

  addWidget(technicalBox, "technical-analysis", {
    interval: "1D",
    width: "100%",
    height: "100%",
    isTransparent: true,
    symbol: selectedStock,
    showIntervalTabs: true,
    displayMode: "single",
    locale: "en",
    colorTheme: themeName(),
  });

  profilePanel.hidden = index;
  numbersPanel.hidden = index;
  if (!index) {
    addWidget(profileBox, "symbol-profile", {
      width: "100%",
      height: "100%",
      colorTheme: themeName(),
      isTransparent: true,
      symbol: selectedStock,
      locale: "en",
    });

    addWidget(numbersBox, "financials", {
      colorTheme: themeName(),
      isTransparent: true,
      largeChartUrl: "",
      displayMode: "regular",
      width: "100%",
      height: "100%",
      symbol: selectedStock,
      locale: "en",
    });
  }

  newsTitle.textContent = index ? "📰 Market news" : "📰 " + symbolLabel(selectedStock) + " news";
  const newsConfig = {
    colorTheme: themeName(),
    isTransparent: true,
    displayMode: "regular",
    width: "100%",
    height: "100%",
    locale: "en",
  };
  if (index) {
    newsConfig.feedMode = "market";
    newsConfig.market = "stock";
  } else {
    newsConfig.feedMode = "symbol";
    newsConfig.symbol = selectedStock;
  }
  addWidget(newsBox, "timeline", newsConfig);
}

function showMovers() {
  addWidget(moversBox, "hotlists", {
    colorTheme: themeName(),
    dateRange: "1D",
    exchange: "US",
    showChart: true,
    locale: "en",
    largeChartUrl: pageUrl(),
    isTransparent: true,
    showSymbolLogo: true,
    showFloatingTooltip: true,
    width: "100%",
    height: "100%",
  });
}

function showHeatmap() {
  addWidget(heatmap, "stock-heatmap", {
    exchanges: [],
    dataSource: "SPX500",
    grouping: "sector",
    blockSize: "market_cap_basic",
    blockColor: "change",
    locale: "en",
    symbolUrl: pageUrl(),
    colorTheme: themeName(),
    hasTopBar: false,
    isDataSetEnabled: false,
    isZoomEnabled: true,
    hasSymbolTooltip: true,
    isMonoSize: false,
    width: "100%",
    height: "100%",
  });
}

function showAllWidgets() {
  showTicker();
  showChart();
  showDetails();
  showMovers();
  showHeatmap();
  renderStockButtons();
  stocksLoaded = true;
}


function makeStockChip(symbol, removable) {
  const chip = document.createElement("button");
  chip.type = "button";
  chip.className = "chip" + (symbol === selectedStock ? " active" : "");
  chip.textContent = symbolLabel(symbol);
  chip.addEventListener("click", () => selectStock(symbol));

  if (removable) {
    const remove = document.createElement("span");
    remove.className = "remove";
    remove.textContent = "×";
    remove.title = "Remove from watchlist";
    remove.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleWatchlist(symbol);
    });
    chip.append(remove);
  }
  return chip;
}

function renderStockButtons() {
  stockChips.replaceChildren(...STOCKS.map((stock) => makeStockChip(stock.symbol, false)));

  if (watchlist.length === 0) {
    const empty = document.createElement("span");
    empty.className = "chip-empty";
    empty.textContent = "Empty. Pick a stock and tap ☆ to save it here.";
    watchChips.replaceChildren(empty);
  } else {
    watchChips.replaceChildren(...watchlist.map((symbol) => makeStockChip(symbol, true)));
  }

  const saved = watchlist.includes(selectedStock);
  starButton.classList.toggle("saved", saved);
  starButton.textContent = saved
    ? "★ " + symbolLabel(selectedStock) + " is in your watchlist"
    : "☆ Add " + symbolLabel(selectedStock) + " to watchlist";
}

function toggleWatchlist(symbol) {
  if (watchlist.includes(symbol)) {
    watchlist = watchlist.filter((item) => item !== symbol);
  } else {
    watchlist.push(symbol);
  }
  save("watchlist", JSON.stringify(watchlist));
  renderStockButtons();
  showTicker();
}

function selectStock(symbol) {
  selectedStock = symbol;
  save("stock-symbol", symbol);
  showChart();
  showDetails();
  renderStockButtons();
}

function cleanTicker(text) {
  return text.trim().toUpperCase().replace(/\s+/g, "");
}

function symbolFromUrl() {
  const fromSearch = new URLSearchParams(location.search).get("tvwidgetsymbol");
  if (fromSearch) {
    return fromSearch;
  }
  const hashQuery = location.hash.split("?")[1];
  return hashQuery ? new URLSearchParams(hashQuery).get("tvwidgetsymbol") : null;
}

function readSymbolFromUrl() {
  const symbol = symbolFromUrl();
  if (!symbol) {
    return;
  }
  selectedStock = cleanTicker(symbol);
  save("stock-symbol", selectedStock);

  const url = new URL(location.href);
  url.searchParams.delete("tvwidgetsymbol");
  url.hash = "stocks";
  history.replaceState(null, "", url);
}


function newYorkTime() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const get = (type) => parts.find((part) => part.type === type).value;
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    day: days.indexOf(get("weekday")),
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

function durationText(minutes) {
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) {
    return days + "d " + hours + "h";
  }
  if (hours > 0) {
    return hours + "h " + mins + "m";
  }
  return mins + "m";
}

function marketState(day, minutes) {
  const open = 9 * 60 + 30;
  const close = 16 * 60;
  const isWeekday = day >= 1 && day <= 5;

  if (isWeekday && minutes >= open && minutes < close) {
    return { open: true, minutesLeft: close - minutes };
  }

  let daysAhead = 0;
  let checkDay = day;
  if (!isWeekday || minutes >= close) {
    do {
      daysAhead++;
      checkDay = (checkDay + 1) % 7;
    } while (checkDay === 0 || checkDay === 6);
  }
  return { open: false, minutesLeft: daysAhead * 1440 + open - minutes };
}

function updateMarketStatus() {
  const now = newYorkTime();
  const state = marketState(now.day, now.minutes);

  marketStatus.classList.toggle("open", state.open);
  if (state.open) {
    marketStatus.textContent = "US market open • closes in " + durationText(state.minutesLeft);
  } else {
    marketStatus.textContent = "US market closed • opens in " + durationText(state.minutesLeft);
  }
}

function startStocks() {
  if (!stocksLoaded) {
    showAllWidgets();
  }
  updateMarketStatus();
  if (!statusTimer) {
    statusTimer = setInterval(updateMarketStatus, 30000);
  }
}

function stopStocks() {
  clearInterval(statusTimer);
  statusTimer = null;
}


starButton.addEventListener("click", () => toggleWatchlist(selectedStock));

stockSearch.addEventListener("submit", (event) => {
  event.preventDefault();
  const ticker = cleanTicker(stockInput.value);
  if (ticker) {
    selectStock(ticker);
    stockInput.value = "";
    stockInput.blur();
  }
});

darkMode.addEventListener("change", () => {
  if (stocksLoaded) {
    showAllWidgets();
  }
});


const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const INTERVALS = [["5", "5m"], ["15", "15m"], ["60", "1H"], ["D", "1D"], ["W", "1W"]];

const ROOM_DEFAULTS = [
  { symbol: "NASDAQ:AAPL", interval: "D" },
  { symbol: "NASDAQ:TSLA", interval: "D" },
  { symbol: "NASDAQ:NVDA", interval: "D" },
  { symbol: "FOREXCOM:SPXUSD", interval: "D" },
  { symbol: "BITSTAMP:BTCUSD", interval: "D" },
  { symbol: "OANDA:XAUUSD", interval: "D" },
];

const LAYOUTS = [1, 2, 4, 6];

const LAYOUT_ICONS = {
  1: [[0, 0, 18, 14]],
  2: [[0, 0, 18, 6], [0, 8, 18, 6]],
  4: [[0, 0, 8, 6], [10, 0, 8, 6], [0, 8, 8, 6], [10, 8, 8, 6]],
  6: [[0, 0, 5, 6], [6.5, 0, 5, 6], [13, 0, 5, 6], [0, 8, 5, 6], [6.5, 8, 5, 6], [13, 8, 5, 6]],
};

const ROOM_SETUPS = [
  { name: "💻 Tech", symbols: ["NASDAQ:AAPL", "NASDAQ:MSFT", "NASDAQ:NVDA", "NASDAQ:GOOGL", "NASDAQ:AMZN", "NASDAQ:META"] },
  { name: "🪙 Crypto", symbols: ["BITSTAMP:BTCUSD", "BITSTAMP:ETHUSD", "BINANCE:SOLUSDT", "BINANCE:XRPUSDT", "BINANCE:BNBUSDT", "BINANCE:DOGEUSDT"] },
  { name: "🥇 Gold & oil", symbols: ["OANDA:XAUUSD", "OANDA:XAGUSD", "TVC:USOIL", "TVC:UKOIL", "OANDA:XPTUSD", "OANDA:NATGASUSD"] },
  { name: "🌍 World indexes", symbols: ["FOREXCOM:SPXUSD", "FOREXCOM:NSXUSD", "FOREXCOM:DJI", "FOREXCOM:UKXGBP", "CAPITALCOM:VIX", "CAPITALCOM:DXY"] },
];

const ROOM_LABELS = {
  "BITSTAMP:BTCUSD": "Bitcoin",
  "BITSTAMP:ETHUSD": "Ethereum",
  "BINANCE:SOLUSDT": "Solana",
  "BINANCE:XRPUSDT": "XRP",
  "BINANCE:BNBUSDT": "BNB",
  "BINANCE:DOGEUSDT": "Dogecoin",
  "OANDA:XAUUSD": "Gold",
  "OANDA:XAGUSD": "Silver",
  "OANDA:XPTUSD": "Platinum",
  "OANDA:NATGASUSD": "Natural gas",
  "TVC:USOIL": "Oil (WTI)",
  "TVC:UKOIL": "Oil (Brent)",
  "FOREXCOM:DJI": "Dow Jones",
  "FOREXCOM:UKXGBP": "UK FTSE 100",
  "CAPITALCOM:VIX": "Fear index (VIX)",
  "CAPITALCOM:DXY": "US dollar (DXY)",
  "FRED:DGS10": "US 10-year rate",
};

const MOOD_SYMBOLS = [
  { name: "CAPITALCOM:VIX", displayName: "Fear index (VIX)" },
  { name: "CAPITALCOM:DXY", displayName: "US dollar index" },
  { name: "FRED:DGS10", displayName: "US 10-year rate %" },
  { name: "TVC:USOIL", displayName: "Oil (WTI)" },
  { name: "OANDA:XAUUSD", displayName: "Gold" },
  { name: "BITSTAMP:BTCUSD", displayName: "Bitcoin" },
];

const SIGNAL_INTERVALS = { "5": "5m", "15": "15m", "60": "1h", D: "1D", W: "1W" };

const EXCHANGES = [
  { name: "New York", country: "us", zone: "America/New_York", days: [1, 2, 3, 4, 5], sessions: [[570, 960]], color: "#38bdf8" },
  { name: "London", country: "gb", zone: "Europe/London", days: [1, 2, 3, 4, 5], sessions: [[480, 990]], color: "#a78bfa" },
  { name: "Frankfurt", country: "de", zone: "Europe/Berlin", days: [1, 2, 3, 4, 5], sessions: [[540, 1050]], color: "#a78bfa" },
  { name: "Saudi", country: "sa", zone: "Asia/Riyadh", days: [0, 1, 2, 3, 4], sessions: [[600, 900]], color: "#f59e0b" },
  { name: "Dubai", country: "ae", zone: "Asia/Dubai", days: [1, 2, 3, 4, 5], sessions: [[600, 885]], color: "#f59e0b" },
  { name: "Tokyo", country: "jp", zone: "Asia/Tokyo", days: [1, 2, 3, 4, 5], sessions: [[540, 690], [750, 930]], color: "#f472b6" },
  { name: "Hong Kong", country: "hk", zone: "Asia/Hong_Kong", days: [1, 2, 3, 4, 5], sessions: [[570, 720], [780, 960]], color: "#f472b6" },
  { name: "Sydney", country: "au", zone: "Australia/Sydney", days: [1, 2, 3, 4, 5], sessions: [[600, 960]], color: "#f472b6" },
];

const DAY_MS = 86400000;

const roomView = document.getElementById("roomView");
const roomStatus = document.getElementById("roomStatus");
const localClock = document.getElementById("localClock");
const nyClock = document.getElementById("nyClock");
const fullscreenButton = document.getElementById("fullscreenButton");
const worldStrip = document.getElementById("worldStrip");
const timeline = document.getElementById("timeline");
const timelineDate = document.getElementById("timelineDate");
const moodBox = document.getElementById("moodBox");
const layoutButtons = document.getElementById("layoutButtons");
const setupChips = document.getElementById("setupChips");
const saveSetupButton = document.getElementById("saveSetupButton");
const setupForm = document.getElementById("setupForm");
const setupName = document.getElementById("setupName");
const cancelSetupButton = document.getElementById("cancelSetupButton");
const roomWatchChips = document.getElementById("roomWatchChips");
const chartWall = document.getElementById("chartWall");
const roomMoversBox = document.getElementById("roomMoversBox");
const calendarBox = document.getElementById("calendarBox");
const roomNewsBox = document.getElementById("roomNewsBox");
const pcAccount = document.getElementById("pcAccount");
const pcRisk = document.getElementById("pcRisk");
const pcEntry = document.getElementById("pcEntry");
const pcStop = document.getElementById("pcStop");
const pcTarget = document.getElementById("pcTarget");
const pcResults = document.getElementById("pcResults");
const plBuy = document.getElementById("plBuy");
const plSell = document.getElementById("plSell");
const plShares = document.getElementById("plShares");
const plFees = document.getElementById("plFees");
const plResults = document.getElementById("plResults");
const roomNotes = document.getElementById("roomNotes");
const notesStatus = document.getElementById("notesStatus");

let roomCharts = loadRoomCharts();
let roomLayout = loadLayout();
let customSetups = loadSetups();
let selectedChart = Math.min(Number(loadText("room-selected", "0")) || 0, roomLayout - 1);
let focusedChart = -1;
let signalKey = "";
let roomLoaded = false;
let roomTimer = null;
let roomTicks = 0;
let notesTimer = null;
let timelineStart = 0;
let timelineEnd = 0;
let resizeTimer = null;


function isValidChart(chart) {
  return Boolean(chart) && typeof chart.symbol === "string" && chart.symbol !== "" &&
    INTERVALS.some((interval) => interval[0] === chart.interval);
}

function loadRoomCharts() {
  let saved = [];
  try {
    const list = JSON.parse(localStorage.getItem("room-charts"));
    if (Array.isArray(list)) {
      saved = list;
    }
  } catch (error) {}
  return ROOM_DEFAULTS.map((chart, index) => ({ ...(isValidChart(saved[index]) ? saved[index] : chart) }));
}

function loadLayout() {
  const layout = Number(loadText("room-layout", "4"));
  return LAYOUTS.includes(layout) ? layout : 4;
}

function loadSetups() {
  try {
    const list = JSON.parse(localStorage.getItem("room-setups"));
    if (Array.isArray(list)) {
      return list.filter((setup) =>
        setup && typeof setup.name === "string" && LAYOUTS.includes(setup.layout) &&
        Array.isArray(setup.charts) && setup.charts.length === 6 && setup.charts.every(isValidChart)).slice(0, 8);
    }
  } catch (error) {}
  return [];
}

function saveRoomCharts() {
  save("room-charts", JSON.stringify(roomCharts));
}

function chartLabel(symbol) {
  return ROOM_LABELS[symbol] || symbolLabel(symbol);
}

function roomUrl() {
  const url = pageUrl();
  return url ? url.replace(/#stocks$/, "#room") : "";
}

function pad(number) {
  return String(number).padStart(2, "0");
}

function zoneTime(zone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const get = (type) => parts.find((part) => part.type === type).value;
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));
  return {
    day: DAY_NAMES.indexOf(get("weekday")),
    minutes: hour * 60 + minute,
    text: pad(hour) + ":" + pad(minute),
  };
}

function exchangeState(exchange, now) {
  if (exchange.days.includes(now.day)) {
    for (const [start, end] of exchange.sessions) {
      if (now.minutes >= start && now.minutes < end) {
        return { state: "open", minutesLeft: end - now.minutes };
      }
    }
  }

  for (let ahead = 0; ahead <= 7; ahead++) {
    const day = (now.day + ahead) % 7;
    if (!exchange.days.includes(day)) {
      continue;
    }
    for (const [start] of exchange.sessions) {
      const minutesLeft = ahead * 1440 + start - now.minutes;
      if (minutesLeft > 0) {
        const isBreak = ahead === 0 && now.minutes > exchange.sessions[0][0];
        return { state: isBreak ? "break" : "closed", minutesLeft: minutesLeft };
      }
    }
  }
  return { state: "closed", minutesLeft: 0 };
}

function stateText(info) {
  if (info.state === "open") {
    return "open • closes in " + durationText(info.minutesLeft);
  }
  if (info.state === "break") {
    return "lunch break • back in " + durationText(info.minutesLeft);
  }
  return "closed • opens in " + durationText(info.minutesLeft);
}

function shortStateText(info) {
  if (info.state === "open") {
    return "Closes in " + durationText(info.minutesLeft);
  }
  if (info.state === "break") {
    return "Lunch • back in " + durationText(info.minutesLeft);
  }
  return "Opens in " + durationText(info.minutesLeft);
}

function flagImage(country) {
  const flag = document.createElement("img");
  flag.className = "mini-flag";
  flag.alt = "";
  flag.src = "https://flagcdn.com/w40/" + country + ".png";
  flag.addEventListener("error", () => { flag.hidden = true; });
  return flag;
}

function renderWorldStrip() {
  let openCount = 0;
  let newYork = null;

  const pills = EXCHANGES.map((exchange) => {
    const now = zoneTime(exchange.zone);
    const info = exchangeState(exchange, now);
    if (info.state === "open") {
      openCount++;
    }
    if (exchange.name === "New York") {
      newYork = info;
    }

    const pill = document.createElement("div");
    pill.className = "market-pill " + info.state;

    const dot = document.createElement("span");
    dot.className = "dot";

    const text = document.createElement("span");
    text.className = "pill-text";
    const top = document.createElement("span");
    top.className = "pill-top";
    const name = document.createElement("strong");
    name.textContent = exchange.name;
    const time = document.createElement("span");
    time.className = "pill-time";
    time.textContent = now.text;
    top.append(name, time);
    const detail = document.createElement("small");
    detail.textContent = shortStateText(info);
    text.append(top, detail);

    pill.append(dot, flagImage(exchange.country), text);
    return pill;
  });

  worldStrip.replaceChildren(...pills);
  roomStatus.classList.toggle("open", newYork.state === "open");
  roomStatus.textContent = "US market " + stateText(newYork) + "  •  " + openCount + " of " + EXCHANGES.length + " world markets open";
}


function zoneParts(time, zone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date(time));
  const get = (type) => Number(parts.find((part) => part.type === type).value);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute"), second: get("second") };
}

function zoneOffset(time, zone) {
  const parts = zoneParts(time, zone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asUtc - Math.floor(time / 1000) * 1000;
}

function zoneToTime(year, month, day, minutes, zone) {
  const wallClock = Date.UTC(year, month - 1, day, 0, minutes);
  const firstGuess = wallClock - zoneOffset(wallClock, zone);
  return wallClock - zoneOffset(firstGuess, zone);
}

function exchangeSessions(exchange, from, to) {
  const first = zoneParts(from, exchange.zone);
  const days = Math.ceil((to - from) / DAY_MS) + 1;
  const blocks = [];

  for (let offset = -1; offset <= days; offset++) {
    const date = new Date(Date.UTC(first.year, first.month - 1, first.day + offset));
    if (!exchange.days.includes(date.getUTCDay())) {
      continue;
    }
    for (const [start, end] of exchange.sessions) {
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth() + 1;
      const day = date.getUTCDate();
      const open = zoneToTime(year, month, day, start, exchange.zone);
      const close = zoneToTime(year, month, day, end, exchange.zone);
      if (close > from && open < to) {
        blocks.push({ open: open, close: close });
      }
    }
  }
  return blocks.sort((a, b) => a.open - b.open);
}

function clockText(time) {
  return new Date(time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function dayClockText(time) {
  return new Date(time).toLocaleDateString("en-GB", { weekday: "short" }) + " " + clockText(time);
}

function renderTimeline() {
  const now = Date.now();
  const today = new Date(now);
  timelineStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  timelineEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).getTime();
  const place = (time) => (time - timelineStart) / (timelineEnd - timelineStart) * 100;

  timelineDate.textContent = today.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" }) + " • your time";

  const labels = document.createElement("div");
  labels.className = "tl-labels";
  const tracks = document.createElement("div");
  tracks.className = "tl-tracks";

  for (const exchange of EXCHANGES) {
    const blocks = exchangeSessions(exchange, timelineStart, timelineEnd);
    const track = document.createElement("div");
    track.className = "tl-track";
    let openNow = false;

    for (const block of blocks) {
      const from = Math.max(block.open, timelineStart);
      const to = Math.min(block.close, timelineEnd);
      const state = now >= block.close ? "done" : now >= block.open ? "live" : "later";
      if (state === "live") {
        openNow = true;
      }

      const bar = document.createElement("div");
      bar.className = "tl-block " + state;
      bar.style.left = place(from) + "%";
      bar.style.width = (place(to) - place(from)) + "%";
      bar.style.setProperty("--block", exchange.color);
      bar.title = exchange.name + ": " + clockText(block.open) + " – " + clockText(block.close) + " your time";
      const text = document.createElement("span");
      text.textContent = clockText(block.open) + "–" + clockText(block.close);
      bar.append(text);
      track.append(bar);
    }

    if (blocks.length === 0) {
      const next = exchangeSessions(exchange, now, now + 8 * DAY_MS).find((block) => block.open > now);
      const empty = document.createElement("span");
      empty.className = "tl-empty";
      empty.textContent = "Closed today" + (next ? " • opens " + dayClockText(next.open) : "");
      track.append(empty);
    }

    const label = document.createElement("div");
    label.className = "tl-label" + (openNow ? " open" : "");
    const name = document.createElement("span");
    name.textContent = exchange.name;
    label.append(flagImage(exchange.country), name);

    labels.append(label);
    tracks.append(track);
  }

  const axis = document.createElement("div");
  axis.className = "tl-axis";
  for (let hour = 0; hour <= 24; hour += 3) {
    const tick = document.createElement("span");
    tick.className = "tl-hour" + (hour === 0 ? " first" : hour === 24 ? " last" : "");
    tick.style.left = (hour / 24 * 100) + "%";
    tick.textContent = pad(hour);
    axis.append(tick);
  }
  const nowTag = document.createElement("span");
  nowTag.className = "tl-now-tag";
  axis.append(nowTag);

  const nowLine = document.createElement("div");
  nowLine.className = "tl-now";

  tracks.append(axis, nowLine);
  timeline.replaceChildren(labels, tracks);
  moveNowLine();
  markTightBlocks();
}

function moveNowLine() {
  const now = Date.now();
  if (now >= timelineEnd) {
    renderTimeline();
    return;
  }
  const left = (now - timelineStart) / (timelineEnd - timelineStart) * 100 + "%";
  const nowLine = timeline.querySelector(".tl-now");
  const nowTag = timeline.querySelector(".tl-now-tag");
  if (nowLine && nowTag) {
    nowLine.style.left = left;
    nowTag.style.left = left;
    nowTag.textContent = clockText(now);
    const nowPercent = parseFloat(left);
    const gap = 30 / Math.max(timeline.querySelector(".tl-axis").offsetWidth, 1) * 100;
    for (const tick of timeline.querySelectorAll(".tl-hour")) {
      tick.classList.toggle("near-now", Math.abs(parseFloat(tick.style.left) - nowPercent) < gap);
    }
  }
}

function markTightBlocks() {
  for (const block of timeline.querySelectorAll(".tl-block")) {
    block.classList.toggle("tight", block.offsetWidth < 76);
  }
}

function tickRoom() {
  const now = new Date();
  localClock.textContent = now.toLocaleTimeString("en-GB", { hour12: false });
  nyClock.textContent = now.toLocaleTimeString("en-GB", { hour12: false, timeZone: "America/New_York" });
  if (roomTicks % 30 === 0) {
    renderWorldStrip();
    renderTimeline();
  } else {
    moveNowLine();
  }
  checkChartFocus();
  roomTicks++;
}


function cardColor() {
  return getComputedStyle(document.body).getPropertyValue("--card").trim();
}

function chartCell(index) {
  return chartWall.children[index];
}

function bigChart() {
  if (roomLayout === 1) {
    return 0;
  }
  return focusedChart;
}

function chartKey(index) {
  return roomCharts[index].symbol + "|" + roomCharts[index].interval;
}

function renderRoomChart(index) {
  const cell = chartCell(index);
  const chart = roomCharts[index];
  const box = cell.querySelector(".room-chart-box");

  cell.querySelector(".room-chart-label").textContent = chartLabel(chart.symbol);
  cell.querySelector(".room-chart-label").title = chart.symbol;
  for (const button of cell.querySelectorAll(".interval")) {
    button.classList.toggle("active", button.dataset.interval === chart.interval);
  }

  if (index >= roomLayout) {
    box.innerHTML = "";
    delete box.dataset.loaded;
    return;
  }

  if (box.dataset.loaded !== chartKey(index)) {
    box.dataset.loaded = chartKey(index);
    addWidget(box, "advanced-chart", {
      autosize: true,
      symbol: chart.symbol,
      interval: chart.interval,
      timezone: "exchange",
      theme: "dark",
      style: "1",
      locale: "en",
      backgroundColor: cardColor(),
      hide_side_toolbar: true,
      allow_symbol_change: false,
      calendar: false,
      support_host: "https://www.tradingview.com",
    });
  }
}

function renderSignal() {
  const big = bigChart();
  const key = big < 0 ? "" : big + "|" + chartKey(big);
  if (key === signalKey) {
    return;
  }
  signalKey = key;

  for (const box of chartWall.querySelectorAll(".signal-box")) {
    box.innerHTML = "";
  }
  if (big < 0) {
    return;
  }

  const chart = roomCharts[big];
  const cell = chartCell(big);
  cell.querySelector(".signal-name").textContent = chartLabel(chart.symbol);
  addWidget(cell.querySelector(".signal-box"), "technical-analysis", {
    interval: SIGNAL_INTERVALS[chart.interval] || "1D",
    width: "100%",
    height: "100%",
    isTransparent: true,
    symbol: chart.symbol,
    showIntervalTabs: true,
    displayMode: "single",
    locale: "en",
    colorTheme: "dark",
  });
}

function updateWall() {
  const big = bigChart();
  chartWall.className = "chart-wall layout-" + roomLayout + (focusedChart >= 0 ? " focused" : "");

  [...chartWall.children].forEach((cell, index) => {
    cell.hidden = index >= roomLayout;
    cell.classList.toggle("selected", index === selectedChart);
    cell.classList.toggle("is-focused", index === focusedChart);
    cell.classList.toggle("is-big", index === big);
    const button = cell.querySelector(".focus-button");
    button.textContent = index === focusedChart ? "⤡" : "⤢";
    button.title = index === focusedChart ? "Back to " + roomLayout + " charts" : "Make bigger + show buy/sell signal";
    renderRoomChart(index);
  });

  for (const button of layoutButtons.children) {
    button.classList.toggle("active", Number(button.dataset.layout) === roomLayout);
  }

  renderSignal();
  renderSetups();
  renderRoomWatch();
}

function selectChart(index) {
  if (index === selectedChart || index >= roomLayout) {
    return;
  }
  selectedChart = index;
  save("room-selected", String(index));
  for (const [i, cell] of [...chartWall.children].entries()) {
    cell.classList.toggle("selected", i === index);
  }
  renderRoomWatch();
}

function setChartSymbol(index, symbol) {
  roomCharts[index].symbol = symbol;
  saveRoomCharts();
  if (roomLoaded) {
    renderRoomChart(index);
    renderSignal();
    renderSetups();
    renderRoomWatch();
    flashChart(index);
  }
}

function flashChart(index) {
  const cell = chartCell(index);
  cell.classList.remove("flash");
  void cell.offsetWidth;
  cell.classList.add("flash");
}

function toggleFocus(index) {
  focusedChart = focusedChart === index ? -1 : index;
  selectChart(index);
  updateWall();
}

function setLayout(layout) {
  roomLayout = layout;
  focusedChart = -1;
  save("room-layout", String(layout));
  if (selectedChart >= layout) {
    selectedChart = 0;
    save("room-selected", "0");
  }
  updateWall();
}

function checkChartFocus() {
  const active = document.activeElement;
  if (active && active.tagName === "IFRAME") {
    const cell = active.closest(".room-chart");
    if (cell) {
      selectChart(Number(cell.dataset.index));
    }
  }
}

function buildChartWall() {
  chartWall.innerHTML = "";

  roomCharts.forEach((chart, index) => {
    const cell = document.createElement("div");
    cell.className = "room-chart";
    cell.dataset.index = index;
    cell.addEventListener("pointerdown", () => selectChart(index));

    const head = document.createElement("div");
    head.className = "room-chart-head";

    const label = document.createElement("strong");
    label.className = "room-chart-label";

    const form = document.createElement("form");
    form.className = "mini-search";
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Change symbol…";
    input.autocomplete = "off";
    form.append(input);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const ticker = cleanTicker(input.value);
      if (ticker) {
        input.value = "";
        input.blur();
        setChartSymbol(index, ticker);
      }
    });

    const intervals = document.createElement("div");
    intervals.className = "intervals";
    for (const [value, text] of INTERVALS) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "interval";
      button.textContent = text;
      button.dataset.interval = value;
      button.addEventListener("click", () => {
        roomCharts[index].interval = value;
        saveRoomCharts();
        renderRoomChart(index);
        renderSignal();
      });
      intervals.append(button);
    }

    const focus = document.createElement("button");
    focus.type = "button";
    focus.className = "focus-button";
    focus.addEventListener("click", () => toggleFocus(index));

    head.append(label, form, intervals, focus);

    const body = document.createElement("div");
    body.className = "room-chart-body";

    const box = document.createElement("div");
    box.className = "widget-box room-chart-box";

    const signal = document.createElement("div");
    signal.className = "room-signal";
    const signalTitle = document.createElement("div");
    signalTitle.className = "signal-title";
    const signalHeading = document.createElement("strong");
    signalHeading.textContent = "🎯 Buy / Sell signal";
    const signalName = document.createElement("span");
    signalName.className = "signal-name";
    signalTitle.append(signalHeading, signalName);
    const signalBox = document.createElement("div");
    signalBox.className = "widget-box signal-box";
    const signalNote = document.createElement("p");
    signalNote.className = "signal-note";
    signalNote.textContent = "A summary of 26 common indicators for this timeframe. A hint, not advice.";
    signal.append(signalTitle, signalBox, signalNote);

    body.append(box, signal);
    cell.append(head, body);
    chartWall.append(cell);
  });

  updateWall();
}

function buildLayoutButtons() {
  for (const layout of LAYOUTS) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.layout = layout;
    button.title = layout === 1 ? "1 chart" : layout + " charts";
    const rects = LAYOUT_ICONS[layout].map(([x, y, w, h]) =>
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="1.5"/>').join("");
    button.innerHTML = '<svg viewBox="0 0 18 14" width="18" height="14" aria-hidden="true">' + rects + "</svg>" + layout;
    button.addEventListener("click", () => setLayout(layout));
    layoutButtons.append(button);
  }
}

function setupSymbols(setup) {
  return setup.symbols || setup.charts.map((chart) => chart.symbol);
}

function setupIsActive(setup) {
  if (setup.layout && setup.layout !== roomLayout) {
    return false;
  }
  const symbols = setupSymbols(setup);
  for (let index = 0; index < roomLayout; index++) {
    if (roomCharts[index].symbol !== symbols[index]) {
      return false;
    }
  }
  return true;
}

function applySetup(setup) {
  if (setup.charts) {
    roomCharts = setup.charts.map((chart) => ({ symbol: chart.symbol, interval: chart.interval }));
    roomLayout = setup.layout;
    save("room-layout", String(roomLayout));
    focusedChart = -1;
    if (selectedChart >= roomLayout) {
      selectedChart = 0;
      save("room-selected", "0");
    }
  } else {
    roomCharts = setup.symbols.map((symbol, index) => ({ symbol: symbol, interval: roomCharts[index].interval }));
  }
  saveRoomCharts();
  updateWall();
}

function renderSetups() {
  const chips = ROOM_SETUPS.map((setup) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip" + (setupIsActive(setup) ? " active" : "");
    chip.textContent = setup.name;
    chip.title = setup.symbols.map(chartLabel).join(", ");
    chip.addEventListener("click", () => applySetup(setup));
    return chip;
  });

  for (const setup of customSetups) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip custom" + (setupIsActive(setup) ? " active" : "");
    chip.textContent = "📌 " + setup.name;
    chip.title = setup.layout + " charts: " + setup.charts.slice(0, setup.layout).map((chart) => chartLabel(chart.symbol)).join(", ");
    chip.addEventListener("click", () => applySetup(setup));

    const remove = document.createElement("span");
    remove.className = "remove";
    remove.textContent = "×";
    remove.title = "Delete this setup";
    remove.addEventListener("click", (event) => {
      event.stopPropagation();
      customSetups = customSetups.filter((item) => item !== setup);
      save("room-setups", JSON.stringify(customSetups));
      renderSetups();
    });
    chip.append(remove);
    chips.push(chip);
  }

  setupChips.replaceChildren(...chips);
}

function showSetupForm(show) {
  setupForm.hidden = !show;
  saveSetupButton.hidden = show;
  if (show) {
    setupName.value = "";
    setupName.focus();
  }
}

function saveSetup(event) {
  event.preventDefault();
  const name = setupName.value.trim() || "My setup " + (customSetups.length + 1);
  customSetups = customSetups.filter((setup) => setup.name.toLowerCase() !== name.toLowerCase());
  customSetups.push({
    name: name,
    layout: roomLayout,
    charts: roomCharts.map((chart) => ({ symbol: chart.symbol, interval: chart.interval })),
  });
  customSetups = customSetups.slice(-8);
  save("room-setups", JSON.stringify(customSetups));
  showSetupForm(false);
  renderSetups();
}

function renderRoomWatch() {
  if (watchlist.length === 0) {
    const empty = document.createElement("span");
    empty.className = "chip-empty";
    empty.append("Empty. Save stocks with ☆ in ");
    const link = document.createElement("a");
    link.href = "#stocks";
    link.textContent = "Stock Market";
    empty.append(link, ".");
    roomWatchChips.replaceChildren(empty);
    return;
  }

  const current = roomCharts[selectedChart].symbol;
  roomWatchChips.replaceChildren(...watchlist.map((symbol) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip" + (symbol === current ? " active" : "");
    chip.textContent = chartLabel(symbol);
    chip.title = "Show " + symbol + " in the picked chart";
    chip.addEventListener("click", () => setChartSymbol(selectedChart, symbol));
    return chip;
  }));
}

function takeRoomSymbol(symbol) {
  const url = new URL(location.href);
  url.searchParams.delete("tvwidgetsymbol");
  url.hash = "room";
  history.replaceState(null, "", url);

  const ticker = cleanTicker(symbol);
  if (ticker) {
    setChartSymbol(selectedChart, ticker);
  }
}

function showRoomWidgets() {
  addWidget(moodBox, "market-quotes", {
    width: "100%",
    height: "100%",
    colorTheme: "dark",
    isTransparent: true,
    showSymbolLogo: true,
    locale: "en",
    largeChartUrl: roomUrl(),
    symbolsGroups: [{ name: "Market mood", symbols: MOOD_SYMBOLS }],
  });

  addWidget(roomMoversBox, "hotlists", {
    colorTheme: "dark",
    dateRange: "1D",
    exchange: "US",
    showChart: false,
    locale: "en",
    largeChartUrl: roomUrl(),
    isTransparent: true,
    showSymbolLogo: true,
    showFloatingTooltip: false,
    width: "100%",
    height: "100%",
  });

  addWidget(calendarBox, "events", {
    colorTheme: "dark",
    isTransparent: true,
    width: "100%",
    height: "100%",
    locale: "en",
    importanceFilter: "0,1",
    countryFilter: "us,eu,gb,de,jp,cn,sa",
  });

  addWidget(roomNewsBox, "timeline", {
    feedMode: "all_symbols",
    colorTheme: "dark",
    isTransparent: true,
    displayMode: "regular",
    width: "100%",
    height: "100%",
    locale: "en",
  });
}


function num(input) {
  return parseFloat(input.value);
}

function resultRow(label, value, style) {
  const row = document.createElement("div");
  row.className = "result-row" + (style ? " " + style : "");
  const name = document.createElement("span");
  name.textContent = label;
  const amount = document.createElement("strong");
  amount.textContent = value;
  row.append(name, amount);
  return row;
}

function calcMessage(text, isWarning) {
  const message = document.createElement("p");
  message.className = "calc-message" + (isWarning ? " warning" : "");
  message.textContent = text;
  return message;
}

function signed(value) {
  return (value >= 0 ? "+" : "−") + formatNumber(Math.abs(value), 2);
}

function calcPosition() {
  const account = num(pcAccount);
  const risk = num(pcRisk);
  const entry = num(pcEntry);
  const stop = num(pcStop);
  const target = num(pcTarget);

  save("room-account", pcAccount.value);
  save("room-risk", pcRisk.value);

  if (!(account > 0 && risk > 0 && entry > 0 && stop > 0)) {
    pcResults.replaceChildren(calcMessage("Fill in account size, risk, entry and stop-loss."));
    return;
  }
  if (entry === stop) {
    pcResults.replaceChildren(calcMessage("Entry and stop-loss can't be the same price.", true));
    return;
  }

  const isLong = stop < entry;
  const riskAmount = account * risk / 100;
  const riskPerShare = Math.abs(entry - stop);
  const shares = Math.floor(riskAmount / riskPerShare);
  const positionValue = shares * entry;

  const rows = [
    resultRow("Direction", isLong ? "📈 Long (buy)" : "📉 Short (sell)"),
    resultRow("Shares to buy", shares.toLocaleString("en-US"), "big"),
    resultRow("Max loss if stopped", "−" + formatNumber(shares * riskPerShare, 2), "neg"),
    resultRow("Position size", formatNumber(positionValue, 2) + " (" + (positionValue / account * 100).toFixed(1) + "% of account)"),
  ];

  if (target > 0) {
    const reward = isLong ? target - entry : entry - target;
    if (reward > 0) {
      rows.push(resultRow("Profit at target", "+" + formatNumber(shares * reward, 2), "pos"));
      rows.push(resultRow("Risk : reward", "1 : " + (reward / riskPerShare).toFixed(2)));
    } else {
      rows.push(calcMessage("For a " + (isLong ? "long" : "short") + " trade the target should be " + (isLong ? "above" : "below") + " the entry price.", true));
    }
  }

  if (shares === 0) {
    rows.push(calcMessage("Your risk is too small to buy even 1 share with this stop-loss.", true));
  } else if (positionValue > account) {
    rows.push(calcMessage("This needs " + (positionValue / account).toFixed(1) + "× your account. Use a wider stop-loss or a smaller risk.", true));
  }

  pcResults.replaceChildren(...rows);
}

function calcProfit() {
  const buy = num(plBuy);
  const sell = num(plSell);
  const shares = num(plShares);
  const fees = num(plFees) || 0;

  if (!(buy > 0 && sell > 0 && shares > 0)) {
    plResults.replaceChildren(calcMessage("Fill in buy price, sell price and shares."));
    return;
  }

  const cost = buy * shares;
  const value = sell * shares;
  const profit = value - cost - fees;
  const percent = profit / cost * 100;
  const style = profit >= 0 ? "pos" : "neg";

  plResults.replaceChildren(
    resultRow("You paid", formatNumber(cost, 2)),
    resultRow("You sold for", formatNumber(value, 2)),
    resultRow(profit >= 0 ? "Profit" : "Loss", signed(profit), "big " + style),
    resultRow("Return", (percent >= 0 ? "+" : "−") + Math.abs(percent).toFixed(2) + "%", style),
    resultRow("Break-even sell price", formatNumber((cost + fees) / shares, 2)),
  );
}

function saveNotes() {
  notesStatus.textContent = "Saving…";
  clearTimeout(notesTimer);
  notesTimer = setTimeout(() => {
    save("room-notes", roomNotes.value);
    notesStatus.textContent = "Saved ✓ " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " (in this browser only)";
  }, 500);
}


function updateFullscreenButton() {
  fullscreenButton.textContent = document.fullscreenElement ? "⤡ Exit full screen" : "⛶ Full screen";
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await roomView.requestFullscreen();
    }
  } catch (error) {
    fullscreenButton.textContent = "Full screen isn't allowed here";
    setTimeout(updateFullscreenButton, 2000);
  }
}

function startRoom() {
  if (!roomLoaded) {
    buildLayoutButtons();
    buildChartWall();
    showRoomWidgets();
    roomLoaded = true;
  } else {
    renderRoomWatch();
  }
  roomTicks = 0;
  tickRoom();
  if (!roomTimer) {
    roomTimer = setInterval(tickRoom, 1000);
  }
}

function stopRoom() {
  clearInterval(roomTimer);
  roomTimer = null;
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
}


pcAccount.value = loadText("room-account", pcAccount.value);
pcRisk.value = loadText("room-risk", pcRisk.value);
roomNotes.value = loadText("room-notes", "");

for (const input of [pcAccount, pcRisk, pcEntry, pcStop, pcTarget]) {
  input.addEventListener("input", calcPosition);
}
for (const input of [plBuy, plSell, plShares, plFees]) {
  input.addEventListener("input", calcProfit);
}
roomNotes.addEventListener("input", saveNotes);
fullscreenButton.addEventListener("click", toggleFullscreen);
document.addEventListener("fullscreenchange", updateFullscreenButton);

document.addEventListener("keydown", (event) => {
  if (currentView !== "room" || event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }
  const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName);
  if (typing) {
    return;
  }
  if (event.key === "f" || event.key === "F") {
    event.preventDefault();
    toggleFullscreen();
  } else if (event.key === "/") {
    event.preventDefault();
    const cell = chartCell(selectedChart);
    if (cell) {
      cell.querySelector(".mini-search input").focus();
    }
  }
});

saveSetupButton.addEventListener("click", () => showSetupForm(true));
cancelSetupButton.addEventListener("click", () => showSetupForm(false));
setupForm.addEventListener("submit", saveSetup);
setupName.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    showSetupForm(false);
  }
});

window.addEventListener("blur", () => setTimeout(checkChartFocus, 0));
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (currentView === "room") {
      markTightBlocks();
    }
  }, 200);
});

calcPosition();
calcProfit();


const DONUT_COLORS = ["#2563eb", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#94a3b8"];

const summaryGrid = document.getElementById("summaryGrid");
const portfolioView = document.getElementById("portfolioView");
const portfolioTotal = document.getElementById("portfolioTotal");
const portfolioChange = document.getElementById("portfolioChange");
const donutArea = document.getElementById("donutArea");
const donut = document.getElementById("donut");
const donutLegend = document.getElementById("donutLegend");
const showAddButton = document.getElementById("showAddButton");
const addPanel = document.getElementById("addPanel");
const holdingAmount = document.getElementById("holdingAmount");
const holdingUnit = document.getElementById("holdingUnit");
const holdingUnitChips = document.getElementById("holdingUnitChips");
const holdingKaratChips = document.getElementById("holdingKaratChips");
const holdingCost = document.getElementById("holdingCost");
const holdingCostCurrency = document.getElementById("holdingCostCurrency");
const holdingError = document.getElementById("holdingError");
const saveHoldingButton = document.getElementById("saveHoldingButton");
const cancelHoldingButton = document.getElementById("cancelHoldingButton");
const holdingList = document.getElementById("holdingList");

const bellButton = document.getElementById("bellButton");
const bellCount = document.getElementById("bellCount");
const alertDrawer = document.getElementById("alertDrawer");
const drawerClose = document.getElementById("drawerClose");
const alertNow = document.getElementById("alertNow");
const alertTarget = document.getElementById("alertTarget");
const alertTargetUnit = document.getElementById("alertTargetUnit");
const alertHint = document.getElementById("alertHint");
const addAlertButton = document.getElementById("addAlertButton");
const alertList = document.getElementById("alertList");
const alertBanner = document.getElementById("alertBanner");
const alertBannerText = document.getElementById("alertBannerText");
const alertBannerClose = document.getElementById("alertBannerClose");
const currencyAlertButton = document.getElementById("currencyAlertButton");
const assetAlertButton = document.getElementById("assetAlertButton");

let mainCurrency = loadText("main-currency", "SAR");
let holdings = loadJson("portfolio");
let alerts = loadJson("alerts");
let allItems = [];
let holdingUnitChoice = "g";
let holdingKaratChoice = 24;


function loadJson(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : [];
  } catch (error) {
    return [];
  }
}

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function itemFor(value) {
  return allItems.find((item) => item.value === value);
}

function itemKind(value) {
  const [kind, code] = value.split(":");
  if (kind === "fiat") {
    return "fiat";
  }
  return assets[code] ? assets[code].type : "crypto";
}

function itemCode(value) {
  return value.split(":")[1];
}

function itemName(value) {
  const code = itemCode(value);
  if (value.startsWith("fiat:")) {
    return nameOf(code);
  }
  return assets[code] ? assets[code].name : code;
}

function buildAllItems() {
  const assetItems = buildAssetItems().map((item) => ({ ...item, value: "asset:" + item.value }));
  const fiatItems = currencyItems.map((item) => ({ ...item, value: "fiat:" + item.value, subtitle: item.subtitle || "Currency" }));
  return [...assetItems, ...fiatItems];
}

function priceOf(value, currency) {
  if (!fiatRates[currency]) {
    return null;
  }
  const code = itemCode(value);
  if (value.startsWith("fiat:")) {
    return fiatRates[code] ? fiatRates[currency] / fiatRates[code] : null;
  }
  const asset = assets[code];
  if (!asset) {
    return null;
  }
  if (asset.type === "metal") {
    return asset.priceUsd / GRAMS_PER_OUNCE * fiatRates[currency];
  }
  return asset.priceUsd * fiatRates[currency];
}

function priceUnitText(value) {
  const code = itemCode(value);
  if (assets[code] && assets[code].type === "metal") {
    return "per gram" + (code === "XAU" ? " (24K)" : "");
  }
  return "per 1 " + code;
}


function summaryCard(href, iconItem, title, value, bottomParts, onClick) {
  const card = document.createElement("a");
  card.className = "summary-card";
  card.href = href;

  const top = document.createElement("span");
  top.className = "summary-top";
  if (iconItem) {
    top.append(makeIcon(iconItem));
  }
  top.append(title);

  const amount = document.createElement("strong");
  amount.className = "summary-value";
  amount.textContent = value;

  const bottom = document.createElement("span");
  bottom.className = "summary-bottom";
  bottom.append(...bottomParts);

  card.append(top, amount, bottom);
  if (onClick) {
    card.addEventListener("click", onClick);
  }
  return card;
}

function changeSpan(change, suffix) {
  const span = document.createElement("span");
  span.className = "change " + (change >= 0 ? "up" : "down");
  span.textContent = changeText(change) + (suffix || "");
  return span;
}

function noteSpan(text) {
  const span = document.createElement("span");
  span.textContent = text;
  return span;
}

function renderSummary() {
  const cards = [];
  const currency = fiatRates[mainCurrency] ? mainCurrency : "USD";

  const btc = assets.BTC;
  const btcItem = itemFor("asset:BTC");
  if (btc && fiatRates[currency]) {
    const parts = typeof btc.change === "number" ? [changeSpan(btc.change)] : [noteSpan("Daily price")];
    if (btc.sparkline && btc.sparkline.length > 1) {
      parts.push(sparkline(btc.sparkline));
    }
    cards.push(summaryCard("#crypto", btcItem, "Bitcoin", money(priceOf("asset:BTC", currency), currency, true), parts, () => {
      assetPicker.setValue("BTC");
      convertAsset();
    }));
  } else {
    cards.push(summaryCard("#crypto", null, "₿ Bitcoin", "—", [noteSpan("Loading…")]));
  }

  const goldItem = itemFor("asset:XAU");
  if (assets.XAU && fiatRates[currency]) {
    cards.push(summaryCard("#crypto", goldItem, "Gold per gram (24K)", money(priceOf("asset:XAU", currency), currency), [noteSpan("Updated daily")], () => {
      assetPicker.setValue("XAU");
      convertAsset();
    }));
  } else {
    cards.push(summaryCard("#crypto", null, "🥇 Gold per gram", "—", [noteSpan("Loading…")]));
  }

  const base = currency === "USD" ? "EUR" : "USD";
  const baseItem = itemFor("fiat:" + base);
  if (fiatRates[base] && fiatRates[currency]) {
    cards.push(summaryCard("#currency", baseItem, "1 " + base + " in " + currency, rateText(fiatRates[currency] / fiatRates[base]) + " " + currency, [noteSpan("Updated " + fiatUpdated.slice(5, 11))], () => {
      fromPicker.setValue(base);
      toPicker.setValue(currency);
      convert();
    }));
  } else {
    cards.push(summaryCard("#currency", null, "💵 Exchange rate", "—", [noteSpan("Loading…")]));
  }

  const totals = portfolioTotals();
  const portfolioParts = [];
  if (holdings.length === 0) {
    portfolioParts.push(noteSpan("Add your first asset →"));
  } else if (totals.costCount > 0) {
    portfolioParts.push(changeSpan(totals.profitPercent, " total"));
  } else {
    portfolioParts.push(noteSpan(holdings.length + " asset" + (holdings.length === 1 ? "" : "s")));
  }
  cards.push(summaryCard("#portfolio", null, "💼 My portfolio", holdings.length && totals.ready ? money(totals.value, currency, true) : (holdings.length ? "—" : "Empty"), portfolioParts));

  summaryGrid.replaceChildren(...cards);
}


function holdingValue(holding, currency) {
  const price = priceOf(holding.item, currency);
  if (price === null) {
    return null;
  }
  const kind = itemKind(holding.item);
  if (kind === "metal") {
    const purity = itemCode(holding.item) === "XAU" ? (holding.karat || 24) / 24 : 1;
    return holding.amount * UNIT_GRAMS[holding.unit || "g"] * price * purity;
  }
  return holding.amount * price;
}

function holdingCostIn(holding, currency) {
  if (!(holding.cost > 0) || !fiatRates[holding.costCurrency] || !fiatRates[currency]) {
    return null;
  }
  return holding.cost / fiatRates[holding.costCurrency] * fiatRates[currency];
}

function portfolioTotals() {
  const currency = fiatRates[mainCurrency] ? mainCurrency : "USD";
  let value = 0;
  let costValue = 0;
  let cost = 0;
  let costCount = 0;
  let ready = true;

  for (const holding of holdings) {
    const current = holdingValue(holding, currency);
    if (current === null) {
      ready = false;
      continue;
    }
    value += current;
    const paid = holdingCostIn(holding, currency);
    if (paid !== null) {
      cost += paid;
      costValue += current;
      costCount++;
    }
  }

  return {
    value: value,
    ready: ready,
    costCount: costCount,
    profit: costValue - cost,
    profitPercent: cost > 0 ? (costValue - cost) / cost * 100 : 0,
  };
}

function amountText(holding) {
  const kind = itemKind(holding.item);
  const code = itemCode(holding.item);
  const amount = plainAmount(holding.amount);
  if (kind === "metal") {
    return amount + " " + (holding.unit || "g") + (code === "XAU" ? " • " + (holding.karat || 24) + "K" : "");
  }
  return amount + " " + code;
}

function renderDonut(slices, total, currency) {
  const svgNS = "http://www.w3.org/2000/svg";
  donut.replaceChildren();

  const background = document.createElementNS(svgNS, "circle");
  background.setAttribute("cx", "21");
  background.setAttribute("cy", "21");
  background.setAttribute("r", "15.915");
  background.setAttribute("stroke", "var(--border)");
  donut.append(background);

  let offset = 25;
  for (const slice of slices) {
    const circle = document.createElementNS(svgNS, "circle");
    circle.setAttribute("cx", "21");
    circle.setAttribute("cy", "21");
    circle.setAttribute("r", "15.915");
    circle.setAttribute("stroke", slice.color);
    circle.setAttribute("stroke-dasharray", slice.percent + " " + (100 - slice.percent));
    circle.setAttribute("stroke-dashoffset", String(offset));
    offset -= slice.percent;
    donut.append(circle);
  }

  const count = document.createElementNS(svgNS, "text");
  count.setAttribute("x", "21");
  count.setAttribute("y", "21");
  count.textContent = String(holdings.length);
  const label = document.createElementNS(svgNS, "text");
  label.setAttribute("x", "21");
  label.setAttribute("y", "25.5");
  label.setAttribute("class", "small");
  label.textContent = holdings.length === 1 ? "asset" : "assets";
  donut.append(count, label);

  donutLegend.replaceChildren(...slices.map((slice) => {
    const row = document.createElement("div");
    row.className = "legend-row";
    const dot = document.createElement("span");
    dot.className = "legend-dot";
    dot.style.background = slice.color;
    const name = document.createElement("span");
    name.textContent = slice.name;
    const percent = document.createElement("strong");
    percent.textContent = slice.percent.toFixed(1) + "%";
    row.append(dot, name, percent);
    row.title = money(slice.value, currency);
    return row;
  }));
}

function renderPortfolio() {
  const currency = fiatRates[mainCurrency] ? mainCurrency : "USD";
  const totals = portfolioTotals();

  holdingCostCurrency.textContent = currency;

  if (holdings.length === 0) {
    portfolioTotal.textContent = money(0, currency);
    portfolioChange.textContent = "Add your first asset to start tracking.";
    portfolioChange.className = "total-change";
    donutArea.hidden = true;
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No assets yet. Tap “+ Add asset” to add cash, crypto or gold you own.";
    holdingList.replaceChildren(empty);
    return;
  }

  portfolioTotal.textContent = totals.ready || totals.value > 0 ? money(totals.value, currency) : "Loading…";
  if (totals.costCount > 0) {
    portfolioChange.textContent = signed(totals.profit) + " " + currency + "  (" + (totals.profitPercent >= 0 ? "+" : "−") + Math.abs(totals.profitPercent).toFixed(2) + "%) total profit / loss";
    portfolioChange.className = "total-change " + (totals.profit >= 0 ? "up" : "down");
  } else {
    portfolioChange.textContent = "Add what you paid to see profit or loss.";
    portfolioChange.className = "total-change";
  }

  const rows = holdings.map((holding) => ({ holding: holding, value: holdingValue(holding, currency) }));
  rows.sort((a, b) => (b.value || 0) - (a.value || 0));

  const valued = rows.filter((row) => row.value > 0);
  if (valued.length > 0 && totals.value > 0) {
    const slices = [];
    valued.forEach((row, index) => {
      const percent = row.value / totals.value * 100;
      if (index < DONUT_COLORS.length - 1) {
        slices.push({ name: itemName(row.holding.item), value: row.value, percent: percent, color: DONUT_COLORS[index] });
      } else if (slices.length === DONUT_COLORS.length) {
        slices[slices.length - 1].value += row.value;
        slices[slices.length - 1].percent += percent;
      } else {
        slices.push({ name: "Other", value: row.value, percent: percent, color: DONUT_COLORS[DONUT_COLORS.length - 1] });
      }
    });
    donutArea.hidden = false;
    renderDonut(slices, totals.value, currency);
  } else {
    donutArea.hidden = true;
  }

  holdingList.replaceChildren(...rows.map((row) => {
    const holding = row.holding;
    const item = itemFor(holding.item) || { badge: itemCode(holding.item).slice(0, 1) };

    const line = document.createElement("div");
    line.className = "holding";

    const name = document.createElement("div");
    name.className = "holding-name";
    const title = document.createElement("strong");
    title.textContent = itemName(holding.item);
    const amount = document.createElement("small");
    amount.textContent = amountText(holding);
    name.append(title, amount);

    const value = document.createElement("div");
    value.className = "holding-value";
    const now = document.createElement("strong");
    now.textContent = row.value === null ? "—" : money(row.value, currency);
    const detail = document.createElement("small");
    const paid = holdingCostIn(holding, currency);
    if (row.value !== null && paid !== null) {
      const profit = row.value - paid;
      detail.textContent = signed(profit) + " (" + (profit >= 0 ? "+" : "−") + Math.abs(profit / paid * 100).toFixed(1) + "%)";
      detail.className = profit >= 0 ? "up" : "down";
    } else if (row.value !== null && totals.value > 0) {
      detail.textContent = (row.value / totals.value * 100).toFixed(1) + "% of portfolio";
    }
    value.append(now, detail);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "holding-delete";
    remove.textContent = "✕";
    remove.title = "Remove from portfolio";
    remove.addEventListener("click", () => {
      holdings = holdings.filter((entry) => entry.id !== holding.id);
      save("portfolio", JSON.stringify(holdings));
      renderPortfolio();
      renderSummary();
    });

    line.append(makeIcon(item), name, value, remove);
    return line;
  }));
}

function updateHoldingForm() {
  const value = holdingPicker.getValue();
  const kind = value ? itemKind(value) : "";
  const isMetal = kind === "metal";
  holdingUnitChips.hidden = !isMetal;
  holdingKaratChips.hidden = value !== "asset:XAU";
  holdingUnit.textContent = isMetal ? holdingUnitChoice : (value ? itemCode(value) : "");

  for (const chip of holdingUnitChips.querySelectorAll(".chip")) {
    chip.classList.toggle("active", chip.dataset.unit === holdingUnitChoice);
  }
  for (const chip of holdingKaratChips.querySelectorAll(".chip")) {
    chip.classList.toggle("active", Number(chip.dataset.karat) === holdingKaratChoice);
  }
}

function saveHolding() {
  const value = holdingPicker.getValue();
  const amount = parseFloat(holdingAmount.value);
  const cost = parseFloat(holdingCost.value);

  if (!value) {
    holdingError.textContent = "Pick an asset first.";
    holdingError.hidden = false;
    return;
  }
  if (!(amount > 0)) {
    holdingError.textContent = "Type how much you own (more than 0).";
    holdingError.hidden = false;
    return;
  }

  holdings.push({
    id: newId(),
    item: value,
    amount: amount,
    unit: itemKind(value) === "metal" ? holdingUnitChoice : null,
    karat: value === "asset:XAU" ? holdingKaratChoice : null,
    cost: cost > 0 ? cost : null,
    costCurrency: cost > 0 ? (fiatRates[mainCurrency] ? mainCurrency : "USD") : null,
  });
  save("portfolio", JSON.stringify(holdings));

  holdingAmount.value = "";
  holdingCost.value = "";
  holdingError.hidden = true;
  addPanel.hidden = true;
  showAddButton.hidden = false;
  renderPortfolio();
  renderSummary();
}


function activeAlerts() {
  return alerts.filter((alert) => !alert.done);
}

function updateBell() {
  const count = activeAlerts().length;
  bellCount.hidden = count === 0;
  bellCount.textContent = String(count);
}

function alertDescription(alert) {
  return itemName(alert.item) + (alert.direction === "above" ? " rises to " : " drops to ") + money(alert.target, alert.currency);
}

function renderAlerts() {
  updateBell();

  if (alerts.length === 0) {
    alertList.replaceChildren(calcMessage("No alerts yet."));
    return;
  }

  alertList.replaceChildren(...alerts.map((alert) => {
    const row = document.createElement("div");
    row.className = "alert-item" + (alert.done ? " done" : "");

    const item = itemFor(alert.item) || { badge: itemCode(alert.item).slice(0, 1) };
    const text = document.createElement("div");
    text.className = "alert-text";
    const title = document.createElement("strong");
    title.textContent = (alert.done ? "✓ " : "") + alertDescription(alert);
    const detail = document.createElement("small");
    const now = priceOf(alert.item, alert.currency);
    if (alert.done) {
      detail.textContent = "Reached at " + alert.doneAt;
    } else if (now !== null) {
      const gap = Math.abs(alert.target - now) / now * 100;
      detail.textContent = "Now " + money(now, alert.currency) + " • " + gap.toFixed(2) + "% away";
    } else {
      detail.textContent = "Waiting for prices…";
    }
    text.append(title, detail);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "holding-delete";
    remove.textContent = "✕";
    remove.title = "Delete alert";
    remove.addEventListener("click", () => {
      alerts = alerts.filter((entry) => entry.id !== alert.id);
      save("alerts", JSON.stringify(alerts));
      renderAlerts();
    });

    row.append(makeIcon(item), text, remove);
    return row;
  }));
}

function updateAlertForm() {
  const value = alertPicker.getValue();
  const currency = alertCurrencyPicker.getValue();
  const now = value && currency ? priceOf(value, currency) : null;
  const target = parseFloat(alertTarget.value);

  alertTargetUnit.textContent = currency;
  if (now === null) {
    alertNow.textContent = "";
    alertHint.textContent = "";
    return;
  }

  alertNow.replaceChildren("Now: ", Object.assign(document.createElement("strong"), { textContent: money(now, currency) }), " " + priceUnitText(value));
  if (target > 0) {
    const percent = (target - now) / now * 100;
    alertHint.textContent = target >= now
      ? "You'll be alerted when it rises " + percent.toFixed(2) + "% to this price."
      : "You'll be alerted when it drops " + Math.abs(percent).toFixed(2) + "% to this price.";
  } else {
    alertHint.textContent = "Type the price you want to be alerted at.";
  }
}

function roundForInput(value) {
  if (value >= 100) {
    return value.toFixed(2);
  }
  if (value >= 1) {
    return value.toFixed(4);
  }
  return value.toPrecision(4);
}

function openAlerts(value, currency) {
  if (value) {
    alertPicker.setValue(value);
  }
  if (currency) {
    alertCurrencyPicker.setValue(currency);
  }
  const now = alertPicker.getValue() ? priceOf(alertPicker.getValue(), alertCurrencyPicker.getValue()) : null;
  alertTarget.value = now !== null ? roundForInput(now) : "";
  alertDrawer.hidden = false;
  updateAlertForm();
  renderAlerts();
  alertTarget.focus();
}

async function addAlert() {
  const value = alertPicker.getValue();
  const currency = alertCurrencyPicker.getValue();
  const target = parseFloat(alertTarget.value);
  const now = value ? priceOf(value, currency) : null;

  if (!value || now === null || !(target > 0)) {
    alertHint.textContent = "Pick an asset and type a price above 0.";
    return;
  }
  if (Math.abs(target - now) / now < 0.0001) {
    alertHint.textContent = "That's the current price. Pick a higher or lower price.";
    return;
  }

  alerts.unshift({
    id: newId(),
    item: value,
    currency: currency,
    target: target,
    direction: target > now ? "above" : "below",
    done: false,
  });
  save("alerts", JSON.stringify(alerts));
  renderAlerts();
  alertHint.textContent = "✓ Alert set.";

  if ("Notification" in window && Notification.permission === "default") {
    try {
      await Notification.requestPermission();
    } catch (error) {}
  }
}

function beep() {
  try {
    const audio = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.25].forEach((delay) => {
      const tone = audio.createOscillator();
      const volume = audio.createGain();
      tone.frequency.value = 880;
      volume.gain.setValueAtTime(0.15, audio.currentTime + delay);
      volume.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + delay + 0.2);
      tone.connect(volume);
      volume.connect(audio.destination);
      tone.start(audio.currentTime + delay);
      tone.stop(audio.currentTime + delay + 0.2);
    });
  } catch (error) {}
}

function fireAlert(alert, price) {
  const message = "🔔 " + itemName(alert.item) + " reached your alert price " + money(alert.target, alert.currency) + " • now " + money(price, alert.currency);
  alertBannerText.textContent = message;
  alertBanner.hidden = false;
  beep();

  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification("Price alert", { body: message.replace("🔔 ", "").replace(/‎/g, "") });
    } catch (error) {}
  }
}

function checkAlerts() {
  let changed = false;
  for (const alert of alerts) {
    if (alert.done) {
      continue;
    }
    const price = priceOf(alert.item, alert.currency);
    if (price === null) {
      continue;
    }
    const reached = alert.direction === "above" ? price >= alert.target : price <= alert.target;
    if (reached) {
      alert.done = true;
      alert.doneAt = new Date().toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
      changed = true;
      fireAlert(alert, price);
    }
  }
  if (changed) {
    save("alerts", JSON.stringify(alerts));
  }
  renderAlerts();
}


function refreshMoneyViews() {
  if (currencyItems.length > 0) {
    allItems = buildAllItems();
    holdingPicker.setItems(allItems);
    alertPicker.setItems(allItems);
    if (!alertPicker.getValue() && itemFor("asset:BTC")) {
      alertPicker.setValue("asset:BTC");
    }
    if (!holdingPicker.getValue() && itemFor("asset:XAU")) {
      holdingPicker.setValue("asset:XAU");
    }
    updateHoldingForm();
  }
  renderSummary();
  renderPortfolio();
  checkAlerts();
  if (!alertDrawer.hidden) {
    updateAlertForm();
  }
}

function setupMoneyPickers() {
  mainCurrencyPicker.setItems(currencyItems);
  alertCurrencyPicker.setItems(currencyItems);
  if (!fiatRates[mainCurrency]) {
    mainCurrency = "USD";
  }
  mainCurrencyPicker.setValue(mainCurrency);
  alertCurrencyPicker.setValue(mainCurrency);
}


const mainCurrencyPicker = createPicker(document.getElementById("mainCurrencyPicker"), "Search country or currency…", () => {
  mainCurrency = mainCurrencyPicker.getValue();
  save("main-currency", mainCurrency);
  renderPortfolio();
  renderSummary();
});
const holdingPicker = createPicker(document.getElementById("holdingPicker"), "Search gold, bitcoin, dollar…", updateHoldingForm);
const alertPicker = createPicker(document.getElementById("alertPicker"), "Search bitcoin, gold, dollar…", () => openAlerts());
const alertCurrencyPicker = createPicker(document.getElementById("alertCurrencyPicker"), "Search country or currency…", () => openAlerts());

showAddButton.addEventListener("click", () => {
  addPanel.hidden = false;
  showAddButton.hidden = true;
  holdingError.hidden = true;
  updateHoldingForm();
  holdingAmount.focus();
});
cancelHoldingButton.addEventListener("click", () => {
  addPanel.hidden = true;
  showAddButton.hidden = false;
});
saveHoldingButton.addEventListener("click", saveHolding);
holdingUnitChips.addEventListener("click", (event) => {
  const chip = event.target.closest(".chip");
  if (chip) {
    holdingUnitChoice = chip.dataset.unit;
    updateHoldingForm();
  }
});
holdingKaratChips.addEventListener("click", (event) => {
  const chip = event.target.closest(".chip");
  if (chip) {
    holdingKaratChoice = Number(chip.dataset.karat);
    updateHoldingForm();
  }
});

bellButton.addEventListener("click", () => {
  if (alertDrawer.hidden) {
    openAlerts();
  } else {
    alertDrawer.hidden = true;
  }
});
drawerClose.addEventListener("click", () => {
  alertDrawer.hidden = true;
});
alertTarget.addEventListener("input", updateAlertForm);
addAlertButton.addEventListener("click", addAlert);
alertBannerClose.addEventListener("click", () => {
  alertBanner.hidden = true;
});
currencyAlertButton.addEventListener("click", () => {
  openAlerts("fiat:" + fromPicker.getValue(), toPicker.getValue());
});
assetAlertButton.addEventListener("click", () => {
  openAlerts("asset:" + assetPicker.getValue(), assetCurrencyPicker.getValue());
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !alertDrawer.hidden) {
    alertDrawer.hidden = true;
  }
});

renderSummary();
renderPortfolio();
renderAlerts();


function updateFooter() {
  if (currentView === "currency" && fiatUpdated) {
    updatedText.textContent = "Rates updated " + fiatUpdated;
  } else if (currentView === "crypto" && marketLoaded) {
    updatedText.textContent = (cryptoIsLive ? "Crypto prices live, refreshed " : "Prices refreshed ") + marketUpdated + " • metals update daily";
  } else {
    updatedText.textContent = "";
  }
}

const VIEW_TITLES = {
  currency: "Currency Converter",
  crypto: "Crypto & Gold",
  stocks: "Stock Market",
  room: "Trading Room",
  portfolio: "My Portfolio",
};

function route() {
  const urlSymbol = symbolFromUrl();
  if (urlSymbol && location.hash.replace("#", "").split("?")[0] === "room") {
    takeRoomSymbol(urlSymbol);
  } else if (urlSymbol) {
    readSymbolFromUrl();
    if (stocksLoaded) {
      showChart();
      showDetails();
      renderStockButtons();
    }
  }

  let view = location.hash.replace("#", "").split("?")[0];
  if (!["currency", "crypto", "stocks", "room", "portfolio"].includes(view)) {
    view = "home";
  }
  currentView = view;
  document.body.dataset.view = view;
  document.title = VIEW_TITLES[view] ? "FinDash · " + VIEW_TITLES[view] : "FinDash";

  homeView.hidden = view !== "home";
  currencyView.hidden = view !== "currency";
  cryptoView.hidden = view !== "crypto";
  stocksView.hidden = view !== "stocks";
  roomView.hidden = view !== "room";
  portfolioView.hidden = view !== "portfolio";
  topbar.hidden = view === "home";

  for (const tab of tabs) {
    tab.classList.toggle("active", tab.dataset.view === view);
  }

  if (view === "stocks") {
    startStocks();
  } else {
    stopStocks();
  }

  if (view === "room") {
    startRoom();
  } else {
    stopRoom();
  }

  updateFooter();
  window.scrollTo(0, 0);
}


const fromPicker = createPicker(document.getElementById("fromPicker"), "Search country or currency…", convert);
const toPicker = createPicker(document.getElementById("toPicker"), "Search country or currency…", convert);
const assetPicker = createPicker(document.getElementById("assetPicker"), "Search gold, bitcoin, ethereum…", convertAsset);
const assetCurrencyPicker = createPicker(document.getElementById("assetCurrencyPicker"), "Search country or currency…", () => {
  convertAsset();
  renderMarket();
});

amountInput.addEventListener("input", convert);
swapButton.addEventListener("click", swap);
copyButton.addEventListener("click", copyResult);
assetAmount.addEventListener("input", convertAsset);

unitChips.addEventListener("click", (event) => {
  const chip = event.target.closest(".chip");
  if (chip) {
    selectedUnit = chip.dataset.unit;
    convertAsset();
  }
});

karatChips.addEventListener("click", (event) => {
  const chip = event.target.closest(".chip");
  if (chip) {
    selectedKarat = Number(chip.dataset.karat);
    convertAsset();
  }
});

window.addEventListener("hashchange", route);

route();
loadFiat();
startMarket();
setInterval(loadFiat, 60 * 60 * 1000);
