# Scout Inventory Systemd Service Setup

This systemd service will automatically start your Scout Inventory app on boot and keep it running.

## Installation Steps

### 1. Copy the service file to systemd

On your server, run:
```bash
sudo cp ~/scout_inventory/scout-inventory.service /etc/systemd/system/
```

### 2. Reload systemd and enable the service

```bash
# Reload systemd to recognize the new service
sudo systemctl daemon-reload

# Enable the service to start on boot
sudo systemctl enable scout-inventory

# Start the service now
sudo systemctl start scout-inventory
```

### 3. Check service status

```bash
# View status
sudo systemctl status scout-inventory

# View logs
sudo journalctl -u scout-inventory -f
```

## Useful Commands

```bash
# Start the service
sudo systemctl start scout-inventory

# Stop the service
sudo systemctl stop scout-inventory

# Restart the service (after code changes)
sudo systemctl restart scout-inventory

# View logs
sudo journalctl -u scout-inventory -f

# View recent logs
sudo journalctl -u scout-inventory --since "1 hour ago"
```

## After Code Updates

When you update the code:

```bash
cd ~/scout_inventory

# Stop the service
sudo systemctl stop scout-inventory

# Pull latest changes
git pull origin main

# Rebuild
npm run build -- --webpack

# Start the service
sudo systemctl start scout-inventory

# Check status
sudo systemctl status scout-inventory
```

## Troubleshooting

### Service won't start
```bash
# Check for errors
sudo journalctl -u scout-inventory -n 50

# Check file permissions
ls -la ~/scout_inventory

# Verify npm is in PATH
which npm
```

### Port already in use
If you get "Port 3000 already in use":
```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>

# Restart service
sudo systemctl restart scout-inventory
```

### Database connection issues
Make sure PostgreSQL is running:
```bash
sudo systemctl status postgresql
sudo systemctl start postgresql
```

## Service Features

- ✅ Auto-starts on system boot
- ✅ Automatically restarts if the app crashes
- ✅ Logs all output to journald
- ✅ Runs as dmoniz user (not root)
- ✅ 10-second delay between restarts
- ✅ Waits for PostgreSQL to be ready
