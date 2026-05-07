#!/bin/bash
# Seed local — cria usuários de teste diretamente no MongoDB
# Requer: mongosh instalado e MONGO_URL configurada no backend/.env

set -e

cd "$(dirname "$0")/../backend"

if [ ! -f .env ]; then
    echo "Erro: backend/.env não encontrado. Copie .env.example e configure MONGO_URL."
    exit 1
fi

export $(grep -v '^#' .env | xargs)

echo "🌱 Inserindo seed no MongoDB..."

mongosh "${MONGO_URL}" --quiet <<'MONGO'
use('totum_suite');

var now = new Date();

// Admin
db.users.updateOne(
    { email: "admin@mixpost.app" },
    { $setOnInsert: {
        user_id: "usr_admin_001",
        email: "admin@mixpost.app",
        name: "Administrador",
        password_hash: "$2b$12$fakehashforseed.notreal",
        role: "admin",
        auth_provider: "email",
        active_workspace_id: "ws_default_001",
        created_at: now
    }},
    { upsert: true }
);

// Workspace default
db.workspaces.updateOne(
    { workspace_id: "ws_default_001" },
    { $setOnInsert: {
        workspace_id: "ws_default_001",
        name: "Meu Workspace",
        description: "Workspace criado automaticamente pelo seed",
        owner_id: "usr_admin_001",
        color: "#E63946",
        created_at: now
    }},
    { upsert: true }
);

// User teste
db.users.updateOne(
    { email: "user@mixpost.app" },
    { $setOnInsert: {
        user_id: "usr_user_001",
        email: "user@mixpost.app",
        name: "Usuário Teste",
        password_hash: "$2b$12$fakehashforseed.notreal",
        role: "user",
        auth_provider: "email",
        active_workspace_id: "ws_default_001",
        created_at: now
    }},
    { upsert: true }
);

print("✅ Seed concluído. Usuários: admin@mixpost.app / user@mixpost.app");
MONGO
