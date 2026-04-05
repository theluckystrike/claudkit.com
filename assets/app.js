/* ClaudKit — API Playground */

var PRESETS = {
  summarize: {
    name: "Summarize Text",
    system: "You are a concise summarizer. Output a 2-3 sentence summary.",
    user: "Summarize the following article:\n\nThe rise of large language models has transformed how software is built. Companies that once employed large teams of developers for routine coding tasks are now finding that AI assistants can handle boilerplate code, documentation, and testing. However, the most significant impact is not on code generation but on code review, where AI models can analyze thousands of lines in seconds and catch bugs that human reviewers miss.",
    temperature: 0.3,
    maxTokens: 256
  },
  translate: {
    name: "Translate",
    system: "You are a professional translator. Translate accurately while preserving tone and nuance.",
    user: "Translate the following English text to Spanish:\n\nThe best way to learn a new programming language is to build something you care about. Tutorials teach syntax, but projects teach problem-solving.",
    temperature: 0.2,
    maxTokens: 512
  },
  codereview: {
    name: "Code Review",
    system: "You are a senior software engineer. Review code for bugs, security issues, and improvements. Be specific and actionable.",
    user: "Review this Python function:\n\ndef get_user(user_id):\n    query = f\"SELECT * FROM users WHERE id = {user_id}\"\n    result = db.execute(query)\n    return result[0]",
    temperature: 0.2,
    maxTokens: 1024
  },
  creative: {
    name: "Creative Writing",
    system: "You are a creative writing assistant. Write vivid, engaging prose.",
    user: "Write a 100-word opening paragraph for a sci-fi short story set on a space station where gravity has just failed.",
    temperature: 0.9,
    maxTokens: 512
  },
  extract: {
    name: "Data Extraction",
    system: "You extract structured data from unstructured text. Always respond with valid JSON.",
    user: "Extract the person's name, company, role, and email from this text:\n\nHi, I'm Sarah Chen and I lead the ML infrastructure team at Nexus AI. We're looking for tools to monitor our model pipelines. Feel free to reach me at sarah.chen@nexusai.com.",
    temperature: 0.0,
    maxTokens: 256
  }
};

var MODELS = [
  "claude-sonnet-4-20250514",
  "claude-opus-4-20250514",
  "claude-haiku-4-20250514"
];

var currentTab = "curl";

function getFormValues() {
  return {
    model: document.getElementById("model-select").value,
    system: document.getElementById("system-prompt").value,
    user: document.getElementById("user-message").value,
    temperature: parseFloat(document.getElementById("temp-slider").value),
    maxTokens: parseInt(document.getElementById("max-tokens").value, 10) || 1024
  };
}

function generateCurl(vals) {
  var body = JSON.stringify({
    model: vals.model,
    max_tokens: vals.maxTokens,
    system: vals.system,
    messages: [{ role: "user", content: vals.user }],
    temperature: vals.temperature
  }, null, 2);

  return 'curl https://api.anthropic.com/v1/messages \\\n' +
    '  -H "content-type: application/json" \\\n' +
    '  -H "x-api-key: $ANTHROPIC_API_KEY" \\\n' +
    '  -H "anthropic-version: 2023-06-01" \\\n' +
    '  -d \'' + body + '\'';
}

function generatePython(vals) {
  var sys = escapeStr(vals.system);
  var usr = escapeStr(vals.user);
  return 'import anthropic\n\n' +
    'client = anthropic.Anthropic()\n\n' +
    'message = client.messages.create(\n' +
    '    model="' + vals.model + '",\n' +
    '    max_tokens=' + vals.maxTokens + ',\n' +
    '    temperature=' + vals.temperature + ',\n' +
    '    system="' + sys + '",\n' +
    '    messages=[\n' +
    '        {"role": "user", "content": "' + usr + '"}\n' +
    '    ]\n' +
    ')\n\n' +
    'print(message.content[0].text)';
}

