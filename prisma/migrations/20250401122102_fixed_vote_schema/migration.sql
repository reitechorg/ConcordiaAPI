/*
  Warnings:

  - You are about to drop the column `description` on the `poll` table. All the data in the column will be lost.
  - You are about to drop the `_optionvotes` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `optionId` to the `Vote` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `_optionvotes` DROP FOREIGN KEY `_OptionVotes_A_fkey`;

-- DropForeignKey
ALTER TABLE `_optionvotes` DROP FOREIGN KEY `_OptionVotes_B_fkey`;

-- AlterTable
ALTER TABLE `poll` DROP COLUMN `description`;

-- AlterTable
ALTER TABLE `vote` ADD COLUMN `optionId` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `_optionvotes`;

-- AddForeignKey
ALTER TABLE `Vote` ADD CONSTRAINT `Vote_optionId_fkey` FOREIGN KEY (`optionId`) REFERENCES `Option`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
