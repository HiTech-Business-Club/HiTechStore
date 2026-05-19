# Documentation API HiTech Store

## Table des Matières

1. [Authentication](#authentication)
2. [Produits](#produits)
3. [Commandes](#commandes)
4. [Paiements](#paiements)

## Base URL

```
Production: https://api.hitechstore.com
Développement: http://localhost:3000
```

## Authentication

### Inscription

```http
POST /api/auth/register
```

**Corps de la requête:**
```json
{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "12345678"
}
```

**Réponse:**
```json
{
    "success": true,
    "token": "jwt_token",
    "user": {
        "id": "user_id",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "role": "user"
    }
}
```

### Connexion

```http
POST /api/auth/login
```

**Corps de la requête:**
```json
{
    "email": "john@example.com",
    "password": "password123"
}
```

**Réponse:**
```json
{
    "success": true,
    "token": "jwt_token",
    "user": {
        "id": "user_id",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "role": "user"
    }
}
```

## Produits

### Liste des Produits

```http
GET /api/products
```

**Paramètres de requête:**
```
category: string (optional) - streaming, gaming, software
sort: string (optional) - price_asc, price_desc, newest
page: number (optional) - default: 1
limit: number (optional) - default: 10
```

**Réponse:**
```json
{
    "success": true,
    "data": {
        "products": [{
            "id": "product_id",
            "name": "Netflix Premium",
            "description": "Abonnement Netflix Premium",
            "category": "streaming",
            "basePrice": 45.00,
            "finalPrice": 51.75,
            "commission": 6.75,
            "provider": "Netflix",
            "duration": "1_month"
        }],
        "pagination": {
            "currentPage": 1,
            "totalPages": 5,
            "totalItems": 50
        }
    }
}
```

### Détails d'un Produit

```http
GET /api/products/:id
```

**Réponse:**
```json
{
    "success": true,
    "data": {
        "id": "product_id",
        "name": "Netflix Premium",
        "description": "Abonnement Netflix Premium",
        "category": "streaming",
        "basePrice": 45.00,
        "finalPrice": 51.75,
        "commission": 6.75,
        "provider": "Netflix",
        "duration": "1_month",
        "features": [
            "4K Ultra HD",
            "4 écrans simultanés"
        ]
    }
}
```

## Commandes

### Créer une Commande

```http
POST /api/orders
```

**En-têtes:**
```
Authorization: Bearer jwt_token
```

**Corps de la requête:**
```json
{
    "items": [{
        "productId": "product_id",
        "quantity": 1
    }],
    "billingDetails": {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "12345678"
    }
}
```

**Réponse:**
```json
{
    "success": true,
    "data": {
        "orderId": "order_id",
        "referenceNumber": "ORD-123456",
        "total": 51.75,
        "paymentUrl": "https://flouci.com/pay/xyz"
    }
}
```

### Liste des Commandes

```http
GET /api/orders
```

**En-têtes:**
```
Authorization: Bearer jwt_token
```

**Paramètres de requête:**
```
status: string (optional) - pending, completed, failed
page: number (optional) - default: 1
limit: number (optional) - default: 10
```

**Réponse:**
```json
{
    "success": true,
    "data": {
        "orders": [{
            "id": "order_id",
            "referenceNumber": "ORD-123456",
            "status": "completed",
            "total": 51.75,
            "createdAt": "2023-01-01T12:00:00Z",
            "items": [{
                "product": {
                    "name": "Netflix Premium",
                    "provider": "Netflix"
                },
                "price": 45.00
            }]
        }],
        "pagination": {
            "currentPage": 1,
            "totalPages": 3,
            "totalItems": 25
        }
    }
}
```

## Paiements

### Initier un Paiement

```http
POST /api/payments/flouci/initiate
```

**En-têtes:**
```
Authorization: Bearer jwt_token
```

**Corps de la requête:**
```json
{
    "orderId": "order_id",
    "amount": 51.75
}
```

**Réponse:**
```json
{
    "success": true,
    "paymentUrl": "https://flouci.com/pay/xyz",
    "paymentId": "payment_id"
}
```

### Vérifier un Paiement

```http
GET /api/payments/verify/:orderId
```

**En-têtes:**
```
Authorization: Bearer jwt_token
```

**Réponse:**
```json
{
    "success": true,
    "status": "completed",
    "order": {
        "id": "order_id",
        "referenceNumber": "ORD-123456",
        "status": "completed",
        "total": 51.75,
        "activationCodes": [{
            "service": "Netflix",
            "code": "NETFLIX-123-456",
            "status": "active",
            "expiresAt": "2024-01-01T12:00:00Z"
        }]
    }
}
```

## Codes d'Erreur

| Code | Description |
|------|-------------|
| 400  | Requête invalide |
| 401  | Non authentifié |
| 403  | Non autorisé |
| 404  | Ressource non trouvée |
| 422  | Données invalides |
| 429  | Trop de requêtes |
| 500  | Erreur serveur |

## Webhooks

### Webhook Flouci

```http
POST /api/payments/webhook/flouci
```

**Corps de la requête:**
```json
{
    "payment_id": "payment_id",
    "status": "COMPLETED",
    "signature": "webhook_signature"
}
```

**Réponse:**
```json
{
    "success": true
}
```

## Sécurité

- Toutes les requêtes doivent être effectuées en HTTPS
- Les tokens JWT expirent après 24 heures
- Rate limiting : 100 requêtes par IP par minute
- Les webhooks nécessitent une signature valide

## Support

Pour toute assistance technique :
- Email : api-support@hitechstore.com
- Documentation complète : https://docs.hitechstore.com
