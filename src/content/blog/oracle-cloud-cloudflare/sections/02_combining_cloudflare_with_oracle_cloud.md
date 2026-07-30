## Combining Cloudflare with Oracle Cloud

Combining Cloudflare's free edge network with Oracle Cloud's Free Tier gives you
an enterprise-grade web stack at no monthly cost. Because Cloudflare acts as a
proxy (shield) in front of your Oracle static IP, you can unlock advanced
networking, security, and performance features.

The architecture typically looks like this, keeping your home network or core
cloud IP hidden from the open internet:

```text
Internet → Cloudflare Edge → Oracle Cloud static IP → Your services
```

### Host a Ghost or WordPress Blog (Ultra-Fast and Secure)

- **Zero-cost SSL certificates:** Cloudflare handles your HTTPS encryption
  automatically. You never have to manually install or renew Let's Encrypt SSL
  certificates on your Oracle Ubuntu server.
- **Global caching:** Cloudflare copies your blog's static text and images to
  hundreds of data centers globally. When someone visits your blog, the page
  loads almost instantly from a server near them, completely taking the load off
  your Oracle CPU.
- **Bot and spam protection:** Cloudflare's free Web Application Firewall (WAF)
  blocks automated malicious login attempts on your admin panel (`/wp-admin` or
  `/ghost`).

### Streamline Your Media Server (Jellyfin or Plex)

- **Custom subdomains:** You can set up dedicated entry points like
  `https://jellyfin.example.com` or `https://plex.example.com`.
- **Important caching rule:** You must create a Cloudflare Cache Rule to bypass
  caching for your media library subdomains. Cloudflare's Terms of Service
  prohibit caching large video files on their free tier, but proxying the
  traffic for a custom domain is perfectly fine.
- **Geoblocking:** If you only want your family in your home country to access
  your media server, you can create a Cloudflare rule that blocks traffic
  originating from all other countries.

### Deploy Multi-App Web Portals (The Homelab Stack)

- **A reverse proxy container (Nginx Proxy Manager or Traefik):** You can host a
  personal portfolio on your main domain, a blog on a subdomain, and a project
  dashboard on another. A reverse proxy on your Oracle VM listens to incoming
  Cloudflare traffic and routes `https://blog.example.com` to your blog container
  and `https://portfolio.example.com` to your portfolio container.
- **Cloudflare Access (Zero Trust):** You can protect your staging web apps,
  development environments, or server dashboards (like Portainer or Netdata)
  with an enterprise login screen. You can configure it so that only users
  logging in with your specific email address can access the backend of your
  Oracle server.

### Ditch Port Forwarding with Cloudflare Tunnels

- **How it works:** Instead of opening ports in the Oracle Cloud Dashboard
  firewall (VCN Security Lists), you run a tiny background application called
  `cloudflared` on your Oracle VM.
- **The result:** This app creates an outbound-only secure tunnel directly to
  Cloudflare. Your Oracle server remains completely locked down to the outside
  world, yet your websites stay perfectly reachable via your custom domain. It
  completely eliminates the security risks of public-facing ports.

### Automated DNS Failover (If You Expand)

- If you ever spin up a second free VM or want to run a backup server at home,
  you can configure Cloudflare to load-balance traffic between your Oracle
  static IP and your home network seamlessly.

