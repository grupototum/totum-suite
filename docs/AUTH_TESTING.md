# Auth Testing Playbook (Mixpost Clone)

This app supports BOTH:
1. **Email/Password JWT auth** (custom)
2. **Emergent-managed Google Auth** (session_token via cookie)

The backend `get_current_user` resolves either:
- httpOnly cookie `access_token` (JWT) OR
- httpOnly cookie `session_token` (Emergent Auth) OR
- `Authorization: Bearer <token>` header (either type)

## Test Credentials
- Admin: `admin@mixpost.app` / `admin123`
- User: `user@mixpost.app` / `user123`

## Quick API Test (JWT path)
```
API=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d'=' -f2)
curl -c /tmp/c.txt -X POST "$API/api/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"admin@mixpost.app","password":"admin123"}'
curl -b /tmp/c.txt "$API/api/auth/me"
```

## Quick API Test (Emergent Google session_token path)
```
mongosh --eval "
use('test_database');
var uid = 'user_' + new Date().getTime();
var stoken = 'tst_' + new Date().getTime();
db.users.insertOne({user_id: uid, email: 'g.'+uid+'@mixpost.app', name:'G User', auth_provider:'google', created_at: new Date()});
db.user_sessions.insertOne({user_id: uid, session_token: stoken, expires_at: new Date(Date.now()+7*24*3600*1000), created_at: new Date()});
print(stoken);
"
curl "$API/api/auth/me" -H "Authorization: Bearer <session_token_from_above>"
```

## Endpoints
- POST `/api/auth/register` { email, password, name }
- POST `/api/auth/login` { email, password }
- POST `/api/auth/logout`
- POST `/api/auth/refresh`
- GET  `/api/auth/me`
- POST `/api/auth/session` (Emergent Google – body: { session_id })
- POST `/api/auth/forgot-password`, `/api/auth/reset-password`

Tests must include cookie-based and Bearer-based variants.
