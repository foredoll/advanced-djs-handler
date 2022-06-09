const fs = require("fs");
const Discord = require("discord.js");
const config = require("./config.json");
const mongoose = require("mongoose");
const ms = require("ms");
const prefixSchema = require("./models/prefix");
const ascii = require("ascii-table");

let table = new ascii("Commands");
table.setHeading("Command", "Load status");

const client = new Discord.Client({
  intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  ],
  partials: ["MESSAGE", "CHANNEL", "REACTION"],
});
client.commands = new Discord.Collection();
client.cooldowns = new Discord.Collection();
client.aliases = new Discord.Collection();
mongoose
  .connect(
    `mongodb+srv://CinnabarBot:${process.env.MONGODB_PASSWORD}@cinnabarbot.u8berh2.mongodb.net/?retryWrites=true&w=majority`
  )
  .then(() => {
    console.log("Mongoose :: Connected to database");
  });

client.prefix = async function (message) {
  let custom;

  const data = await prefixSchema
    .findOne({ Guild: message.guild.id })
    .catch((err) => console.log(err));

  if (data) {
    custom = data.Prefix;
  } else {
    custom = config.prefix;
  }
  return custom;
};

const commandFolders = fs.readdirSync("./commands");

for (const folder of commandFolders) {
  const commandFiles = fs
    .readdirSync(`./commands/${folder}`)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const command = require(`./commands/${folder}/${file}`);
    client.commands.set(command.name, command);
    if (command.name) {
      table.addRow(file, "✅");
    } else {
      table.addRow(
        file,
        `❌  -> missing a help.name, or help.name is not a string.`
      );
      continue;
    }

    if (command.aliases && Array.isArray(command.aliases))
      command.aliases.forEach((alias) =>
        client.aliases.set(alias, command.name)
      );
  }

  console.log(table.toString());
}

client.once("ready", async () => {
  await console.log(`Discord  :: Logged in as ${client.user.tag}`);
  await client.user.setActivity("by myself");
  await console.log(`Discord  :: Set client status`);
});

client.on("message", async (message) => {
  const p = await client.prefix(message);

  if (message.mentions.users.first()) {
    if (message.mentions.users.first().id == client.user.id) {
      const prefixEmbed = new Discord.MessageEmbed()
        .setTimestamp()
        .setTitle(`My prefix`)
        .setDescription(`My prefix in ${message.guild.name} is ${p}`)
        .setFooter(`Requested by ${message.author.tag}`)
        .setColor(config.color);
      return message.reply(prefixEmbed);
    }
  }

  if (!message.content.startsWith(p) || message.author.bot) return;

  const args = message.content.slice(p.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command =
    client.commands.get(commandName) ||
    client.commands.find(
      (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
    );

  if (!command) return;

  if (command.guildOnly && message.channel.type === "dm") {
    return message.reply("I can't execute that command inside DMs!");
  }

  if (command.ownerOnly && message.author.id != config.ownerID) {
    return message.reply("Only the bot owner can used this command!");
  }

  if (command.userPerms) {
    const authorPerms = message.channel.permissionsFor(message.author);
    if (!authorPerms || !authorPerms.has(command.permissions)) {
      return message.reply("You do not have the required permissions!");
    }
  }

  if (command.botPerms) {
    const botPerms = message.channel.permissionsFor(message.author);
    if (!botPerms || !botPerms.has(command.permissions)) {
      return message.reply("I do not have the required permissions!");
    }
  }

  if (command.args && !args.length) {
    let reply = `You didn't provide any arguments!`;

    if (command.usage) {
      reply += `\nThe proper usage would be: \`${p}${command.name} ${command.usage}\``;
    }

    return message.channel.send(reply);
  }

  if (command.disabled) {
    return message.reply("This command is disabled!");
  }

  if (command.nsfw && !message.channel.nsfw) {
    // will never do this, but doing it anyways.
    return message.reply(
      "This command is nsfw and you are not in a nsfw channel!"
    );
  }

  const { cooldowns } = client;

  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Discord.Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = ms(command.cooldown ? command.cooldown : "3s");

  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return message.reply(
        `Please wait ${timeLeft.toFixed(1)} more second${
          timeLeft.toFixed(1) == 1 ? "" : "s"
        } before reusing the \`${command.name}\` command.`
      );
    }
  }

  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

  let prefix = p;

  try {
    command.execute(client, message, args, prefix);
  } catch (error) {
    console.error(error);
    message.reply(
      `There was an error trying to execute that command!\n\n${error.name} :: ${error.message}\nPlease contact the bot developer!`
    );
  }
});

client.login(process.env.TOKEN);
