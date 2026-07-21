-- CreateTable
CREATE TABLE "RoomReadState" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3),
    "lastReadMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomReadState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoomReadState_userId_idx" ON "RoomReadState"("userId");

-- CreateIndex
CREATE INDEX "RoomReadState_roomId_idx" ON "RoomReadState"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomReadState_roomId_userId_key" ON "RoomReadState"("roomId", "userId");

-- AddForeignKey
ALTER TABLE "RoomReadState" ADD CONSTRAINT "RoomReadState_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomReadState" ADD CONSTRAINT "RoomReadState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
