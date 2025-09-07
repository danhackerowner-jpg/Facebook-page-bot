import axios from "axios";
import fs from "fs";
import path from "path";

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "verify_token_here";
const API_BASE = "https://graph.facebook.com/v20.0";

// ---- send helper ----
async function sendMessage(sender_psid, message) {
  try {
    await axios.post(
      `${API_BASE}/me/messages`,
      { recipient: { id: sender_psid }, message },
      { params: { access_token: PAGE_ACCESS_TOKEN } }
    );
  } catch (e) {
    console.error("Send error:", e.response?.data || e.message);
  }
}

// ---- load commands ----
const commands = new Map();
const commandsDir = path.join(process.cwd(), "commands");
fs.readdirSync(commandsDir).forEach((file) => {
  if (file.endsWith(".js")) {
    const mod = require(path.join(commandsDir, file));
    if (mod?.name && typeof mod.execute === "function") {
      commands.set(mod.name, mod);
      if (Array.isArray(mod.aliases)) {
        mod.aliases.forEach((a) => commands.set(a, mod));
      }
    }
  }
});

export default async function handler(req, res) {
  // ---- verification request ----
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token) {
      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("Webhook verified!");
        return res.status(200).send(challenge);
      } else {
        return res.sendStatus(403);
      }
    }
  }

  // ---- webhook events ----
  if (req.method === "POST") {
    const body = req.body;
    if (body.object === "page") {
      for (const entry of body.entry) {
        const event = entry.messaging[0];
        const psid = event.sender.id;

        if (event.message && event.message.text) {
          const text = event.message.text.trim();
          const args = text.split(/\s+/);
          const cmdName = args[0].toLowerCase();
          const cmd = commands.get(cmdName);

          if (cmd) {
            try {
              const ctx = {
                psid,
                args,
                say: (t) => sendMessage(psid, { text: t })
              };
              const out = await cmd.execute(ctx);
              if (typeof out === "string" && out) {
                await sendMessage(psid, { text: out });
              }
            } catch (e) {
              console.error("Command error:", e);
              await sendMessage(psid, { text: "⚠️ Command Error: report this to Daniel" });
            }
          } else {
            await sendMessage(psid, { text: "❓ command do not exist. type 'help' list of all commands." });
          }
        }
      }
      return res.status(200).send("EVENT_RECEIVED");
    } else {
      return res.sendStatus(404);
    }
  }

  res.sendStatus(405);
}
