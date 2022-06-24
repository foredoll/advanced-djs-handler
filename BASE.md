The base code

```js
const { MessageEmbed } = require("discord.js")
const config = require("../../config.json")

module.exports = {
  name: "",
  aliases: [], 
  description: "",
  guildOnly: false,
  ownerOnly: false,
  userPerms: [],
  botPerms: [],
  args: false,
  usage: "",
  disabled: false,
  nsfw: false,
  cooldown: '2s', 
  category: "",
  execute(client, message, args, prefix, color) {
    //your code here...
  }
}
