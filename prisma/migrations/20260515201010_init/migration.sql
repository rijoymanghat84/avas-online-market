-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TrendSearch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keyword" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "score" INTEGER,
    "volume" INTEGER,
    "category" TEXT,
    "notes" TEXT,
    "aiAnalyzed" BOOLEAN NOT NULL DEFAULT false,
    "aiScore" INTEGER,
    "aiNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'discovered',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "TrendSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priceEtsy" REAL,
    "priceShopify" REAL,
    "pdfPath" TEXT,
    "coverImagePath" TEXT,
    "etsyListingId" TEXT,
    "shopifyProductId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "tags" TEXT,
    "etsyTags" TEXT,
    "shopifyTags" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "salesCount" INTEGER NOT NULL DEFAULT 0,
    "revenue" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "trendSearchId" TEXT,
    CONSTRAINT "Product_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Product_trendSearchId_fkey" FOREIGN KEY ("trendSearchId") REFERENCES "TrendSearch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Competitor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platform" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "price" REAL,
    "url" TEXT,
    "rating" REAL,
    "reviews" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" TEXT NOT NULL,
    CONSTRAINT "Competitor_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platform" TEXT NOT NULL,
    "orderId" TEXT,
    "amount" REAL NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "soldAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" TEXT NOT NULL,
    CONSTRAINT "Sale_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
