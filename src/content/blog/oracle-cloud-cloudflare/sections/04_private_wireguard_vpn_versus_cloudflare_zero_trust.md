## Private WireGuard VPN versus Cloudflare Zero Trust

Using a private WireGuard VPN and Cloudflare Zero Trust (Access or Tunnels) on
your Oracle Cloud server represent two fundamentally different approaches to
network security. While both allow you to securely connect to your self-hosted
apps and protect your data, they operate at different layers of your network.

### Quick Comparison

| Feature               | Private WireGuard VPN                    | Cloudflare Zero Trust (Access/Tunnels)          |
| --------------------- | ---------------------------------------- | ----------------------------------------------- |
| How it connects       | Device-to-network (everything is routed) | Device-to-application (only specific apps)      |
| Client required?      | Yes (toggle the WireGuard app on)        | No for basic web apps (uses a standard browser) |
| Protects web traffic? | Yes (encrypts all internet browsing)     | No (only protects the hosted app or dashboard)  |
| Port forwarding?      | Yes (requires opening UDP port `51820`)  | No (Oracle ports remain closed)                 |
| Sharing with friends  | Harder (generate and send config files)  | Easier (authorize their email address)          |

### Scope of Protection: Whole Pipe versus Single App

- **WireGuard VPN:** When you enable the WireGuard client on your phone or
  laptop, your entire internet connection is tunneled through your Oracle Cloud
  server. Your public IP becomes the Oracle static IP for everything you do
  (web searches, streaming, banking). It acts like a commercial VPN, but you own
  the infrastructure.
- **Cloudflare Zero Trust:** This secures only the specific web pages or
  dashboards you connect to it (for example, `https://dashboard.example.com`).
  General browsing and streaming still use your normal home internet. Only
  requests sent to your configured domains are routed through Cloudflare to your
  Oracle server.

### Authentication: Crypto Keys versus Identity Providers

- **WireGuard VPN:** Security is handled with cryptographic key pairs. You
  generate a configuration file (or QR code) on your Oracle server, load it into
  the WireGuard app on your device, and connect. Without your exact key file, an
  attacker cannot even attempt to connect.
- **Cloudflare Zero Trust:** Security is handled by identity. When you visit
  `https://dashboard.example.com`, Cloudflare intercepts the request and shows a
  login screen. You can require a one-time PIN sent to an email address, or
  integrate with Google, GitHub, or Microsoft login.

### Network Architecture and Firewall Openings

- **WireGuard VPN:** For WireGuard to work, you must open a public UDP port
  (usually `51820`) in your Oracle Cloud Virtual Cloud Network (VCN) firewall.
  Your server listens on the open internet for VPN connections.
- **Cloudflare Zero Trust (with Tunnels):** You do not open any ports on Oracle.
  The `cloudflared` daemon on your VM makes a secure outbound connection to
  Cloudflare. Your server is invisible to port scanners on the public internet.

### Which One Should You Use?

You do not have to choose. Many homelab users run both simultaneously for
different tasks:

- **Use Cloudflare Zero Trust** for hosted web apps, blogs, and media server
  dashboards. It lets you access your tools from a work computer or a friend's
  phone using only a web browser and an email login, without installing VPN
  software on those devices.
- **Use WireGuard** for remote server management and secure public Wi-Fi
  browsing. When you are on public Wi-Fi and need to SSH into your Oracle server,
  or when you want to encrypt your entire device's internet connection, turn on
  WireGuard.

