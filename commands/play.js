const { SlashCommandBuilder } = require("@discordjs/builders")
const { EmbedBuilder } = require("discord.js")
const { QueryType } = require("discord-player")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Play a song.")
        .addSubcommand(subcommand => 
            subcommand
                .setName("search")
                .setDescription("Search for a song.")
                .addStringOption(option => 
                    option
                        .setName("searchterms")
                        .setDescription("search keywords")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand => 
            subcommand
                .setName("playlist")
                .setDescription("Plays playlist from YT")
                .addStringOption(option => 
                    option
                        .setName("url")
                        .setDescription("playlist url")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand => 
            subcommand
                .setName("song")
                .setDescription("Plays song from YT")
                .addStringOption(option => 
                    option
                        .setName("url")
                        .setDescription("song url")
                        .setRequired(true)
                )
        ),
    execute: async ({ client, interaction }) => {
        if (!interaction.member.voice.channel) {
            await interaction.reply("🤨 Você deve estar em um canal de voz para usar esse comando.")
            return
        }

        const queue = await client.player.createQueue(interaction.guild)

        if (!queue.connection) await queue.connect(interaction.member.voice.channel)

        let embed = new EmbedBuilder();
        if (interaction.options.getSubcommand() === "song") {
            let url = interaction.options.getString("url");

            const result = await client.player.search(url, {
                requestedBy: interaction.user,
                searchEngine: QueryType.YOUTUBE_VIDEO,
            });

            if (result.tracks.length === 0) {
                await interaction.reply("🥱 Nenhum resultado encontrado.")
                return;
            }

            const song = result.tracks[0]
            await queue.addTrack(song)

            embed
                .setDescription(`😏 **[${song.title}](${song.url})** Adicionada à fila.`)
                .setThumbnail(song.thumbnail)
                .setFooter({ text: `Duração: ${song.duration}` });
        } else if (interaction.options.getSubcommand() === "playlist") {
            let url = interaction.options.getString("url");

            const result = await client.player.search(url, {
                requestedBy: interaction.user,
                searchEngine: QueryType.YOUTUBE_PLAYLIST,
            });

            if (result.tracks.length === 0) {
                await interaction.reply("🥱 Nenhum resultado encontrado.")
                return;
            }

            const playlist = result.tracks[0]
            await queue.addTracks(playlist)

            embed
                .setDescription(`😏 **[${playlist.title}](${playlist.url})** Adicionada à fila.`)
                .setThumbnail(playlist.thumbnail)
                .setFooter({ text: `Duração: ${playlist.duration}` });
        } else if (interaction.options.getSubcommand() === "search") {
            let url = interaction.options.getString("searchterms");

            const result = await client.player.search(url, {
                requestedBy: interaction.user,
                searchEngine: QueryType.AUTO,
            });

            if (result.tracks.length === 0) {
                await interaction.reply("🥱 Nenhum resultado encontrado.")
                return;
            }

            const song = result.tracks[0]
            await queue.addTrack(song)

            embed
                .setDescription(`😏 **[${song.title}](${song.url})** Adicionada à fila.`)
                .setThumbnail(song.thumbnail)
                .setFooter({ text: `Duração: ${song.duration}` });
        }
        if(!queue.playing) await queue.play();

        await interaction.reply({
            embeds: [embed]
        })
    }
}