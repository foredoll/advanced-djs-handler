const prefixSchema = require("../../models/prefix");
const { MessageEmbed } = require("discord.js");
const { prefix } = require("../../config.json");
module.exports = {
  name: "prefix",
  aliases: [],
  description: "Sets the bot prefix for this server",
  guildOnly: true,
  ownerOnly: false,
  userPerms: ["MANAGE_SERVER"],
  botPerms: [],
  category: "⚙️ Utility",
  args: false,
  usage: "[prefix]",
  disabled: false,
  nsfw: false,
  cooldown: "10s",
  async execute(client, message, args, color) {
    const res = await args.join(" ");
    if (!res) {
      const ask = new MessageEmbed()
        .setTitle("Confirmation")
        .setColor(color)
        .setDescription("Are you sure that you want to reset the prefix?")
        .setTimestamp()
        .setFooter(`Requested by ${message.author.tag}`);
      message.reply(ask).then(async (msg) => {
        await msg.react("👍")
        await msg.react("👎")
        const filter = (reaction, user) => {
          return (
            ["👍", "👎"].includes(reaction.emoji.name) &&
            user.id === message.author.id
          );
        };

        msg
          .awaitReactions(filter, { max: 1, time: 30000, errors: ["time"] })
          .then(async (collected) => {
            const reaction = collected.first();
            console.log(reaction);

            if (reaction.emoji.name = "👍") {
              msg.delete();
              await prefixSchema.findOneAndDelete({ Guild: message.guild.id });
              const prefixEmbed = new MessageEmbed()
                .setTitle("Prefix deleted")
                .setDescription(
                  `I have deleted the prefix.\nThe prefix is now ${prefix}`
                )
                .setFooter(`Requested by ${message.author.tag}`)
                .setTimestamp()
                .setColor(color);
              return message.reply(prefixEmbed);
            } else if(reaction.emoji.name = "👎") {
              msg.delete();
              const prefixEmbed = new MessageEmbed()
                .setTitle("Cancelled")
                .setDescription(`The process has been canceled.`)
                .setFooter(`Requested by ${message.author.tag}`)
                .setTimestamp()
                .setColor(color);
              return message.reply({ embeds: [prefixEmbed] });
            }
          })
          .catch((collected) => {
            msg.delete();
            const prefixEmbed = new MessageEmbed()
              .setTitle("Cancelled")
              .setDescription(`The process has been canceled.`)
              .setFooter(`Requested by ${message.author.tag}`)
              .setTimestamp()
              .setColor(color);
            return message.reply({ embeds: [prefixEmbed] });
          });
      });
    } else {
      prefixSchema.findOne({ Guild: message.guild.id }, async (err, data) => {
        if (err) throw err;
        if (data) {
          prefixSchema.findOneAndDelete({ Guild: message.guild.id });
          data = new prefixSchema({
            Guild: message.guild.id,
            Prefix: res,
          });
          data.save();
          const prefixEmbed = new MessageEmbed()
            .setTitle("Prefix set")
            .setDescription(`Your prefix has been updated to to **${res}**`)
            .setFooter(`Requested by ${message.author.tag}`)
            .setTimestamp()
            .setColor(color);
        } else {
          data = new prefixSchema({
            Guild: message.guild.id,
            Prefix: res,
          });
          data.save();
          const prefixEmbed = new MessageEmbed()
            .setTitle("Prefix set")
            .setDescription(`Prefix is now set to **${res}**`)
            .setFooter(`Requested by ${message.author.tag}`)
            .setTimestamp()
            .setColor(color);
          return message.reply(prefixEmbed);
        }
      });
    }
  },
};
