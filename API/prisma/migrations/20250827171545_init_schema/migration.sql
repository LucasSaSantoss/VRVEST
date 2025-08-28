-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `password` VARCHAR(50) NOT NULL,
    `sector` VARCHAR(100) NOT NULL,
    `position` VARCHAR(100) NOT NULL,
    `Level` INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Employee` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `cpf` VARCHAR(11) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `password` VARCHAR(25) NOT NULL,
    `sector` VARCHAR(100) NOT NULL,
    `position` VARCHAR(100) NOT NULL,
    `numPend` INTEGER NULL,
    `cadUserID` INTEGER NOT NULL,
    `cadUserName` VARCHAR(100) NOT NULL,
    `modality` INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pendency` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `emplID` INTEGER NOT NULL,
    `emplName` VARCHAR(100) NOT NULL,
    `userId` INTEGER NOT NULL,
    `userName` VARCHAR(100) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `status` INTEGER NOT NULL DEFAULT 1,
    `kitSize` INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
