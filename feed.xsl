<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes" doctype-system="about:legacy-compat"/>
  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title><xsl:value-of select="/rss/channel/title"/> — RSS Feed</title>
        <style>
          *{margin:0;padding:0;box-sizing:border-box}
          body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0a0f;color:#e2e8f0;line-height:1.6}
          .container{max-width:760px;margin:0 auto;padding:2rem 1.5rem}
          .header{text-align:center;margin-bottom:2.5rem;padding-bottom:2rem;border-bottom:1px solid rgba(255,255,255,0.08)}
          .badge{display:inline-block;padding:0.3rem 0.8rem;background:rgba(0,212,255,0.1);border:1px solid rgba(0,212,255,0.3);border-radius:999px;font-size:0.75rem;font-weight:600;color:#00d4ff;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:1rem}
          h1{font-size:2rem;font-weight:800;margin-bottom:0.5rem;background:linear-gradient(135deg,#00d4ff,#a855f7,#10b981);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
          .description{color:#8892b0;font-size:1rem;max-width:560px;margin:0 auto}
          .info{background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.2);border-radius:12px;padding:1rem 1.25rem;margin-bottom:2rem;font-size:0.875rem;color:#fbbf24}
          .info strong{display:block;margin-bottom:0.25rem;color:#f59e0b}
          .info a{color:#00d4ff}
          .item{padding:1.5rem 0;border-bottom:1px solid rgba(255,255,255,0.06)}
          .item:last-child{border-bottom:none}
          .item-title{font-size:1.125rem;font-weight:700;margin-bottom:0.3rem}
          .item-title a{color:#e2e8f0;text-decoration:none}
          .item-title a:hover{color:#00d4ff}
          .item-meta{font-size:0.78rem;color:#64748b;margin-bottom:0.5rem;font-family:'JetBrains Mono',monospace}
          .item-desc{color:#8892b0;font-size:0.9375rem;line-height:1.7}
          .item-tags{margin-top:0.5rem}
          .tag{display:inline-block;font-size:0.7rem;padding:0.15rem 0.5rem;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:4px;color:#8892b0;margin-right:0.3rem}
          .footer{text-align:center;padding:2rem 0;color:#64748b;font-size:0.8125rem}
          .footer a{color:#00d4ff}
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="badge">📡 RSS Feed</div>
            <h1><xsl:value-of select="/rss/channel/title"/></h1>
            <p class="description"><xsl:value-of select="/rss/channel/description"/></p>
          </div>
          <div class="info">
            <strong>This is an RSS feed.</strong>
            Copy this URL (<code>https://victorndunda.com/feed.xml</code>) into your favorite RSS reader (Feedly, NetNewsWire, Inoreader) to get notified when Victor publishes new articles. <a href="https://victorndunda.com/blog/">Visit the blog →</a>
          </div>
          <xsl:for-each select="/rss/channel/item">
            <div class="item">
              <div class="item-title"><a href="{link}"><xsl:value-of select="title"/></a></div>
              <div class="item-meta"><xsl:value-of select="pubDate"/></div>
              <div class="item-desc"><xsl:value-of select="description"/></div>
              <div class="item-tags">
                <xsl:for-each select="category">
                  <span class="tag"><xsl:value-of select="."/></span>
                </xsl:for-each>
              </div>
            </div>
          </xsl:for-each>
          <div class="footer">
            <p>© 2026 Victor Ndunda · <a href="https://victorndunda.com">victorndunda.com</a> · <a href="mailto:mututandunda@gmail.com">mututandunda@gmail.com</a></p>
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>