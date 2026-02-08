# 1st Fairfield Scout Group - Inventory Management System

A comprehensive inventory tracking system for scout group equipment with QR code-based check-in/check-out functionality.

## Features

- **Inventory Management**: Track all group equipment with categories, descriptions, and condition
- **QR Code Generation**: Generate printable QR codes to attach to physical items
- **Check-out Tracking**: Record who borrowed items, when, and expected return date
- **Check-in Process**: Scan QR codes to return items and record condition
- **Member Management**: Track group members who can borrow equipment
- **Email Notifications**: Automatic email reminders for overdue items
- **Reporting**: View overdue items, borrowing history, item availability
- **PWA Support**: Works offline for camp use (Progressive Web App)
- **Mobile Responsive**: Optimized for use on smartphones and tablets

## Tech Stack

- **Frontend**: Next.js 14 with React 18
- **Backend**: Next.js API Routes (Node.js)
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **QR Codes**: qrcode library
- **Email**: Nodemailer

## Prerequisites

- Node.js 18+ 
- PostgreSQL database (Supabase self-hosted instance)
- SMTP server for email notifications (optional)

## Installation

1. **Clone and navigate to the project**:
```bash
cd my-app
```

2. **Install dependencies**:
```bash
npm install
```

3. **Configure environment variables**:
Edit the `.env` file with your configuration:
```env
# Database connection for self-hosted Supabase PostgreSQL
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/scout_inventory"

# Email configuration for overdue notifications (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@scoutgroup.com"

# App configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4. **Set up the database**:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

5. **Build the application**:
```bash
npm run build
```

6. **Start the production server**:
```bash
npm start
```

Or for development:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## First-Time Setup

1. Navigate to the Members page and add your scout group members
2. Create categories for your equipment (Tents, Cooking Gear, First Aid, etc.)
3. Start adding inventory items
4. Print QR code labels for each item
5. Attach labels to physical items

## Usage

### Adding Items
1. Go to Inventory → Add Item
2. Fill in item details and select category
3. Save the item

### Printing QR Codes
1. Open an item's detail page
2. Click "Print QR"
3. Print on sticker paper or label sheets
4. Attach to the physical item

### Checking Out Items
1. Go to the Scan page
2. Scan the item's QR code (or use direct link)
3. Select member and set return date
4. Complete checkout

### Checking In Items
1. Go to the Scan page
2. Scan the item's QR code
3. Record condition on return
4. Complete check-in

### Managing Members
1. Go to Members page
2. Add new members with name, email, and role
3. Track who has what equipment

### Generating Reports
1. Go to Reports page
2. View statistics and overdue items
3. Export data as CSV

## Offline Usage (PWA)

The app can be installed as a Progressive Web App for offline use during camps:

1. Open the app in Chrome/Safari on mobile
2. Tap "Add to Home Screen"
3. The app will work offline and sync when connection returns

## Email Notifications

To enable email notifications for overdue items:

1. Configure SMTP settings in `.env`
2. The system checks for overdue items and sends notifications automatically
3. Set up a cron job or scheduled task to run:
```bash
node -e "require('./src/lib/scheduler').checkAndSendOverdueNotifications()"
```

## Production Deployment

For production on your self-hosted server:

1. Set `NODE_ENV=production` in your environment
2. Update `NEXT_PUBLIC_APP_URL` to your domain
3. Use a process manager like PM2:
```bash
npm install -g pm2
pm2 start npm --name "scout-inventory" -- start
```

4. Configure a reverse proxy (nginx) to handle SSL and routing

## Database Schema

The system uses the following models:
- **Category**: Equipment categories (Tents, Cooking, etc.)
- **Item**: Individual equipment pieces with QR codes
- **Member**: Scout group members who can borrow items
- **Checkout**: Records of item loans with due dates

## Customization

- **Logo**: Replace `public/logo.png` with your scout group logo
- **Colors**: Edit `tailwind.config.js` to change theme colors
- **Categories**: Add custom categories through the UI

## License

This project is proprietary to 1st Fairfield Scout Group.

## Support

For issues or questions, please contact your system administrator.
