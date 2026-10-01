/**
 * PesaJet Payments Demo Client Application
 */

// State
let activeLang = "node-sdk";
let currentApiKey = "";
let currentBaseUrl = "http://localhost:3000/api/v1";

// DOM Elements
const tabs = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");
const codeTabs = document.querySelectorAll(".code-tab");
const codeDisplay = document.getElementById("code-snippet-display");
const liveResponseContainer = document.getElementById(
  "live-response-container",
);
const responseStatusBadge = document.getElementById("response-status-badge");
const responseDuration = document.getElementById("response-duration");

// Form Inputs
const pgAmountInput = document.getElementById("pg-amount");
const pgPhoneInput = document.getElementById("pg-phone");
const pgProviderRadios = document.getElementsByName("pg-provider");
const pgRefInput = document.getElementById("pg-reference");
const pgDescInput = document.getElementById("pg-desc");
const pgDetectedBadge = document.getElementById("pg-detected-badge");
const pgExecuteBtn = document.getElementById("pg-execute-btn");
const copyCodeBtn = document.getElementById("copy-code-btn");

// Phone number carrier detection
function detectCarrier(phone) {
  const cleaned = phone.replace(/[\s\-\+]/g, "");
  if (/^(256|0)?(77|78|76|39)\d{7}$/.test(cleaned)) return "mtn";
  if (/^(256|0)?(70|75|74)\d{7}$/.test(cleaned)) return "airtel";
  return null;
}

function updateCarrierBadge(phone, badgeEl) {
  const carrier = detectCarrier(phone);
  if (carrier === "mtn") {
    badgeEl.innerHTML = `<i data-lucide="smartphone" class="w-3 h-3"></i><span>MTN MOMO</span>`;
    badgeEl.className =
      "absolute right-2.5 top-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1";
    for (const r of pgProviderRadios) {
      if (r.value === "mtn") r.checked = true;
    }
  } else if (carrier === "airtel") {
    badgeEl.innerHTML = `<i data-lucide="smartphone" class="w-3 h-3"></i><span>AIRTEL MONEY</span>`;
    badgeEl.className =
      "absolute right-2.5 top-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1";
    for (const r of pgProviderRadios) {
      if (r.value === "airtel") r.checked = true;
    }
  } else {
    badgeEl.innerHTML = `<i data-lucide="help-circle" class="w-3 h-3"></i><span>UNKNOWN</span>`;
    badgeEl.className =
      "absolute right-2.5 top-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1";
  }
  if (window.lucide) window.lucide.createIcons();
}

// Generate code snippet based on selected language and active inputs
function generateCodeSnippet() {
  const amount = pgAmountInput.value || "10000";
  const phone = pgPhoneInput.value || "+256770000000";
  let provider = "mtn";
  for (const r of pgProviderRadios) {
    if (r.checked) provider = r.value;
  }
  const ref = pgRefInput.value || "ORDER-123";
  const desc = pgDescInput.value || "Online Store Checkout";
  const apiKey = currentApiKey || "pk_live_your_api_key_here";

  let snippet = "";

  switch (activeLang) {
    case "node-sdk":
      snippet = `import { PesaJet } from "@pesajet/sdk";

const pesajet = new PesaJet({
  apiKey: "${apiKey}",
  baseUrl: "${currentBaseUrl}"
});

// Initiate Mobile Money Collection
const payment = await pesajet.payments.create({
  amount: ${amount},
  currency: "UGX",
  phoneNumber: "${phone}",
  provider: "${provider}",
  reference: "${ref}",
  description: "${desc}",
  metadata: {
    customerId: "cust_1092"
  }
});

console.log("Payment Initiated:", payment.transactionId);
console.log("Status:", payment.status); // PENDING`;
      break;

    case "node-fetch":
      snippet = `const response = await fetch("${currentBaseUrl}/payments", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "${apiKey}"
  },
  body: JSON.stringify({
    type: "COLLECTION",
    amount: ${amount},
    currency: "UGX",
    phoneNumber: "${phone}",
    provider: "${provider}",
    reference: "${ref}",
    description: "${desc}"
  })
});

const data = await response.json();
console.log("Transaction ID:", data.transactionId);`;
      break;

    case "python":
      snippet = `import requests

url = "${currentBaseUrl}/payments"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "${apiKey}"
}

payload = {
    "type": "COLLECTION",
    "amount": ${amount},
    "currency": "UGX",
    "phoneNumber": "${phone}",
    "provider": "${provider}",
    "reference": "${ref}",
    "description": "${desc}"
}

response = requests.post(url, json=payload, headers=headers)
data = response.json()
print(f"Transaction ID: {data.get('transactionId')}")
print(f"Status: {data.get('status')}")`;
      break;

    case "php":
      snippet = `<?php
$curl = curl_init();

$payload = [
    "type" => "COLLECTION",
    "amount" => ${amount},
    "currency" => "UGX",
    "phoneNumber" => "${phone}",
    "provider" => "${provider}",
    "reference" => "${ref}",
    "description" => "${desc}"
];

curl_setopt_array($curl, [
    CURLOPT_URL => "${currentBaseUrl}/payments",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_HTTPHEADER => [
        "Content-Type: application/json",
        "X-API-Key: ${apiKey}"
    ],
]);

$response = curl_exec($curl);
$data = json_decode($response, true);
curl_close($curl);

echo "Transaction ID: " . $data["transactionId"] . "\\n";
echo "Status: " . $data["status"] . "\\n";
?>`;
      break;

    case "curl":
      snippet = `curl -X POST "${currentBaseUrl}/payments" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey}" \\
  -d '{
    "type": "COLLECTION",
    "amount": ${amount},
    "currency": "UGX",
    "phoneNumber": "${phone}",
    "provider": "${provider}",
    "reference": "${ref}",
    "description": "${desc}"
  }'`;
      break;
  }

  codeDisplay.textContent = snippet;
}

