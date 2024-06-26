import {
  EmbedBuilder,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import type { Command } from "../types";
import rankingUseCase from "../usecase/rankingUseCase";

const showCommand: Command<ChatInputCommandInteraction> = {
  data: new SlashCommandBuilder()
    .setName("ranking")
    .setDescription("滞在時間のランキングを表示します。")
    .addStringOption((option) =>
      option.setName("from").setDescription("開始日").setRequired(false),
    )
    .addStringOption((option) =>
      option.setName("until").setDescription("終了日").setRequired(false),
    )
    .addBooleanOption((option) =>
      option
        .setName("showallmembers")
        .setDescription("全メンバーを表示する")
        .setRequired(false),
    ) as SlashCommandBuilder,
  execute: async (interaction) => {
    try {
      await interaction.deferReply();

      const showAllMembers = interaction.options.getBoolean("showallmembers");
      const { from, until } = (() => {
        const fromString = interaction.options.getString("from");
        const untilString = interaction.options.getString("until");

        if (fromString !== null && untilString !== null)
          return { from: new Date(fromString), until: new Date(untilString) };
        if (fromString !== null)
          return { from: new Date(fromString), until: new Date() };
        if (untilString !== null)
          return { from: new Date(0), until: new Date(untilString) };

        const currentDate = new Date();
        const startOfMonth = (() => {
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          return startOfMonth;
        })();

        return { from: startOfMonth, until: currentDate };
      })();

      for (const date of [from, until]) {
        if (date.toString() === "Invalid Date") {
          await interaction.editReply({ content: "日付の形式が不正です。" });
          return;
        }
      }

      const rankingData = await rankingUseCase.ranking(from, until);
      const [fromString, untilString] = [from, until].map((date) => {
        return date.toLocaleDateString("ja-JP");
      });

      if (showAllMembers) {
        const title = `滞在時間のランキング (${fromString} ~ ${untilString})`;
        const message = rankingData
          .map((data) => {
            return `${data.user?.user_name}: ${data.stayTime}`;
          })
          .join("\n");

        await interaction.editReply(`# ${title}\n${message}`);
      } else {
        const embed = new EmbedBuilder()
          .setTitle(`滞在時間のランキング (${fromString} ~ ${untilString})`)
          .setColor("#0099ff");
        const top25RankingData = rankingData.slice(0, 25);

        const embedFields = top25RankingData.map((data, index) => {
          return {
            name: `${index + 1}位: ${data.user?.user_name}`,
            value: `滞在時間: ${data.stayTime}`,
          };
        });

        for (const field of embedFields) {
          embed.addFields(field);
        }

        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      console.error(error);
      await interaction.editReply({ content: "エラーが発生しました。" });
    }
  },
};

export default showCommand;
