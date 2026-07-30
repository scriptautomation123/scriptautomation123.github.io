## Use Cases for a Static IP

### Link a Custom Domain Name

- **Benefit:** Instead of typing a long IP address (for example, `132.145.x.x`)
  to access your server, you can link a cheap or free custom domain (for
  example, `myserver.com`).
- **Why static matters:** You only have to configure your domain's DNS A record
  once. If your IP address were dynamic, your website would break every time the
  IP changed.

### Host a Self-Hosted Media Server (Plex or Jellyfin)

- **Benefit:** Stream your personal movie, television, and music libraries to
  your phone, tablet, or TV from anywhere in the world.
- **Why static matters:** Media client apps require a consistent address to sync
  with your home server without breaking.
- **Note:** The Oracle Free Tier ARM instances offer up to 4 CPUs and 24 GB of
  RAM, which provides excellent processing power for a media server.

### Run a Private Game Server

- **Benefit:** Host a 24/7 dedicated multiplayer server for games like
  Minecraft, Palworld, Valheim, or Ark for you and your friends.
- **Why static matters:** Your friends can save your server to their favorites
  list once. They won't have to keep asking you for a new IP address every time
  the server reboots.

### Create a Private VPN Server (WireGuard)

- **Benefit:** Turn your Oracle VM into a personal VPN. When you connect to it
  from public Wi-Fi (for example, a coffee shop), all your internet traffic is
  securely encrypted through your cloud server.
- **Why static matters:** Your VPN client app needs a fixed destination IP to
  establish a secure handshake and tunnel your data.

### Run a Home Automation Hub (Home Assistant)

- **Benefit:** Securely monitor and control your smart home devices (cameras,
  lights, thermostats) when you are away from home.
- **Why static matters:** It ensures your mobile app can securely reach your
  smart hub instantly without losing the connection pathway.

### Host Web Apps and Development Projects

- **Benefit:** Deploy a personal portfolio website, a WordPress blog, or a
  Nextcloud instance (your own private Google Drive or Dropbox alternative).
- **Why static matters:** It ensures stable indexing for search engines and
  flawless API integrations with third-party services.

