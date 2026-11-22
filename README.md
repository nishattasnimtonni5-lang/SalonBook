# 💇 SalonBook — Salon Appointment Booking Platform

SalonBook is a modern, responsive, full-stack salon appointment booking web application. It connects clients with professional beauty and wellness services, allowing users to browse service menus, view detailed pricing and duration, book appointments online, track booking histories, and submit support inquiries. It also includes an extensive Admin Dashboard for managing salon operations, bookings, services, promotional offers, and user reports.

---

## 🔗 Live & Repository Links

- **Live Website Link**: [SalonBook Live](https://salon-book-a-06.vercel.app/)
- **Client Repository**: [GitHub Client Repository](https://github.com/nishattasnimtonni5-lang/SalonBook)
- **Server Repository**: [GitHub Repository](https://github.com/nishattasnimtonni5-lang/SalonBook)

---

## ✨ Important Features

### 👤 Customer / Client Features
- **Browse & Search Services**: Explore a categorized menu of salon services (Haircuts, Styling, Coloring, Facials, Spa, Nails, etc.) with real-time filtering, search, and transparent pricing.
- **Service Details**: View in-depth service descriptions, durations, benefits, and verified reviews before booking.
- **Effortless Appointment Booking**: Interactive appointment scheduling with integrated calendar and time-slot selection.
- **Wishlist & Favourites**: Bookmark preferred salon services with a single click for fast re-booking.
- **Promotional Offers & Discounts**: Dedicated offers section featuring active discount codes, special packages, and seasonal savings.
- **User Dashboard**:
  - **My Appointments**: Real-time status tracking for pending, confirmed, and upcoming visits.
  - **Booking History**: Archive of past salon services and appointment records.
  - **Issue Reporting**: Built-in support ticketing system to report concerns or feedback directly to administrators.
  - **Profile Management**: Update profile information, contact numbers, and avatars.

### 🛡️ Admin Management Dashboard
- **Appointment Management**: View and filter all customer bookings, accept/confirm appointments, update booking statuses, or cancel when necessary.
- **Service Catalog Management**: Add new services with image uploads (ImgBB API), edit descriptions, pricing, and duration, or delete obsolete services.
- **Special Offers Management**: Create, update, activate, and deactivate seasonal discounts and promotional banners.
- **Customer Reports / Support Desk**: Review, manage, and resolve tickets submitted through the customer issue reporting system.
- **User Directory**: View and manage customer profiles, account statuses, and roles.

### 🔐 Authentication & Security
- **Better Auth Integration**: Secure session-based authentication backed by MongoDB adapter.
- **Multiple Login Methods**: Email & Password credentials as well as Google OAuth social sign-in.
- **Role-Based Access Control (RBAC)**: Protected routes ensuring customers and administrators access appropriate views and actions.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) |
| **Styling & Design** | [Tailwind CSS v4](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/), [Base UI](https://base-ui.com/), [Lucide React Icons](https://lucide.dev/) |
| **Authentication** | [Better Auth](https://www.better-auth.com/) (`better-auth`, `@better-auth/mongo-adapter`), Google OAuth |
| **Database** | [MongoDB](https://www.mongodb.com/) (Native MongoDB Driver) |
| **Payment Gateway** | [Stripe](https://stripe.com/) (`@stripe/stripe-js`, `stripe`) |
| **Image Hosting** | [ImgBB API](https://api.imgbb.com/) |
| **Data Visualization & UI** | [Recharts](https://recharts.org/), [Embla Carousel](https://www.embla-carousel.com/), [Input OTP](https://input-otp.rodneylab.com/) |
| **Date & Utilities** | `date-fns`, `react-day-picker`, `clsx`, `tailwind-merge` |

---

## 📋 Required Environment Variables

Create a `.env.local` or `.env` file in the root directory and configure the following environment variable keys (**names only — do not commit secret values**):

```env
# Better Auth Configuration
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

# Database Connection
MONGODB_URI=

# Google OAuth Credentials
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Image Upload
IMGBB_API_KEY=

# Internal & External API Endpoints
INTERNAL_API_SECRET=
REPORTS_API_URL=
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_OFFERS_API_URL=

# Stripe Payment Gateway
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

---

## 📦 Installation Instructions

Follow these steps to set up the project locally:

### 1. Prerequisites
Ensure you have the following installed on your local development machine:
- **Node.js** (v18.18.0 or higher recommended, or v20+)
- **npm**, **pnpm**, or **yarn**
- **Git**
- A running **MongoDB** database instance (local or MongoDB Atlas)

### 2. Clone the Repository
```bash
git clone https://github.com/nishattasnimtonni5-lang/SalonBook.git
cd SalonBook
```

### 3. Install Dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```

---

## 🚀 How to Run the Project Locally

### 1. Configure Environment Variables
Copy the sample environment configuration and fill in your credentials:
```bash
cp .env.example .env.local
```
*(Ensure all the required keys listed in the **Required Environment Variables** section above are populated.)*

### 2. Start the Development Server
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

### 3. Open in Browser
Visit [http://localhost:3000](http://localhost:3000) in your web browser to view the application.

### 4. Build for Production
To create an optimized production build:
```bash
npm run build
npm run start
```
