#!/bin/sh
set -e

echo "🏥 [Talkar Clinic EMR] Initializing container..."
mkdir -p /app/data

echo "📦 [Talkar Clinic EMR] Deploying Prisma Database Schema..."
npx prisma db push --skip-generate

echo "🌱 [Talkar Clinic EMR] Seeding multi-tenant clinics, doctors & appointments..."
npm run prisma:seed

echo "✨ [Talkar Clinic EMR] Initialization complete! Serving on Port ${PORT:-7577}..."
exec "$@"