// Event Listeners for Playground Inputs
[pgAmountInput, pgPhoneInput, pgRefInput, pgDescInput].forEach((el) => {
  el.addEventListener("input", () => {
    if (el === pgPhoneInput)
      updateCarrierBadge(pgPhoneInput.value, pgDetectedBadge);
    generateCodeSnippet();
  });
});

for (const r of pgProviderRadios) {
  r.addEventListener("change", generateCodeSnippet);
}

// Language selector tabs
codeTabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    codeTabs.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeLang = btn.getAttribute("data-lang");
    generateCodeSnippet();
  });
});

// Copy code snippet
copyCodeBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(codeDisplay.textContent);
  copyCodeBtn.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400"></i><span>Copied!</span>`;
  if (window.lucide) window.lucide.createIcons();
  setTimeout(() => {
    copyCodeBtn.innerHTML = `<i data-lucide="copy" class="w-3.5 h-3.5"></i><span>Copy Snippet</span>`;
    if (window.lucide) window.lucide.createIcons();
  }, 2000);
});

// Main Tab Navigation
tabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabs.forEach((b) => b.classList.remove("active"));
    tabContents.forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
    const target = btn.getAttribute("data-tab");
    document.getElementById(target).classList.add("active");
  });
});

// Execute live payment request from playground
pgExecuteBtn.addEventListener("click", async () => {
  pgExecuteBtn.disabled = true;
  pgExecuteBtn.innerHTML = `<span>⏳ Initiating USSD Push...</span>`;
  liveResponseContainer.innerHTML = `<span class="text-slate-400">Sending request to PesaJet API...</span>`;
  responseStatusBadge.classList.add("hidden");

  let provider = "mtn";
  for (const r of pgProviderRadios) {
    if (r.checked) provider = r.value;
  }

  try {
    const res = await fetch("/api/demo/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Number(pgAmountInput.value),
        phoneNumber: pgPhoneInput.value,
        provider,
        reference: pgRefInput.value,
        description: pgDescInput.value,
        customApiKey: currentApiKey,
      }),
    });

    const data = await res.json();
    responseDuration.textContent = `${data.durationMs || 0}ms`;

    if (res.ok && data.success) {
      responseStatusBadge.textContent = `HTTP ${res.status} CREATED`;
      responseStatusBadge.className =
        "px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      responseStatusBadge.classList.remove("hidden");
      liveResponseContainer.innerHTML = `<pre class="text-emerald-300">${JSON.stringify(data.transaction, null, 2)}</pre>`;
    } else {
      responseStatusBadge.textContent = `HTTP ${res.status} ERROR`;
      responseStatusBadge.className =
        "px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20";
      responseStatusBadge.classList.remove("hidden");
      liveResponseContainer.innerHTML = `<pre class="text-rose-300">${JSON.stringify(data, null, 2)}</pre>`;
    }
  } catch (err) {
    liveResponseContainer.innerHTML = `<span class="text-rose-400">Request Error: ${err.message}</span>`;
  } finally {
    pgExecuteBtn.disabled = false;
    pgExecuteBtn.innerHTML = `<span>🚀 Execute Live Payment Request</span>`;
  }
});

