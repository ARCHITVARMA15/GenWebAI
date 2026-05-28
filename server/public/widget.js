(function () {
  'use strict';

  window.SiteChat = {
    init: function (config) {
      var primaryColor = config.primaryColor || '#6366f1';
      var apiBase = config.apiBase || '';
      var websiteId = config.websiteId || '';
      var conversationHistory = [];
      var panelOpen = false;

      var style = document.createElement('style');
      style.textContent =
        '#sc-bubble{position:fixed;bottom:24px;right:24px;width:54px;height:54px;border-radius:50%;background:' + primaryColor + ';cursor:pointer;z-index:999999;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 24px rgba(0,0,0,0.3);transition:transform 0.2s;}' +
        '#sc-bubble:hover{transform:scale(1.1);}' +
        '#sc-panel{position:fixed;bottom:90px;right:24px;width:320px;height:460px;background:#fff;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,0.2);z-index:999999;display:none;flex-direction:column;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}' +
        '#sc-header{background:' + primaryColor + ';color:#fff;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;font-size:14px;font-weight:600;flex-shrink:0;}' +
        '#sc-close{cursor:pointer;background:none;border:none;color:#fff;font-size:20px;line-height:1;padding:0;opacity:0.85;}' +
        '#sc-close:hover{opacity:1;}' +
        '#sc-messages{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;}' +
        '.sc-msg-user{align-self:flex-end;background:' + primaryColor + ';color:#fff;padding:8px 12px;border-radius:12px 12px 2px 12px;max-width:80%;font-size:13px;line-height:1.45;word-break:break-word;}' +
        '.sc-msg-ai{align-self:flex-start;background:#f3f4f6;color:#111;padding:8px 12px;border-radius:12px 12px 12px 2px;max-width:80%;font-size:13px;line-height:1.45;word-break:break-word;}' +
        '#sc-input-row{display:flex;border-top:1px solid #e5e7eb;padding:8px;gap:6px;flex-shrink:0;}' +
        '#sc-input{flex:1;padding:8px 12px;border:1px solid #e5e7eb;border-radius:8px;outline:none;font-size:13px;font-family:inherit;}' +
        '#sc-input:focus{border-color:' + primaryColor + ';}' +
        '#sc-send{background:' + primaryColor + ';color:#fff;border:none;border-radius:8px;padding:0 14px;height:36px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;}' +
        '#sc-send:hover{opacity:0.9;}' +
        '.sc-typing{display:flex;gap:4px;padding:10px 14px;background:#f3f4f6;border-radius:12px 12px 12px 2px;align-self:flex-start;}' +
        '.sc-dot{width:6px;height:6px;background:#9ca3af;border-radius:50%;animation:scBounce 1.2s infinite;}' +
        '.sc-dot:nth-child(2){animation-delay:0.2s;}' +
        '.sc-dot:nth-child(3){animation-delay:0.4s;}' +
        '@keyframes scBounce{0%,60%,100%{transform:translateY(0);}30%{transform:translateY(-6px);}}';
      document.head.appendChild(style);

      var bubble = document.createElement('div');
      bubble.id = 'sc-bubble';
      bubble.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';

      var panel = document.createElement('div');
      panel.id = 'sc-panel';
      panel.innerHTML =
        '<div id="sc-header"><span>Ask about this site</span><button id="sc-close" aria-label="Close">&#x2715;</button></div>' +
        '<div id="sc-messages"></div>' +
        '<div id="sc-input-row"><input id="sc-input" type="text" placeholder="Ask a question..." autocomplete="off" /><button id="sc-send">Send</button></div>';

      document.body.appendChild(bubble);
      document.body.appendChild(panel);

      var messagesDiv = document.getElementById('sc-messages');
      var inputEl = document.getElementById('sc-input');
      var panelEl = document.getElementById('sc-panel');

      var welcome = document.createElement('div');
      welcome.className = 'sc-msg-ai';
      welcome.textContent = 'Hi! I\'m the AI assistant for this site. Ask me anything about it! \uD83D\uDC4B';
      messagesDiv.appendChild(welcome);

      function scrollBottom() {
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      }

      function appendMessage(text, role) {
        var div = document.createElement('div');
        div.className = role === 'user' ? 'sc-msg-user' : 'sc-msg-ai';
        div.textContent = text;
        messagesDiv.appendChild(div);
        scrollBottom();
        return div;
      }

      function showTyping() {
        var div = document.createElement('div');
        div.className = 'sc-typing';
        div.id = 'sc-typing';
        div.innerHTML = '<div class="sc-dot"></div><div class="sc-dot"></div><div class="sc-dot"></div>';
        messagesDiv.appendChild(div);
        scrollBottom();
      }

      function removeTyping() {
        var t = document.getElementById('sc-typing');
        if (t) t.parentNode.removeChild(t);
      }

      function sendMessage() {
        var question = inputEl.value.trim();
        if (!question) return;
        inputEl.value = '';

        appendMessage(question, 'user');
        conversationHistory.push({ role: 'user', content: question });
        if (conversationHistory.length > 20) {
          conversationHistory = conversationHistory.slice(-20);
        }

        showTyping();

        fetch(apiBase + '/api/chat/' + websiteId, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: question, history: conversationHistory.slice(-6) })
        })
          .then(function (res) { return res.json(); })
          .then(function (data) {
            removeTyping();
            var answer = data.answer || 'Sorry, something went wrong. Try again.';
            appendMessage(answer, 'ai');
            conversationHistory.push({ role: 'assistant', content: answer });
            if (conversationHistory.length > 20) {
              conversationHistory = conversationHistory.slice(-20);
            }
          })
          .catch(function () {
            removeTyping();
            appendMessage('Sorry, something went wrong. Try again.', 'ai');
          });
      }

      bubble.addEventListener('click', function () {
        panelOpen = !panelOpen;
        panelEl.style.display = panelOpen ? 'flex' : 'none';
        if (panelOpen) { scrollBottom(); inputEl.focus(); }
      });

      document.getElementById('sc-close').addEventListener('click', function () {
        panelOpen = false;
        panelEl.style.display = 'none';
      });

      document.getElementById('sc-send').addEventListener('click', sendMessage);

      inputEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') sendMessage();
      });
    }
  };
})();
