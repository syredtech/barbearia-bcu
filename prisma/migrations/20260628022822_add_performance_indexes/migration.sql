-- CreateIndex
CREATE INDEX "Agendamento_venueId_date_horario_status_idx" ON "Agendamento"("venueId", "date", "horario", "status");

-- CreateIndex
CREATE INDEX "Notificacao_ownerId_createdAt_idx" ON "Notificacao"("ownerId", "createdAt");

-- CreateIndex
CREATE INDEX "Review_venueId_idx" ON "Review"("venueId");

-- CreateIndex
CREATE INDEX "Servico_venueId_idx" ON "Servico"("venueId");
