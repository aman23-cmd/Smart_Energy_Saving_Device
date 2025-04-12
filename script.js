// 🔋 Live Usage Number
function updateUsage() {
    const usage = (Math.random() * (5 - 1) + 1).toFixed(2);
    document.getElementById("current-usage").textContent = `${usage} kWh`;
  }
  setInterval(updateUsage, 3000);
  updateUsage();
  
  // 📈 Chart.js Live Graph
  const ctx = document.getElementById('energyChart').getContext('2d');
  const data = {
    labels: [],
    datasets: [{
      label: 'Energy Usage (kWh)',
      data: [],
      borderColor: '#00ffcc',
      backgroundColor: 'rgba(0, 255, 204, 0.2)',
      tension: 0.4,
      fill: true
    }]
  };
  
  const config = {
    type: 'line',
    data: data,
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: 'white'
          }
        }
      },
      scales: {
        x: {
          ticks: { color: 'white' }
        },
        y: {
          ticks: { color: 'white' },
          beginAtZero: true
        }
      }
    }
  };
  
  const energyChart = new Chart(ctx, config);
  
  // 🕒 Auto Update Chart
  setInterval(() => {
    const now = new Date().toLocaleTimeString();
    const usage = (Math.random() * (5 - 1) + 1).toFixed(2);
  
    if (data.labels.length > 10) {
      data.labels.shift();
      data.datasets[0].data.shift();
    }
  
    data.labels.push(now);
    data.datasets[0].data.push(usage);
    energyChart.update();
  }, 3000);
  
  // 🤖 Chatbot Toggle
  function toggleChatbot() {
    const box = document.getElementById('chatbot-box');
    box.classList.toggle('d-none');
  }
  
  // 💬 Chatbot Handler
  function handleChat(e) {
    if (e.key === "Enter") {
      const input = document.getElementById("chat-input");
      const content = document.getElementById("chat-content");
  
      const userText = input.value.trim();
      if (userText === "") return;
  
      // User message
      const userMsg = document.createElement("p");
      userMsg.innerHTML = "🧑‍💻 " + userText;
      content.appendChild(userMsg);
  
      // Bot response (dummy)
      const botMsg = document.createElement("p");
      botMsg.innerHTML = "🤖 I'm here to help with energy tips!";
      setTimeout(() => {
        content.appendChild(botMsg);
        content.scrollTop = content.scrollHeight;
      }, 500);
  
      input.value = "";
    }
  }
  