# E-Commerce AI App Implementation Plan

**Overview:** Build a complete AI-powered e-commerce platform using Next.js 16, Clerk authentication, Sanity for products and orders, Stripe for payments, and Vercel AI SDK for intelligent product search.

---

## Phase 1: Foundation Setup

### 1.1 Install Core Dependencies

```bash
# Authentication (customer-facing)
pnpm add @clerk/nextjs

# Sanity App SDK (admin dashboard)
pnpm add @sanity/sdk-react

# State Management
pnpm add zustand

# UI Components
pnpm dlx shadcn@latest init

# Stripe
pnpm add stripe @stripe/stripe-js

# AI
pnpm add ai @ai-sdk/openai
```

### 1.2 Configure Clerk Authentication (for `/(app)` routes only)

- Create Clerk project and obtain API keys
- Add `ClerkProvider` to `app/(app)/layout.tsx` (NOT root layout)
- Create `proxy.ts` for protected routes (Next.js 16 replaces middleware.ts with proxy.ts)
- Protect: `/(app)/checkout`, `/(app)/orders`

### 1.3 Environment Variables

```env
# Sanity (already configured)
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=
NEXT_PUBLIC_SANITY_API_VERSION=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# AI
OPENAI_API_KEY=
```

### 1.4 Sanity Setup (Already Configured)

The project already has:
- `sanity.config.ts` - Studio configuration at `/studio`
- `sanity/env.ts` - Environment variable handling
- `sanity/lib/client.ts` - Sanity client
- `sanity/lib/image.ts` - Image URL builder
- `sanity/lib/live.ts` - Live preview support
- `sanity/schemaTypes/index.ts` - Schema registry (currently empty)

### 1.5 Sanity App SDK Setup (for `/(admin)` routes)

- Install `@sanity/sdk-react` for admin dashboard
- Add `SanityApp` provider to `app/(admin)/layout.tsx`
- Sanity handles authentication for admin users
- Use `useDocuments`, `useDocument`, `useEditDocument` hooks for real-time content management

---

## Phase 2: Sanity Schema Design

> Sanity Studio is already configured at `/studio`. This phase adds the content schemas.

### 2.1 Product Schema (`sanity/schemaTypes/productType.ts`)

Fields: title, slug, description, price, images[], category (ref), color, size, stock, aiKeywords[], aiTags[]

### 2.2 Category Schema (`sanity/schemaTypes/categoryType.ts`)

Fields: title, slug, description, icon

### 2.3 Order Schema (`sanity/schemaTypes/orderType.ts`)

Fields: orderNumber, clerkUserId, customerEmail, products[] (refs), quantities, totalPrice, shippingAddress, paymentIntentId, status, createdAt

### 2.4 Register Schemas

Update `sanity/schemaTypes/index.ts` with all schema types

---

## Phase 3: Product Browsing UI

### 3.1 Shared Product Card Component

Create `components/ProductCard.tsx` - reusable across landing, search, AI results

- Product image, title, price, Add to Basket button
- Uses Shadcn Card component

### 3.2 Landing Page (`app/page.tsx`)

- Fetch products from Sanity using `SanityLive`
- Search bar with query filtering
- Filter sidebar: category, color, price range
- Sort dropdown: relevance, price asc/desc
- Grid of ProductCard components

### 3.3 Product Detail Page (`app/products/[slug]/page.tsx`)

- Dynamic route fetching single product
- Image gallery with multiple images
- Full description, price, metadata
- Add to Basket button with quantity selector

---

## Phase 4: Shopping Cart System

### 4.1 Cart Store (Context Provider Pattern)

Using Zustand with Context for Next.js SSR safety:
- `lib/store/cart-store.ts` - Store factory using `createStore` from `zustand/vanilla`
- `lib/store/cart-store-provider.tsx` - Context provider + convenience hooks
- Wrap `app/(app)/layout.tsx` with `<CartStoreProvider>`
- Persist to localStorage via `persist` middleware

@see https://zustand.docs.pmnd.rs/guides/nextjs

### 4.2 Cart UI Components

- `components/CartSheet.tsx` - slide-out cart panel
- `components/CartItem.tsx` - individual cart item row
- `components/CartSummary.tsx` - subtotal and checkout button

### 4.3 Cart Provider Integration

Add cart provider to layout, cart icon in header with item count

---

## Phase 5: Stripe Checkout Integration

### 5.1 Checkout Session API (`app/api/checkout/route.ts`)

- Create Stripe Checkout Session
- Map cart items to Stripe line items
- Include metadata: clerkUserId, productIds
- Return session URL for redirect

### 5.2 Checkout Page (`app/checkout/page.tsx`)

- Protected route (requires Clerk auth)
- Display cart summary
- "Pay with Stripe" button
- Redirect to Stripe hosted checkout

### 5.3 Success Page (`app/checkout/success/page.tsx`)

- Display order confirmation
- Clear cart on success
- Link to orders page

---

## Phase 6: Stripe Webhooks and Orders

### 6.1 Webhook Handler (`app/api/webhooks/stripe/route.ts`)

Handle `checkout.session.completed`:

- Verify webhook signature
- Extract payment details
- Create order document in Sanity
- Include: userId, products, address, paymentIntentId, status

### 6.2 Orders List Page (`app/orders/page.tsx`)

- Protected route
- Fetch orders from Sanity filtered by clerkUserId
- Display order cards: date, total, status

### 6.3 Order Detail Page (`app/orders/[id]/page.tsx`)

