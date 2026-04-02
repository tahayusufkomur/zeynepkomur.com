terraform {
  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.49"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

provider "hcloud" {
  token = var.hcloud_token
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# ---------- SSH key ----------

data "hcloud_ssh_keys" "all" {}

resource "hcloud_ssh_key" "default" {
  count      = length(data.hcloud_ssh_keys.all.ssh_keys) > 0 ? 0 : 1
  name       = "default"
  public_key = file("~/.ssh/id_ed25519.pub")
}

locals {
  ssh_key_ids = length(data.hcloud_ssh_keys.all.ssh_keys) > 0 ? [data.hcloud_ssh_keys.all.ssh_keys[0].id] : [hcloud_ssh_key.default[0].id]
}

# ---------- Server ----------

resource "hcloud_server" "prod" {
  name        = var.server_name
  image       = "ubuntu-24.04"
  server_type = var.server_type
  location    = var.location
  ssh_keys    = local.ssh_key_ids

  user_data = <<-EOF
    #!/bin/bash
    set -euo pipefail

    # Install Docker
    apt-get update
    apt-get install -y ca-certificates curl gnupg
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Install git
    apt-get install -y git

    # Create app directory
    mkdir -p /opt/${var.server_name}

    # Enable Docker on boot
    systemctl enable docker
    systemctl start docker
  EOF
}

# ---------- Firewall ----------

resource "hcloud_firewall" "web" {
  name = "${var.server_name}-fw"

  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "22"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "80"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "443"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction       = "out"
    protocol        = "tcp"
    port            = "1-65535"
    destination_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction       = "out"
    protocol        = "udp"
    port            = "1-65535"
    destination_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction       = "out"
    protocol        = "icmp"
    destination_ips = ["0.0.0.0/0", "::/0"]
  }
}

resource "hcloud_firewall_attachment" "prod" {
  firewall_id = hcloud_firewall.web.id
  server_ids  = [hcloud_server.prod.id]
}

# ---------- DNS ----------

data "cloudflare_zone" "zone" {
  name = var.cloudflare_zone_name
}

# Root domain A record
resource "cloudflare_record" "root" {
  zone_id = data.cloudflare_zone.zone.id
  name    = "@"
  content = hcloud_server.prod.ipv4_address
  type    = "A"
  ttl     = 1
  proxied = false
}

# www subdomain CNAME -> root
resource "cloudflare_record" "www" {
  zone_id = data.cloudflare_zone.zone.id
  name    = "www"
  content = var.cloudflare_zone_name
  type    = "CNAME"
  ttl     = 1
  proxied = false
}

# ---------- Email Routing ----------
#
# Prerequisites (one-time, via Cloudflare dashboard):
#   1. Email > Email Routing > Enable
#   2. Add destination email and verify it (click link in verification email)
#
# Terraform manages the DNS records and catch-all rule below.
# The MX/SPF records may already exist after enabling via dashboard —
# Terraform will import/adopt them on first apply.

# MX records for Cloudflare Email Routing
resource "cloudflare_record" "mx_route1" {
  zone_id  = data.cloudflare_zone.zone.id
  name     = "@"
  type     = "MX"
  content  = "route1.mx.cloudflare.net"
  priority = 12
  ttl      = 1
}

resource "cloudflare_record" "mx_route2" {
  zone_id  = data.cloudflare_zone.zone.id
  name     = "@"
  type     = "MX"
  content  = "route2.mx.cloudflare.net"
  priority = 69
  ttl      = 1
}

resource "cloudflare_record" "mx_route3" {
  zone_id  = data.cloudflare_zone.zone.id
  name     = "@"
  type     = "MX"
  content  = "route3.mx.cloudflare.net"
  priority = 21
  ttl      = 1
}

# SPF record for email routing
resource "cloudflare_record" "spf" {
  zone_id = data.cloudflare_zone.zone.id
  name    = "@"
  type    = "TXT"
  content = "v=spf1 include:_spf.mx.cloudflare.net ~all"
  ttl     = 1
}

# Catch-all: forward all @zeynepkomur.com emails to the destination
# NOTE: The destination email must be verified in the dashboard first
resource "cloudflare_email_routing_catch_all" "forward_all" {
  zone_id = data.cloudflare_zone.zone.id
  name    = "catch-all"
  enabled = true

  matcher {
    type = "all"
  }

  action {
    type  = "forward"
    value = [var.email_forward_to]
  }
}
