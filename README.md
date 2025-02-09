# Fuel Discounts Tracker 🚗💸

A modern web application to track and manage fuel discounts across different gas stations in Argentina.

![App Screenshot](public/favicon.svg) <!-- Consider adding actual screenshot later -->

## Features ✨

- **Multi-brand Support**: Track discounts for YPF, SHELL, AXION, and more
- **Advanced Filtering**
  - Filter by fuel brands
  - Filter by days of the week
  - Filter by payment methods
- **Smart Sorting**
  - Sort by discount percentage
  - Sort by reimbursement limit
- **Price Comparison**: Compare fuel prices across different stations
- **Visual Indicators**
  - Color-coded discount badges
  - Brand-specific color schemes
  - Highlighted high-value reimbursements
- **Anti-Spam System**
  - Client-side debouncing
  - Rate limiting with localStorage cooldown
  - Protected submission endpoints

## Tech Stack 🛠️

- **Frontend**: React + TypeScript, Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide
- **Backend**: Supabase (PostgreSQL)
- **Deployment**: Vercel/Netlify (TBD)

## Getting Started 🚀

### Prerequisites

- Node.js v14+
- npm or yarn
- Supabase account

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/fuel-discounts-tracker.git

# Install dependencies
npm install

# Start development server
npm run dev
```

## Database Schema 📊

We use Supabase with this PostgreSQL schema:

```sql
-- Table: discounts
CREATE TABLE discounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  fuel_brand TEXT NOT NULL,
  day TEXT NOT NULL,
  card_method TEXT NOT NULL,
  discount INTEGER NOT NULL,
  reimbursement_limit INTEGER NOT NULL,
  frequency TEXT,
  source_url TEXT
);

-- Sample data files available in /sql directory
```

## License 📄

MIT License - See [LICENSE](LICENSE) for details.
 
