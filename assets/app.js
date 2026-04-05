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

  /* Initial render */
  loadPreset("summarize");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
