-- AlterTable
ALTER TABLE `User` ADD COLUMN `publicKey` TEXT NULL,
    MODIFY `password` VARCHAR(255) NULL;
