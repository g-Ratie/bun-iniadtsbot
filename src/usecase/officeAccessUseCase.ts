import { users } from "@prisma/client";
import dailyRecordsRepository from "../repo/dailyRecordRepo";
import userRepository from "../repo/userRepo";

const officeAccessUseCase = {
	checkIn: async (userDiscordId: bigint, dateTime: Date, userName: string) => {
		const user = await userRepository.findUserByDiscordId(userDiscordId);
		if (!user) {
			return await userRepository.createUser({
				userName: userName,
				userDiscordId: userDiscordId,
			});
		}
		const checkInRecord =
			await dailyRecordsRepository.findUncheckedOutRecordsByUserDiscordId(
				userDiscordId,
			);
		if (checkInRecord) {
			throw new Error("チェックアウトされていない入室記録があります。");
		}

		return await dailyRecordsRepository.createDailyRecord({
			userId: user.user_id,
			checkIn: dateTime,
			is4f: false,
		});
	},
	checkOut: async (userDiscordId: bigint, dateTime: Date) => {
		const latestRecord =
			await dailyRecordsRepository.findUncheckedOutRecordsByUserDiscordId(
				userDiscordId,
			);
		if (!latestRecord) {
			throw new Error("チェックイン記録が見つかりませんでした。");
		}

		return await dailyRecordsRepository.updateDailyRecord(latestRecord.id, {
			checkOut: dateTime,
		});
	},
	countUncheckedOutRecords: async () => {
		const uncheckedOutRecords =
			await dailyRecordsRepository.findAllUncheckedOutRecords();
		return uncheckedOutRecords.length;
	},
	show: async () => {
		const uncheckedOutRecords =
			await dailyRecordsRepository.findAllUncheckedOutRecords();
		const users: users[] = [];
		for (const record of uncheckedOutRecords) {
			const user = await userRepository.findUserById(record.user_id);
			if (user) {
				users.push(user);
			}
		}
		return { uncheckedOutRecords, users };
	},
	info: async (userDiscordId: bigint) => {
		const records =
			await dailyRecordsRepository.findDailyRecordsByUserDiscordId(
				userDiscordId,
			);
		return records;
	},
};

export default officeAccessUseCase;