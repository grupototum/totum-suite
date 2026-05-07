#!/bin/bash
# Verifica se o backend está respondendo

BACKEND_URL="${1:-https://totum-suite-api.onrender.com}"

echo "🔍 Verificando health em ${BACKEND_URL}/api/health ..."

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${BACKEND_URL}/api/health" 2>/dev/null)

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Backend OK (200)"
    curl -s --max-time 10 "${BACKEND_URL}/api/health" | python3 -m json.tool 2>/dev/null || true
elif [ "$HTTP_STATUS" = "404" ]; then
    echo "⚠️ Backend respondeu 404 — pode estar subindo ou rota diferente"
else
    echo "❌ Backend indisponível (HTTP ${HTTP_STATUS:-sem resposta})"
fi
