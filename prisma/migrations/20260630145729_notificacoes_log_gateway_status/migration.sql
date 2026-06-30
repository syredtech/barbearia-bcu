-- CreateTable
CREATE TABLE "NotificacaoLog" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "reservaId" TEXT NOT NULL,
    "numeroCliente" TEXT NOT NULL,
    "canal" TEXT NOT NULL,
    "sucesso" BOOLEAN NOT NULL,
    "detalhe" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificacaoLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GatewayStatus" (
    "id" TEXT NOT NULL,
    "ultimoHeartbeat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GatewayStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificacaoLog_idempotencyKey_idx" ON "NotificacaoLog"("idempotencyKey");
