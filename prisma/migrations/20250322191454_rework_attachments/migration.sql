/*
  Warnings:

  - You are about to drop the `attachment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Attachment` DROP FOREIGN KEY `Attachment_authorId_fkey`;

-- DropForeignKey
ALTER TABLE `Attachment` DROP FOREIGN KEY `Attachment_channelId_fkey`;

-- DropForeignKey
ALTER TABLE `Attachment` DROP FOREIGN KEY `Attachment_fileId_fkey`;

-- AlterTable
ALTER TABLE `File` ADD COLUMN `messageId` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `Attachment`;

-- AddForeignKey
ALTER TABLE `File` ADD CONSTRAINT `File_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `Message`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
