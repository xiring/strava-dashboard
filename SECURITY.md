# Security Best Practices

This document outlines security measures implemented in the Strava Dashboard application.

## Authentication & Authorization

- ✅ OAuth 2.0 flow with Strava API
- ✅ Secure token storage in HTTP-only cookies
- ✅ Token refresh mechanism
- ✅ API route authentication checks

## Data Protection

- ✅ Environment variables for sensitive data
- ✅ No API keys exposed in client-side code
- ✅ SQL injection protection via Prisma ORM
- ✅ Input validation on API routes

## Security Headers

Recommended headers to add in production:

```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
]
```

## Rate Limiting

- ✅ Request queuing for Strava API
- ✅ Exponential backoff on rate limit errors
- ✅ Caching to reduce API calls

## Recommendations

1. **Use HTTPS in production** - Always use SSL/TLS certificates
2. **Regular dependency updates** - Keep packages up to date
3. **Environment variables** - Never commit secrets to git
4. **Content Security Policy** - Implement CSP headers
5. **Regular security audits** - Run `npm audit` regularly
6. **Database security** - Use strong passwords, limit access
7. **API key rotation** - Rotate Strava API keys periodically

## Known Security Issues

### glob Package Vulnerability (High Severity) - ✅ RESOLVED

**Status**: Fixed via package override

**Impact**: Command injection vulnerability in glob CLI tool (CVE: GHSA-5j98-mcp5-4vw2)

**Resolution**: Added package override in `package.json` to force `glob@^10.4.6` (patched version)

```json
"overrides": {
  "glob": "^10.4.6"
}
```

**Previous Status**:
- Affected `glob` 10.2.0 - 10.4.5
- Was a dev dependency only (no production impact)
- Fixed by forcing newer version via npm overrides

**Action Items**:
1. ✅ Package override added to force patched version
2. ✅ Security audit now shows 0 vulnerabilities
3. Regularly check for Next.js updates: `npm outdated`
4. Monitor for updates to `eslint-config-next` package

## Known Limitations

- Local SQLite database (consider PostgreSQL for production)
- No rate limiting on API routes (consider adding middleware)
- No CSRF protection (Next.js handles this, but verify)

## Reporting Security Issues

If you discover a security vulnerability, please report it responsibly.