function generateJavaScript(vals) {
  var sys = escapeStr(vals.system);
  var usr = escapeStr(vals.user);
  return 'import Anthropic from "@anthropic-ai/sdk";\n\n' +
    'const client = new Anthropic();\n\n' +
    'const message = await client.messages.create({\n' +
    '  model: "' + vals.model + '",\n' +
    '  max_tokens: ' + vals.maxTokens + ',\n' +
    '  temperature: ' + vals.temperature + ',\n' +
    '  system: "' + sys + '",\n' +
    '  messages: [\n' +
    '    { role: "user", content: "' + usr + '" }\n' +
    '  ]\n' +
    '});\n\n' +
    'console.log(message.content[0].text);';
}

function escapeStr(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

function highlightCode(code, lang) {
  var escaped = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  /* Strings */
  escaped = escaped.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, '<span class="str">$&</span>');

  /* Comments */
  escaped = escaped.replace(/(#[^\n]*|\/\/[^\n]*)/g, '<span class="comment">$&</span>');

  /* Keywords */
  var kwList;
  if (lang === "python") {
    kwList = ["import", "from", "def", "class", "return", "if", "else", "for", "while", "try", "except", "with", "as", "print", "True", "False", "None", "await", "async"];
  } else if (lang === "javascript") {
    kwList = ["import", "from", "const", "let", "var", "function", "return", "if", "else", "for", "while", "try", "catch", "new", "await", "async", "export", "default", "true", "false", "null"];
  } else {
    kwList = ["curl"];
  }
  for (var i = 0; i < kwList.length; i++) {
    var re = new RegExp("\\b(" + kwList[i] + ")\\b", "g");
    escaped = escaped.replace(re, '<span class="kw">$1</span>');
  }

  /* Numbers */
  escaped = escaped.replace(/\b(\d+\.?\d*)\b/g, '<span class="num">$1</span>');

  return escaped;
}

function updateCodeDisplay() {
  var vals = getFormValues();
  var code, lang;
  if (currentTab === "curl") {
    code = generateCurl(vals);
    lang = "bash";
  } else if (currentTab === "python") {
    code = generatePython(vals);
    lang = "python";
  } else {
    code = generateJavaScript(vals);
    lang = "javascript";
  }
  var block = document.getElementById("code-display");
  if (block) {
    block.innerHTML = highlightCode(code, lang);
  }
  updatePricingEstimate();
}

function copyCode() {
  var vals = getFormValues();
  var code;
  if (currentTab === "curl") { code = generateCurl(vals); }
  else if (currentTab === "python") { code = generatePython(vals); }
  else { code = generateJavaScript(vals); }
  navigator.clipboard.writeText(code).then(function() {
    var btn = document.getElementById("copy-code-btn");
    if (btn) {
      btn.textContent = "Copied!";
      setTimeout(function() { btn.textContent = "Copy"; }, 1500);
    }
  });
}

function loadPreset(key) {
  var p = PRESETS[key];
  if (!p) return;
  document.getElementById("system-prompt").value = p.system;
  document.getElementById("user-message").value = p.user;
  document.getElementById("temp-slider").value = p.temperature;
  document.getElementById("temp-value").textContent = p.temperature;
  document.getElementById("max-tokens").value = p.maxTokens;
  updateCodeDisplay();
}

function sendRequest() {
  var apiKey = document.getElementById("api-key").value.trim();
  if (!apiKey) {
    showStatus("Please enter your API key.", true);
    return;
  }
  var vals = getFormValues();
  var responseArea = document.getElementById("response-area");
  var statusEl = document.getElementById("status-msg");

  showStatus("Sending request...", false);
  responseArea.classList.remove("visible");

  var body = JSON.stringify({
    model: vals.model,
    max_tokens: vals.maxTokens,
    system: vals.system,
    messages: [{ role: "user", content: vals.user }],
    temperature: vals.temperature
  });

  fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: body
  })
  .then(function(res) { return res.json(); })
  .then(function(data) {
    responseArea.textContent = JSON.stringify(data, null, 2);
    responseArea.classList.add("visible");
    if (data.error) {
      showStatus("Error: " + data.error.message, true);
    } else {
      showStatus("Success! " + (data.usage ? data.usage.input_tokens + " input, " + data.usage.output_tokens + " output tokens" : ""), false);
    }
  })
  .catch(function(err) {
    showStatus("Request failed: " + err.message, true);
  });
}

