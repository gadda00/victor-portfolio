# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in this portfolio, please email **mututandunda@gmail.com** with the subject line "Security Vulnerability Report" instead of using the public issue tracker.

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if available)

## Security Best Practices

This portfolio is a static site hosted on GitHub Pages. Security measures include:

- **HTTPS Enforcement:** All traffic is encrypted via HTTPS.
- **Content Security Policy:** Restrictive CSP headers prevent XSS and injection attacks.
- **No Server-Side Code:** Static HTML/CSS/JS eliminates server-side vulnerabilities.
- **Subresource Integrity:** External resources are validated where possible.
- **Regular Updates:** Dependencies and content are kept up-to-date.

## Protected Directories

The following directories are marked as `Disallow` in `robots.txt` and should not be indexed:
- `/admin/` - Admin redirect (for internal use only)
- `/dashboard/` - Authenticated dashboard (requires credentials)
- `/jobs/` - Internal job management system

## Compliance

This site complies with:
- OWASP Top 10 security guidelines
- GDPR privacy requirements
- WCAG 2.2 accessibility standards

## Contact

For security inquiries, contact Victor Ndunda at **mututandunda@gmail.com**.
