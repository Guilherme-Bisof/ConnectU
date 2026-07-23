-- CreateTable
CREATE TABLE "RoomPreference" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isMuted" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "detailsPanelCollapsed" BOOLEAN NOT NULL DEFAULT false,
    "mutedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoomPreference_userId_isArchived_idx" ON "RoomPreference"("userId", "isArchived");

-- CreateIndex
CREATE INDEX "RoomPreference_userId_isMuted_idx" ON "RoomPreference"("userId", "isMuted");

-- CreateIndex
CREATE UNIQUE INDEX "RoomPreference_roomId_userId_key" ON "RoomPreference"("roomId", "userId");

-- AddForeignKey
ALTER TABLE "RoomPreference" ADD CONSTRAINT "RoomPreference_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomPreference" ADD CONSTRAINT "RoomPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
