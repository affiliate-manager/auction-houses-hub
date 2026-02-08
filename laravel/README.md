# UK Auction Houses Hub - Phase 2: Laravel Backend

Live lot listings with bridging finance integration, powered by Laravel 11 on Cloudways.

## Architecture

```
Frontend (public/)          Laravel API (/api/*)        Filament Admin (/admin/*)
  index.html                  LotController               LotResource
  lots.js  ──fetch──>         StatsController             ScrapeLogResource
  loan-calc.js                                            CSV Import
  app.js, data.js             MySQL + Redis               Dashboard
```

## Quick Start (Cloudways Deployment)

### 1. Create Cloudways Application

1. Log into Cloudways dashboard
2. Create a new **PHP 8.2** application (DigitalOcean $14/mo recommended)
3. Enable **Redis** add-on in the server settings
4. Note your server IP, DB credentials, and app URL

### 2. Upload Code

Option A - Git (recommended):
```bash
git init
git add .
git commit -m "Initial Phase 2 deployment"
git remote add origin YOUR_REPO_URL
git push -u origin main
```
Then connect the repo in Cloudways Git Deployment.

Option B - SFTP:
Upload the entire `laravel/` folder contents to your Cloudways application root.

### 3. Configure Environment

1. SSH into your Cloudways server
2. Navigate to your app directory
3. Copy the environment file:
```bash
cp .env.example .env
```
4. Edit `.env` with your Cloudways MySQL credentials:
```
DB_HOST=127.0.0.1
DB_DATABASE=your_db_name
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
```
5. Set your admin credentials:
```
FILAMENT_ADMIN_EMAIL=your@email.com
FILAMENT_ADMIN_PASSWORD=your-secure-password
```

### 4. Install Dependencies

```bash
composer install --optimize-autoloader --no-dev
```

### 5. Set Up Application

```bash
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
```

### 6. Set Document Root

In Cloudways > Application Settings > General:
- Set **Web Root** to `public_html/public`
  (or wherever your public/ folder is relative to the app root)

### 7. Set Up Cron (Scheduler)

In Cloudways > Application Settings > Cron Job Manager, add:
```
* * * * * cd /home/master/applications/YOUR_APP/public_html && php artisan schedule:run >> /dev/null 2>&1
```

### 8. Start Queue Worker

```bash
php artisan queue:work redis --daemon --sleep=3 --tries=3
```

For production, use Supervisor or Cloudways' process manager to keep this running.

### 9. SSL Certificate

In Cloudways > Application Settings > SSL Certificate:
- Enable Let's Encrypt SSL
- Point your domain DNS to the Cloudways server IP

---

## Key URLs

| URL | Description |
|-----|-------------|
| `/` | Main hub (index.html - static site) |
| `/admin` | Filament admin panel (login required) |
| `/api/lots` | API: List lots with filters |
| `/api/lots/{id}` | API: Single lot detail |
| `/api/stats` | API: Aggregate statistics |
| `/health` | Health check endpoint |

## API Examples

```bash
# All upcoming lots
GET /api/lots

# Filter by region and type
GET /api/lots?region=London&property_type=residential

# Price range filter
GET /api/lots?price_min=50000&price_max=200000

# Sort by price
GET /api/lots?sort=price_asc

# Search
GET /api/lots?q=birmingham

# Pagination
GET /api/lots?page=2&per_page=20
```

## Admin Panel

Access at `/admin` with the email/password from your `.env` file.

Features:
- **Lots Management**: Create, edit, delete, bulk actions
- **CSV Import**: Upload lot data from spreadsheets
- **Scrape Logs**: Monitor automated scraping health
- **Filters**: Status, region, property type, date range

## Scraping

### Manual Scrape
```bash
# Scrape all registered houses
php artisan lots:scrape

# Scrape a specific house (by ID from data.js)
php artisan lots:scrape --house=5

# Run synchronously (for debugging)
php artisan lots:scrape --sync
```

### Automated Schedule
The scheduler runs `lots:scrape` daily at 6 AM UK time.
Ensure the cron job is configured (Step 7).

### Adding New Scrapers
1. Create a new class in `app/Services/Scrapers/` extending `BaseScraper`
2. Implement the `fetchLots()` method
3. Register it in `ScraperRegistry.php`

## Tech Stack

- **PHP 8.2+** / Laravel 11
- **MySQL 8.0** (Cloudways managed)
- **Redis** (cache + queues)
- **Filament 3** (admin panel)
- **Guzzle + DomCrawler** (scraping)
- **Vanilla JS** (frontend, no build step)
