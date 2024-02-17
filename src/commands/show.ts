import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	SlashCommandBuilder,
} from "discord.js";
import { Command } from "../types";
import { buildEmbed } from "../utils/generateShowMessage";

const showCommand: Command<ChatInputCommandInteraction> = {
	data: new SlashCommandBuilder()
		.setName("show")
		.setDescription("入室中のユーザーを表示します。") as SlashCommandBuilder,
	execute: async (interaction) => {
		await interaction.deferReply();
		const embed = await buildEmbed();

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId("refresh")
				.setLabel("更新")
				.setStyle(ButtonStyle.Primary),
		);

		if (!interaction.channel) {
			console.log("Channel is not available.");
			await interaction.editReply(
				"適切なチャンネルが見つかりませんでした。\n処理を中断します。",
			);
			return;
		}

		await interaction.editReply({ embeds: [embed], components: [row] });

		const filter = (i) =>
			i.customId === "refresh" && i.user.id === interaction.user.id;
		const collector = interaction.channel.createMessageComponentCollector({
			filter,
			time: 15000,
		});

		collector.on("collect", async (i) => {
			if (i.customId === "refresh") {
				const updatedEmbed = await buildEmbed();
				if (!interaction.channel) {
					console.log("Channel is not available.");
					return;
				}
				await i.update({ embeds: [updatedEmbed], components: [row] });
			}
		});
	},
};

export default showCommand;