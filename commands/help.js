const fs = require("fs");
const path = require("path");

module.exports = {
  name: "help",
  description: "Show all available commands",
  async execute(ctx) {
    const dir = path.join(__dirname);
    const files = fs.readdirSync(dir).filter(f => f.endsWith(".js"));
    const names = files.map(f => require(path.join(dir, f)).name).filter(Boolean);

    const list = names.join(", ");
    return `📜 *COMMANDS*\n${list}`;
  }
};
