# GrayCup B2B Database Schema

Use this document to build an admin panel for managing all form submissions. Each table has a `resolved` boolean field that can be toggled to mark items as handled.

---

## Tables Overview

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `contact_submissions` | General contact form inquiries | company, email, message |
| `quote_requests` | Product price quote requests | product_id, quantity, grade |
| `sample_requests` | Free sample requests (with payment) | selected_products, payment_status |
| `feedback_submissions` | Customer feedback and ratings | feedback_type, rating |
| `product_requests` | Requests for new products not in catalog | category, product_name |
| `call_requests` | Request for callback from sales team | phone, agenda |

---

## 1. contact_submissions

General inquiries from the contact form.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | UUID | Auto | Primary key |
| `name` | string | Yes | Contact person's name |
| `email` | string | Yes | Business email (Gmail blocked) |
| `company` | string | Yes | Company name |
| `company_size` | string | Yes | Options: "1-49", "50-99", "100-249", "250-499", "500+" |
| `message` | string | Yes | Inquiry message (10-2000 chars) |
| `status` | string | No | Custom status field |
| `resolved` | boolean | No | Default: false |
| `created_at` | timestamp | Auto | Submission timestamp |

**Admin Actions:**
- View message details
- Mark as resolved
- Filter by company size
- Sort by date

---

## 2. quote_requests

Requests for price quotes on specific products.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | UUID | Auto | Primary key |
| `company_name` | string | Yes | Company name |
| `contact_name` | string | Yes | Contact person's name |
| `email` | string | Yes | Contact email |
| `phone` | string | No | Phone number |
| `product_id` | string | No | Product slug (e.g., "assam-ctc-tea") |
| `grade` | string | No | Selected product grade |
| `quantity` | number | Yes | Requested quantity |
| `message` | string | No | Additional requirements |
| `status` | string | No | Custom status field |
| `resolved` | boolean | No | Default: false |
| `created_at` | timestamp | Auto | Submission timestamp |

**Admin Actions:**
- View product details via product_id
- See requested quantity and grade
- Contact via email/phone
- Mark as resolved after sending quote

---

## 3. sample_requests

Requests for product samples (requires payment of Rs 299).

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | UUID | Auto | Primary key |
| `company_name` | string | Yes | Company name |
| `category` | string | Yes | Business type: "Hotel", "Restaurant", "Cafe", "Banquet Hall", "Other" |
| `other_category` | string | No | Custom category if "Other" selected |
| `gst` | string | Yes | GST number |
| `phone` | string | Yes | Contact phone |
| `email` | string | No | Contact email |
| `address` | string | Yes | Delivery address |
| `selected_products` | string[] | Yes | Array of product IDs |
| `payment_status` | string | No | Payment status from Cashfree |
| `resolved` | boolean | No | Default: false |
| `created_at` | timestamp | Auto | Submission timestamp |

**Admin Actions:**
- Check payment_status before shipping
- View selected products list
- Mark as resolved after shipping samples

---

## 4. feedback_submissions

Customer feedback and ratings.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | UUID | Auto | Primary key |
| `company` | string | Yes | Company name |
| `name` | string | Yes | Contact person's name |
| `email` | string | Yes | Contact email |
| `feedback_type` | string | Yes | "Product Quality", "Service", "Delivery", "Suggestion", "Other" |
| `rating` | string | Yes | "Excellent", "Good", "Average", "Poor" |
| `feedback` | string | Yes | Detailed feedback text |
| `resolved` | boolean | No | Default: false |
| `created_at` | timestamp | Auto | Submission timestamp |

**Admin Actions:**
- Filter by rating (prioritize "Poor" ratings)
- Filter by feedback_type
- Mark as resolved after addressing feedback

---

## 5. product_requests

Requests for products not currently in the catalog.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | UUID | Auto | Primary key |
| `company` | string | Yes | Company name |
| `name` | string | Yes | Contact person's name |
| `email` | string | Yes | Contact email |
| `phone` | string | Yes | Contact phone |
| `category` | string | Yes | "Tea", "Coffee", "Other Beverages", "Other" |
| `product_name` | string | Yes | Name of requested product |
| `quantity` | string | No | Expected quantity needed |
| `details` | string | No | Additional details |
| `status` | string | No | Custom status field |
| `resolved` | boolean | No | Default: false |
| `created_at` | timestamp | Auto | Submission timestamp |

**Admin Actions:**
- Review new product requests
- Contact requester for more details
- Mark as resolved after responding

---

## 6. call_requests

Requests for a callback from the sales team.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | UUID | Auto | Primary key |
| `name` | string | Yes | Contact person's name |
| `phone` | string | Yes | Phone number (formatted: +91 98765 43210) |
| `company_name` | string | Yes | Company name |
| `agenda` | string | Yes | Purpose/agenda of the call |
| `resolved` | boolean | No | Default: false |
| `created_at` | timestamp | Auto | Submission timestamp |

**Admin Actions:**
- View call agenda before calling
- Mark as resolved after completing call

---

## Admin Panel Features to Build

### Dashboard
- Total unresolved count per table
- Recent submissions (last 24h)
- Quick filters: All / Unresolved / Resolved

### For Each Table
1. **List View**
   - Sortable columns (date, company, status)
   - Filter by resolved status
   - Search by company/email/name
   - Bulk resolve action

2. **Detail View**
   - All field values
   - Toggle resolved button
   - Notes field (optional - add to schema if needed)

3. **Actions**
   - Mark as resolved / unresolve
   - Copy email/phone
   - Delete (with confirmation)

### Suggested Tech Stack
- Next.js with App Router
- Supabase client for data fetching
- Shadcn/ui components (already in project)
- React Table or TanStack Table for data grids
- Supabase Realtime for live updates (optional)

---

## SQL to Add Resolved Column (Run in Supabase)

```sql
-- Add resolved column to all existing tables
ALTER TABLE contact_submissions ADD COLUMN resolved BOOLEAN DEFAULT false;
ALTER TABLE quote_requests ADD COLUMN resolved BOOLEAN DEFAULT false;
ALTER TABLE sample_requests ADD COLUMN resolved BOOLEAN DEFAULT false;
ALTER TABLE feedback_submissions ADD COLUMN resolved BOOLEAN DEFAULT false;
ALTER TABLE product_requests ADD COLUMN resolved BOOLEAN DEFAULT false;

-- Create call_requests table
CREATE TABLE call_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  company_name TEXT NOT NULL,
  agenda TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE call_requests ENABLE ROW LEVEL SECURITY;

-- Policies for service role
CREATE POLICY "Enable all for service role" ON call_requests
  FOR ALL USING (true) WITH CHECK (true);
```

---

## Example: Toggle Resolved Status

```typescript
import { supabase } from "@/lib/supabase";

// Toggle resolved status for any table
async function toggleResolved(
  table: string,
  id: string,
  currentValue: boolean
) {
  const { error } = await supabase
    .from(table)
    .update({ resolved: !currentValue })
    .eq("id", id);

  if (error) throw error;
}

// Usage
await toggleResolved("call_requests", "uuid-here", false);
```

---

## Example: Fetch Unresolved Items

```typescript
// Get all unresolved call requests
const { data, error } = await supabase
  .from("call_requests")
  .select("*")
  .eq("resolved", false)
  .order("created_at", { ascending: false });

// Get count of unresolved items per table
const tables = [
  "contact_submissions",
  "quote_requests",
  "sample_requests",
  "feedback_submissions",
  "product_requests",
  "call_requests"
];

const counts = await Promise.all(
  tables.map(async (table) => {
    const { count } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq("resolved", false);
    return { table, count };
  })
);
```
