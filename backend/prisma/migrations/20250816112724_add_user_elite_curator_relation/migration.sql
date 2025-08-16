-- CreateTable
CREATE TABLE "_UserToelite_curators" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_UserToelite_curators_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_UserToelite_curators_B_index" ON "_UserToelite_curators"("B");

-- AddForeignKey
ALTER TABLE "_UserToelite_curators" ADD CONSTRAINT "_UserToelite_curators_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserToelite_curators" ADD CONSTRAINT "_UserToelite_curators_B_fkey" FOREIGN KEY ("B") REFERENCES "elite_curators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