function showStatus(msg, isError) {
  var el = document.getElementById("status-msg");
  if (el) {
    el.textContent = msg;
    el.className = "status-msg" + (isError ? " error" : "");
  }
}

function initApp() {
  /* Model selector */
  var modelSelect = document.getElementById("model-select");
  if (!modelSelect) return;
  for (var i = 0; i < MODELS.length; i++) {
    var opt = document.createElement("option");
    opt.value = MODELS[i];
    opt.textContent = MODELS[i];
    modelSelect.appendChild(opt);
  }

  /* Temperature slider */
  var slider = document.getElementById("temp-slider");
  var tempVal = document.getElementById("temp-value");
  if (slider && tempVal) {
    slider.addEventListener("input", function() {
      tempVal.textContent = this.value;
      updateCodeDisplay();
    });
  }

  /* Form change listeners */
  var fields = ["model-select", "system-prompt", "user-message", "max-tokens"];
  for (var i = 0; i < fields.length; i++) {
    var el = document.getElementById(fields[i]);
    if (el) {
      el.addEventListener("input", updateCodeDisplay);
      el.addEventListener("change", updateCodeDisplay);
    }
  }

  /* Tabs */
  var tabs = document.querySelectorAll(".tab");
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener("click", function() {
      currentTab = this.getAttribute("data-tab");
      for (var j = 0; j < tabs.length; j++) {
        tabs[j].classList.toggle("active", tabs[j] === this);
      }
      updateCodeDisplay();
    });
  }

  /* Preset */
  var presetSelect = document.getElementById("preset-select");
  if (presetSelect) {
    var defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.textContent = "Choose a preset...";
    presetSelect.appendChild(defaultOpt);
    var keys = Object.keys(PRESETS);
    for (var i = 0; i < keys.length; i++) {
      var opt = document.createElement("option");
      opt.value = keys[i];
      opt.textContent = PRESETS[keys[i]].name;
      presetSelect.appendChild(opt);
    }
    presetSelect.addEventListener("change", function() {
      if (this.value) loadPreset(this.value);
    });
  }

  /* Copy + Send */
  document.getElementById("copy-code-btn").addEventListener("click", copyCode);
  document.getElementById("send-btn").addEventListener("click", sendRequest);

  /* Daily uses slider */
  var dailySlider = document.getElementById("daily-uses-slider");
  var dailyDisplay = document.getElementById("daily-uses-display");
  if (dailySlider && dailyDisplay) {
    dailySlider.addEventListener("input", function() {
      dailyDisplay.textContent = this.value;
      updatePricingEstimate();
    });
  }

  /* Initial render */
  loadPreset("summarize");
}

/* --- Pricing Estimator --- */

var PRICING = {
  "claude-haiku-4-20250514": { label: "Haiku", inputPer1M: 0.25, outputPer1M: 1.25 },
  "claude-sonnet-4-20250514": { label: "Sonnet", inputPer1M: 3.00, outputPer1M: 15.00 },
  "claude-opus-4-20250514": { label: "Opus", inputPer1M: 15.00, outputPer1M: 75.00 }
};

function estimateTokensFromText(text) {
  var words = text.split(/\s+/).filter(function(w) { return w.length > 0; });
  return Math.ceil(words.length * 1.3);
}

function formatUSD(n) {
  if (n < 0.0001) return "<$0.0001";
  if (n < 0.01) return "$" + n.toFixed(4);
  return "$" + n.toFixed(4);
}

