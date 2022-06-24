const { MessageEmbed } = require("discord.js");

module.exports = {
  name: "help",
  aliases: [],
  description: "Get help",
  guildOnly: false,
  ownerOnly: false,
  userPerms: [],
  botPerms: [],
  args: false,
  usage: "",
  disabled: false,
  nsfw: false,
  cooldown: "2s",
  category: "⚙️ Utility",
  async execute(client, message, args, prefix, color) {
    if (args[0]) {
      const command = await client.commands.get(args[0]);

      if (!command) {
        return client.embedReply("Unknown Command"," ", `${args[0]} is not a valid command.`)
      }

      let embed = new MessageEmbed()
        .setAuthor(command.name)
        .addField("**Description**", command.description || "Not Provided", true)
        .addField("**Aliases**", command.aliases.join(', ') || "Not Provided", true)
        .addField("**Usage**", `${prefix}${command.name} ${command.usage}` || "Not Provied", true)
        .addField("**Cooldown**", command.cooldowm || "3s", true)
        .addField("**Guild Only**", command.guildOnly || "false", true)
        .addField("**Owner Only**", command.ownerOny || "false", true)
        .addField("**User Perms**", command.userPerms.join(", ") || "None", true)
        .addField("**Bot Perms**", command.botPerms.join(", ") || "None", true)
        .addField("**NSFW**", command.nsfw || "false", true)
        .addField("**Disabled**", command.disabled || "false", true)
        .setTimestamp()
        .setColor(color)
        .setFooter(`Requested by ${message.author.tag}`);

      return message.channel.send(embed);
    } else {
      const commands = await client.commands;
      let emx = new MessageEmbed()
        .setDescription("Commands")
        .setColor(color)
        .setFooter(`Requested by ${message.author.tag}`)
        .setTimestamp();

      let com = {};
      for (let comm of commands.array()) {
        let category = comm.category || "Unknown";
        let name = comm.name;

        if (!com[category]) {
          com[category] = [];
        }
        com[category].push(name);
      }

      for (const [key, value] of Object.entries(com)) {
        let category = key;

        let desc = "`" + value.join("`, `") + "`";

        emx.addField(`${category} - [${value.length}]`, desc);
      }

      return message.reply(emx);
    }
  },
};