// Storefront Checkout Simulator
const sfForm = document.getElementById("storefront-form");
const sfPhoneInput = document.getElementById("sf-phone");
const sfProviderBadge = document.getElementById("sf-provider-badge");
const sfPayBtn = document.getElementById("sf-pay-btn");
const sfTracker = document.getElementById("sf-status-tracker");
const sfStatusText = document.getElementById("sf-status-text");
const sfStatusBadge = document.getElementById("sf-status-badge");
const sfTxnId = document.getElementById("sf-txn-id");
const sfPollCount = document.getElementById("sf-poll-count");
const step1 = document.getElementById("step-1");
const step2 = document.getElementById("step-2");
const step3 = document.getElementById("step-3");

sfPhoneInput.addEventListener("input", () => {
  updateCarrierBadge(sfPhoneInput.value, sfProviderBadge);
});

sfForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  sfPayBtn.disabled = true;
  sfPayBtn.innerHTML = "<span>⏳ Dispatching USSD Prompt...</span>";
  sfTracker.classList.remove("hidden");

  try {
    const res = await fetch("/api/demo/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 95000,
        phoneNumber: sfPhoneInput.value,
        reference: `SF-${Date.now()}`,
        description: "PesaJet Hoodie + Mug Purchase",
        customApiKey: currentApiKey,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      alert(`Payment failed: ${data.error || "Unknown error"}`);
      sfPayBtn.disabled = false;
      sfPayBtn.innerHTML = "<span>💳 Pay UGX 95,000 with Mobile Money</span>";
      return;
    }

    const txn = data.transaction;
    sfTxnId.textContent = txn.transactionId;
    step1.className =
      "p-2 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800";
    step2.className =
      "p-2 rounded-xl bg-indigo-950 text-indigo-300 border border-indigo-800 animate-pulse";

    // Start polling status
    let attempts = 0;
    const pollInterval = setInterval(async () => {
      attempts++;
      sfPollCount.textContent = String(attempts);

      try {
        const pollRes = await fetch(
          `/api/demo/status/${txn.transactionId}?apiKey=${currentApiKey}`,
        );
        const pollData = await pollRes.json();
        if (pollData.success) {
          const status = pollData.transaction.status;
          sfStatusBadge.textContent = status;

          if (status === "COMPLETED") {
            clearInterval(pollInterval);
            sfStatusText.textContent = "🎉 Payment Verified & Completed!";
            sfStatusBadge.className =
              "px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30";
            document.getElementById("sf-status-spinner").className = "hidden";
            step2.className =
              "p-2 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800";
            step3.className =
              "p-2 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800";
            sfPayBtn.innerHTML = "<span>✅ Order Completed</span>";
          } else if (status === "FAILED" || status === "EXPIRED") {
            clearInterval(pollInterval);
            sfStatusText.textContent = `❌ Payment ${status}: ${pollData.transaction.failureReason || "Cancelled"}`;
            sfStatusBadge.className =
              "px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30";
            document.getElementById("sf-status-spinner").className = "hidden";
            sfPayBtn.disabled = false;
            sfPayBtn.innerHTML = "<span>Retry Payment</span>";
          }
        }
      } catch {}

      if (attempts >= 20) {
        clearInterval(pollInterval);
      }
    }, 2500);
  } catch (err) {
    alert("Connection error: " + err.message);
    sfPayBtn.disabled = false;
    sfPayBtn.innerHTML = "<span>💳 Pay UGX 95,000 with Mobile Money</span>";
  }
});

// Fee Calculator Logic
const calcAmount = document.getElementById("calc-amount");
const calcType = document.getElementById("calc-type");
const calcProvider = document.getElementById("calc-provider");
const resCalcAmount = document.getElementById("res-calc-amount");
const resCalcPlatformFee = document.getElementById("res-calc-platform-fee");
const resCalcProviderFee = document.getElementById("res-calc-provider-fee");
const resCalcNetLabel = document.getElementById("res-calc-net-label");
const resCalcNetAmount = document.getElementById("res-calc-net-amount");

async function recalculateFees() {
  const amount = Number(calcAmount.value) || 0;
  const type = calcType.value;
  const provider = calcProvider.value;

  resCalcAmount.textContent = `UGX ${amount.toLocaleString()}`;

  try {
    const res = await fetch(
      `/api/demo/preview?amount=${amount}&type=${type}&provider=${provider}&apiKey=${currentApiKey}`,
    );
    const data = await res.json();
    if (data.success) {
      const p = data.preview;
      resCalcPlatformFee.textContent = `UGX ${(p.platformFee || 0).toLocaleString()}`;
      resCalcProviderFee.textContent = `UGX ${(p.providerFee || 0).toLocaleString()}`;

      if (type === "COLLECTION") {
        resCalcNetLabel.textContent = "Net Credited to Merchant:";
        resCalcNetAmount.textContent = `UGX ${(p.netAmount || 0).toLocaleString()}`;
        resCalcNetAmount.className = "font-mono text-emerald-400";
      } else {
        resCalcNetLabel.textContent = "Total Wallet Cost:";
        resCalcNetAmount.textContent = `UGX ${(p.totalCost || 0).toLocaleString()}`;
        resCalcNetAmount.className = "font-mono text-amber-400";
      }
    }
  } catch {}
}

