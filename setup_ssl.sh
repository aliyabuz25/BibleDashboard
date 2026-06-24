#!/bin/bash

# Target Domain
DOMAIN="app.thekidsbiblestories.com"
EMAIL="aliyabuz25@gmail.com"
IP="16.171.22.191"

echo "=== SSL Configuration Script Starting ==="
echo "Polling for DNS propagation of $DOMAIN resolving to $IP..."

# Loop until domain resolves to the correct IP
while true; do
    RESOLVED_IP=$(dig +short "$DOMAIN" | tail -n1)
    if [ "$RESOLVED_IP" = "$IP" ]; then
        echo "✅ DNS resolved successfully! ($DOMAIN -> $RESOLVED_IP)"
        break
    else
        echo "⏳ DNS resolved to: '$RESOLVED_IP' (Expected: $IP). Retrying in 15 seconds..."
        sleep 15
    fi
done

echo "🚀 Requesting certificate from Let's Encrypt using Certbot..."
sudo certbot certonly --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$EMAIL"

if [ $? -eq 0 ]; then
    echo "✅ SSL certificate obtained successfully!"
    echo "🔄 Updating Nginx configuration..."
    sudo cp /tmp/nginx_conf_full.conf /etc/nginx/nginx.conf
    
    echo "🧪 Testing Nginx configuration..."
    sudo nginx -t
    
    if [ $? -eq 0 ]; then
        echo "🔄 Reloading Nginx..."
        sudo systemctl reload nginx
        echo "🎉 All Done! Domain $DOMAIN is now fully configured with SSL."
    else
        echo "❌ Nginx configuration test failed!"
        exit 1
    fi
else
    echo "❌ Certbot failed to obtain the certificate."
    exit 1
fi