function calcPricingRow(label, inputTokens, outputTokens, inputPer1M, outputPer1M) {
  var cost = (inputTokens / 1e6) * inputPer1M + (outputTokens / 1e6) * outputPer1M;
  return '<tr><td>' + label + '</td><td>' + inputTokens.toLocaleString() + '</td>' +
    '<td>' + outputTokens.toLocaleString() + '</td><td class="cost-val">' + formatUSD(cost) + '</td></tr>';
}

function updatePricingEstimate() {
  var container = document.getElementById("pricing-estimate");
  if (!container) return;
  var vals = getFormValues();
  var sysTokens = estimateTokensFromText(vals.system);
  var userTokens = estimateTokensFromText(vals.user);
  var inputTokens = sysTokens + userTokens;
  var outputTokens = vals.maxTokens;

  var html = '<div class="pricing-header">Estimated Cost for This Request</div>';
  html += '<table class="pricing-table"><thead><tr><th>Model</th><th>Input Tokens</th><th>Output Tokens</th><th>Cost</th></tr></thead><tbody>';

  var keys = Object.keys(PRICING);
  for (var i = 0; i < keys.length; i++) {
    var p = PRICING[keys[i]];
    html += calcPricingRow(p.label, inputTokens, outputTokens, p.inputPer1M, p.outputPer1M);
  }
  html += '</tbody></table>';

  // Monthly estimator
  var dailyUses = parseInt(document.getElementById("daily-uses-slider").value, 10) || 10;
  html += '<div class="monthly-header">Monthly Cost (' + dailyUses + ' requests/day)</div>';
  html += '<table class="pricing-table"><thead><tr><th>Model</th><th>Daily</th><th>Monthly (30 days)</th></tr></thead><tbody>';
  for (var j = 0; j < keys.length; j++) {
    var pm = PRICING[keys[j]];
    var perReq = (inputTokens / 1e6) * pm.inputPer1M + (outputTokens / 1e6) * pm.outputPer1M;
    var daily = perReq * dailyUses;
    var monthly = daily * 30;
    html += '<tr><td>' + pm.label + '</td><td>' + formatUSD(daily) + '</td><td class="cost-val">' + formatUSD(monthly) + '</td></tr>';
  }
  html += '</tbody></table>';

  container.innerHTML = html;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}


// === Zovo V5 Pro Nudge System ===
(function() {
  var V5_LIMIT = 4;
  var V5_FEATURE = 'All programming languages';
  var v5Count = 0;
  var v5Shown = false;

  function v5ShowNudge() {
    if (v5Shown || sessionStorage.getItem('v5_pro_nudge')) return;
    v5Shown = true;
    sessionStorage.setItem('v5_pro_nudge', '1');
    var host = location.hostname;
    var el = document.createElement('div');
    el.className = 'pro-nudge';
    el.innerHTML = '<div class="pro-nudge-inner">' +
      '<span class="pro-nudge-icon">\u2726</span>' +
      '<div class="pro-nudge-text">' +
      '<strong>' + V5_FEATURE + '</strong> is a Pro feature. ' +
      '<a href="https://zovo.one/pricing?utm_source=' + host +
      '&utm_medium=satellite&utm_campaign=pro-nudge" target="_blank">' +
      'Get Zovo Lifetime \u2014 $99 once, access everything forever.</a>' +
      '</div></div>';
    var target = document.querySelector('main') ||
      document.querySelector('.tool-section') ||
      document.querySelector('.container') ||
      document.querySelector('section') ||
      document.body;
    if (target) target.appendChild(el);
  }

  // Track meaningful user actions (button clicks, form submits)
  document.addEventListener('click', function(e) {
    var t = e.target;
    if (t.closest('button, [onclick], .btn, input[type="submit"], input[type="button"]')) {
      v5Count++;
      if (v5Count >= V5_LIMIT) v5ShowNudge();
    }
  }, true);

  // Track file drops/selections (for file-based tools)
  document.addEventListener('change', function(e) {
    if (e.target && e.target.type === 'file') {
      v5Count++;
      if (v5Count >= V5_LIMIT) v5ShowNudge();
    }
  }, true);
})();