[calcAmount, calcType, calcProvider].forEach((el) =>
  el.addEventListener("input", recalculateFees),
);

// Transactions Ledger Feed
const refreshHistoryBtn = document.getElementById("refresh-history-btn");
const historyTableBody = document.getElementById("history-table-body");

async function loadHistory() {
  historyTableBody.innerHTML = `<tr><td colspan="8" class="py-4 text-center text-slate-500 font-sans">Fetching transactions...</td></tr>`;

  try {
    const res = await fetch(`/api/demo/history?apiKey=${currentApiKey}`);
    const data = await res.json();

    if (data.success && data.data && data.data.length > 0) {
      historyTableBody.innerHTML = data.data
        .map((tx) => {
          const statusClass =
            tx.status === "COMPLETED"
              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
              : tx.status === "PENDING"
                ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                : "text-rose-400 bg-rose-500/10 border-rose-500/20";

          return `
          <tr class="hover:bg-slate-900/60 transition">
            <td class="py-2.5 font-mono text-slate-200">${tx.transactionId.slice(0, 12)}...</td>
            <td class="py-2.5"><span class="px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusClass}">${tx.status}</span></td>
            <td class="py-2.5 text-slate-400">${tx.type || "COLLECTION"}</td>
            <td class="py-2.5 font-bold text-white">${Number(tx.amount).toLocaleString()} ${tx.currency}</td>
            <td class="py-2.5 uppercase text-slate-300 font-bold">${tx.provider}</td>
            <td class="py-2.5 text-slate-400">${tx.phoneNumber}</td>
            <td class="py-2.5 text-slate-400">${tx.reference}</td>
            <td class="py-2.5 text-slate-500">${new Date(tx.createdAt).toLocaleTimeString()}</td>
          </tr>
        `;
        })
        .join("");
    } else {
      historyTableBody.innerHTML = `<tr><td colspan="8" class="py-4 text-center text-slate-500 font-sans">No transactions found for this API key.</td></tr>`;
    }
  } catch (err) {
    historyTableBody.innerHTML = `<tr><td colspan="8" class="py-4 text-center text-rose-400 font-sans">Failed to load history: ${err.message}</td></tr>`;
  }
}

refreshHistoryBtn.addEventListener("click", loadHistory);

// Modal Configuration Logic
const configModal = document.getElementById("config-modal");
const openConfigBtn = document.getElementById("open-config-btn");
const closeConfigBtn = document.getElementById("close-config-btn");
const saveConfigBtn = document.getElementById("save-config-btn");
const cfgBaseUrl = document.getElementById("cfg-base-url");
const cfgApiKey = document.getElementById("cfg-api-key");
const navApiKey = document.getElementById("nav-api-key");
const navBaseUrl = document.getElementById("nav-base-url");

openConfigBtn.addEventListener("click", () =>
  configModal.classList.remove("hidden"),
);
closeConfigBtn.addEventListener("click", () =>
  configModal.classList.add("hidden"),
);

saveConfigBtn.addEventListener("click", () => {
  currentApiKey = cfgApiKey.value.trim();
  currentBaseUrl = cfgBaseUrl.value.trim();
  navApiKey.textContent = currentApiKey.slice(0, 10) + "...";
  navBaseUrl.textContent = currentBaseUrl;
  configModal.classList.add("hidden");
  generateCodeSnippet();
  loadHistory();
  recalculateFees();
});

// Initialization
async function init() {
  try {
    const res = await fetch("/api/demo/config");
    const cfg = await res.json();
    currentApiKey = cfg.apiKey;
    currentBaseUrl = cfg.baseUrl;
    cfgApiKey.value = cfg.apiKey;
    cfgBaseUrl.value = cfg.baseUrl;
    navApiKey.textContent = cfg.apiKeyMasked;
    navBaseUrl.textContent = cfg.baseUrl;
  } catch {}

  updateCarrierBadge(pgPhoneInput.value, pgDetectedBadge);
  generateCodeSnippet();
  recalculateFees();
}

init();