- Fetch single order by ID
- Verify ownership (clerkUserId match)
- Show purchased items, address, payment status, timestamps

---

## Phase 7: AI Search Assistant

### 7.1 AI Search API (`app/api/ai/search/route.ts`)

Using Vercel AI SDK:

- Parse natural language query
- Extract filters: category, color, price range, keywords
- Query Sanity with extracted parameters
- Return matching products with AI explanation

### 7.2 AI Chat UI (`components/AISearchAssistant.tsx`)

- Floating chat button or sidebar panel
- Chat message interface
- Product cards embedded in AI responses
- Uses `useChat` hook from Vercel AI SDK

### 7.3 AI Tools Definition

Define tools for:

- `searchProducts` - query Sanity with filters
- `getProductDetails` - fetch single product
- `addToCart` - add product to cart from chat

---

## Phase 8: Admin Dashboard (Sanity App SDK)

> The admin dashboard at `/(admin)` uses Sanity App SDK with Sanity authentication.

### 8.1 Admin Layout (`app/(admin)/layout.tsx`)

- Wrap with `SanityApp` provider
- Sanity handles authentication automatically
- Real-time updates via App SDK hooks

### 8.2 Product Management (`app/(admin)/products/page.tsx`)

- List all products using `useDocuments`
- Create/edit products using `useEditDocument`
- Real-time sync with Content Lake
- Each product in its own Suspense boundary

### 8.3 Order Management (`app/(admin)/orders/page.tsx`)

- View all orders using `useDocuments`
- Update order status using `useEditDocument`
- Filter by status, date, customer

### 8.4 Dashboard Home (`app/(admin)/page.tsx`)

- Overview stats (total orders, revenue, products)
- Recent orders list
- Quick actions

---

## Phase 9: Polish and Deployment

### 9.1 Loading States

- Skeleton components for product grid
- Loading states for checkout
- Optimistic UI for cart updates

### 9.2 Error Handling

- Error boundaries for critical sections
- Toast notifications for cart actions
- Graceful fallbacks for failed fetches

### 9.3 Deployment

- Configure Vercel environment variables
- Set up Stripe webhook endpoint in production
- Test full flow in production mode

---

## Application Architecture

The app has three distinct sections with separate auth:

| Route Group | Purpose | Auth |
|-------------|---------|------|
| `/(app)/...` | Customer-facing e-commerce | Clerk |
| `/(admin)/...` | Custom admin dashboard (Sanity App SDK) | Sanity |
| `/studio/...` | Sanity Studio | Sanity |

## Key Files Structure

```
app/
  layout.tsx              # Root layout (minimal, no auth providers)
  
  (app)/                  # Customer-facing routes (Clerk auth)
    layout.tsx            # ClerkProvider, CartProvider
    page.tsx              # Landing page with products
    products/[slug]/page.tsx
    checkout/page.tsx
    checkout/success/page.tsx
    orders/page.tsx
    orders/[id]/page.tsx
    sign-in/[[...sign-in]]/page.tsx
    sign-up/[[...sign-up]]/page.tsx
  
  (admin)/                # Admin dashboard (Sanity App SDK + Sanity auth)
    layout.tsx            # SanityApp provider
    page.tsx              # Admin dashboard home
    products/page.tsx     # Product management
    orders/page.tsx       # Order management
  
  api/
    checkout/route.ts
    webhooks/stripe/route.ts
    ai/search/route.ts
  
  studio/[[...tool]]/page.tsx  # Sanity Studio (Sanity auth)

components/
  app/                    # Customer-facing components
    ProductCard.tsx
    ProductGrid.tsx
    CartSheet.tsx
    CartItem.tsx
    AISearchAssistant.tsx
    Header.tsx
  admin/                  # Admin components (Sanity App SDK)
    ProductList.tsx
    OrderList.tsx
    Dashboard.tsx

lib/
  store/
    cart-store.ts            # Zustand store factory (vanilla)
    cart-store-provider.tsx  # Context provider + hooks
  sanity/
    queries.ts               # GROQ queries

sanity/
  schemaTypes/
    productType.ts
    categoryType.ts
    orderType.ts
    index.ts
```

---

## Recommended Build Order

Execute phases sequentially. Each phase is designed to be testable before moving to the next:

1. **Phase 1** - Verify Clerk login works at `/(app)`
2. **Phase 2** - Add sample products in Sanity Studio at `/studio`
3. **Phase 3** - Browse and view products at `/(app)`
4. **Phase 4** - Add items to cart
5. **Phase 5** - Complete Stripe checkout (test mode)
6. **Phase 6** - Verify orders appear after payment
7. **Phase 7** - Test AI search queries
8. **Phase 8** - Build admin dashboard at `/(admin)` with Sanity auth
9. **Phase 9** - Deploy and verify webhooks

---

## Key Decisions

| Decision | Choice |
|----------|--------|
| Package Manager | pnpm |
| CMS (Products) | Sanity (already configured) |
| Database (Orders) | Sanity |
| AI Provider | Vercel AI SDK |
| Customer Auth (`/(app)`) | Clerk with proxy.ts |
| Admin Auth (`/(admin)`) | Sanity (via App SDK) |
| Studio Auth (`/studio`) | Sanity |
| Payments | Stripe Checkout (redirect) |

---

## Coding Conventions

| Convention | Rule |
|------------|------|
| Barrel Exports | **Do NOT use** `index.ts` barrel exports. Import directly from source files. |
| Imports | Use direct imports: `import { x } from "./store/cart"` not `from "./store"` |
| Quotes | Double quotes for strings |
| Semicolons | Required |

