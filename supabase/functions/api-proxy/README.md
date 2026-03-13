# Déploiement Edge Function

## Déployer la fonction
```bash
supabase functions deploy api-proxy
```

## Variables d'environnement
La fonction utilise automatiquement `SUPABASE_URL` de votre projet Supabase.

## Test local
```bash
supabase functions serve api-proxy
```

## Utilisation
Tous les appels API passent maintenant par le proxy avec chiffrement rotatif (change toutes les 1 minute).
