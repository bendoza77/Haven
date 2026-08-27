import { apiBase } from "@/lib/api-url";

export type User = {
  _id: string;
  fullname: string;
  email: string;
  role: "user" | "moderator" | "admin";
  provider: "local" | "google";
  profile?: string;
  isVerifed?: boolean;
  createdAt?: string;
};

/** One line of the bag, with its product resolved by the API. */
export type CartLine = {
  _id: string;
  product: Product;
  quantity: number;
  size?: string;
  color?: string;
};

/**
 * The signed-in shopper. Same account record, with the saved list and the bag
 * populated — every screen that needs them reads them from here rather than
 * asking again.
 */
export type Account = User & {
  favoriteProducts: Product[];
  cart: CartLine[];
  /** Whether a correct password also needs a six-digit code. */
  twoFactorEnabled?: boolean;
  addresses?: Address[];
};

/** A product as the API returns it. Mirrors the Product schema on the server. */
export type Product = {
  _id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  previousPrice?: number;
  image: string;
  images: string[];
  description: string;
  details: string[];
  colors: { name: string; hex: string }[];
  sizes: string[];
  badge?: "New" | "Sale" | "Bestseller";
  collections: ("featured" | "new" | "popular")[];
  rating: number;
  reviewCount: number;
  stock: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

/** What a console form sends. Every field is optional on a partial update. */
export type ProductInput = Partial<Omit<Product, "_id" | "createdAt" | "updatedAt">>;

/**
 * A review as the API returns it.
 *
 * `user` and `product` are populated by the server, so a screen never has to
 * fetch the author or the piece separately. `product` is absent on the reviews
 * of a single piece — the caller already knows which one it asked about.
 */
export type ReviewAuthor = Pick<User, "_id" | "fullname" | "email"> & { profile?: string };

export type Review = {
  _id: string;
  product?: Pick<Product, "_id" | "name" | "slug" | "image">;
  user: ReviewAuthor | null;
  rating: number;
  title?: string;
  body: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ReviewInput = {
  rating: number;
  title?: string;
  body: string;
};

/** A saved place to send things. Lives on the account as a subdocument. */
export type Address = {
  _id: string;
  label: string;
  recipient: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postcode: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
};

export type AddressInput = Omit<Address, "_id"> & { isDefault?: boolean };

export type OrderItem = {
  product?: string;
  name: string;
  slug?: string;
  image?: string;
  /** Per unit, as it stood when the order was placed. */
  price: number;
  quantity: number;
  size?: string;
  color?: string;
};

export type OrderStatus = "Processing" | "In transit" | "Delivered" | "Cancelled";

export type Order = {
  _id: string;
  reference: string;
  user?: string | Pick<User, "_id" | "fullname" | "email">;
  items: OrderItem[];
  shipping: Omit<Address, "_id" | "label" | "isDefault">;
  deliveryMethod: "standard" | "express" | "white-glove";
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  status: OrderStatus;
  /** Total pieces, not lines — a virtual the API sends down. */
  itemCount: number;
  createdAt?: string;
};

/**
 * What /auth/login answers with.
 *
 * A two-step account gets no session from a correct password — only the right
 * to be sent a code, which is what `twoFactorRequired` says. The caller must
 * branch on it rather than assume `data` is an account.
 */
export type LoginResult =
  | { status: string; twoFactorRequired: true; message?: string; data: { email: string } }
  | { status: string; twoFactorRequired?: false; message?: string; data: Account };

type ApiResponse<T> = {
  status: string;
  data: T;
  message?: string;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const isFormData = options?.body instanceof FormData;

  const response = await fetch(`${apiBase()}${path}`, {
    ...options,
    credentials: "include",
    // The browser has to set the multipart boundary itself, so an upload
    // sends no content type of ours.
    headers: isFormData ? undefined : { "Content-Type": "application/json" },
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.message ?? "Something went wrong");
  }

  return body;
}

export const api = {
  /**
   * Creates the account and sends the confirmation email. Deliberately does
   * NOT start a session — that happens when the link in the email is followed.
   */
  signup(fullname: string, email: string, password: string) {
    return request<ApiResponse<{ email: string; fullname: string }>>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ fullname, email, password }),
    });
  },

  /** May answer with an account, or with a demand for a six-digit code. */
  login(email: string, password: string) {
    return request<LoginResult>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  /** The second step. Succeeds with the account, and the session cookie set. */
  verifyTwoFactor(email: string, code: string) {
    return request<ApiResponse<Account>>("/auth/verify-2fa", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    });
  },

  resendTwoFactor(email: string) {
    return request<ApiResponse<null>>("/auth/resend-2fa", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  autoLogin() {
    return request<ApiResponse<Account>>("/auth/auto-login");
  },

  logout() {
    return request<ApiResponse<null>>("/auth/logout", { method: "POST" });
  },

  /** Confirms an address from the link in the welcome email, and signs in. */
  verifyEmail(token: string) {
    return request<ApiResponse<Account>>(`/auth/verify-email/${token}`, { method: "POST" });
  },

  /** Works with or without a session — after signing up there is no session. */
  resendVerification(email?: string) {
    return request<ApiResponse<null>>("/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  /** Always answers the same way, whether or not the address has an account. */
  forgotPassword(email: string) {
    return request<ApiResponse<null>>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  resetPassword(token: string, password: string) {
    return request<ApiResponse<Account>>(`/auth/reset-password/${token}`, {
      method: "PATCH",
      body: JSON.stringify({ password }),
    });
  },

  /* ------------------------------------------- the signed-in shopper */

  account: {
    me() {
      return request<ApiResponse<Account>>("/account/me");
    },

    update(payload: { fullname?: string; profile?: string }) {
      return request<ApiResponse<Account>>("/account/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },

    /** Turning it off asks for the password again; turning it on does not. */
    setTwoFactor(enabled: boolean, password?: string) {
      return request<ApiResponse<Account>>("/account/me/two-factor", {
        method: "PATCH",
        body: JSON.stringify({ enabled, password }),
      });
    },

    addAddress(payload: AddressInput) {
      return request<ApiResponse<Account>>("/account/me/addresses", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    updateAddress(addressId: string, payload: Partial<AddressInput>) {
      return request<ApiResponse<Account>>(`/account/me/addresses/${addressId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },

    removeAddress(addressId: string) {
      return request<ApiResponse<Account>>(`/account/me/addresses/${addressId}`, {
        method: "DELETE",
      });
    },

    addFavorite(productId: string) {
      return request<ApiResponse<Account>>(`/account/me/favorites/${productId}`, {
        method: "POST",
      });
    },

    removeFavorite(productId: string) {
      return request<ApiResponse<Account>>(`/account/me/favorites/${productId}`, {
        method: "DELETE",
      });
    },

    addToCart(payload: { productId: string; quantity?: number; size?: string; color?: string }) {
      return request<ApiResponse<Account>>("/account/me/cart", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    updateCartItem(itemId: string, quantity: number) {
      return request<ApiResponse<Account>>(`/account/me/cart/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      });
    },

    removeCartItem(itemId: string) {
      return request<ApiResponse<Account>>(`/account/me/cart/${itemId}`, { method: "DELETE" });
    },

    clearCart() {
      return request<ApiResponse<Account>>("/account/me/cart", { method: "DELETE" });
    },
  },

  /* ---------------------------------------------------------- catalogue */

  products: {
    list() {
      return request<ApiResponse<Product[]>>("/products");
    },

    get(id: string) {
      return request<ApiResponse<Product>>(`/products/${id}`);
    },

    /** Admin and moderator. */
    create(payload: ProductInput) {
      return request<ApiResponse<Product>>("/products", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    /** Admin only — the server refuses everyone else. */
    update(id: string, payload: ProductInput) {
      return request<ApiResponse<Product>>(`/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },

    /** Admin only. */
    remove(id: string) {
      return request<ApiResponse<null>>(`/products/${id}`, { method: "DELETE" });
    },

    /** Public — every review on one piece, newest first. Accepts a slug or an id. */
    reviews(idOrSlug: string) {
      return request<ApiResponse<Review[]>>(`/products/${idOrSlug}/reviews`);
    },

    /** Writes a review as the signed-in shopper. The author comes from the session. */
    addReview(idOrSlug: string, payload: ReviewInput) {
      return request<ApiResponse<Review>>(`/products/${idOrSlug}/reviews`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    /**
     * Sends the chosen files and gets back the URLs they are served from.
     *
     * One request per file, deliberately. A serverless function refuses a body
     * over 4.5 MB, and eight photographs in one multipart body clear that
     * easily — so a selection that would have failed as a batch succeeds as a
     * queue. Sequential rather than parallel so a slow connection is not asked
     * to push every image at once.
     */
    async uploadImages(files: File[]) {
      const urls: string[] = [];

      for (const file of files) {
        const form = new FormData();
        form.append("images", file);

        try {
          const response = await request<ApiResponse<string[]>>("/products/upload", {
            method: "POST",
            body: form,
          });

          urls.push(...response.data);
        } catch (failure) {
          /* One file in a selection of eight is the usual failure — too large,
             or the wrong kind. Saying which one turns a dead end into a thing
             the operator can act on. */
          const reason = failure instanceof Error ? failure.message : String(failure);
          throw new Error(`${file.name}: ${reason}`);
        }
      }

      return { status: "success", data: urls } satisfies ApiResponse<string[]>;
    },
  },

  /* ------------------------------------------------------------- orders */

  orders: {
    /** The signed-in shopper's own orders, newest first. */
    mine() {
      return request<ApiResponse<Order[]>>("/orders/me");
    },

    get(id: string) {
      return request<ApiResponse<Order>>(`/orders/me/${id}`);
    },

    /** Places the bag as an order. Prices come from the catalogue, not from here. */
    create(payload: {
      shipping: Omit<Address, "_id" | "label" | "isDefault">;
      deliveryMethod?: Order["deliveryMethod"];
    }) {
      return request<ApiResponse<Order>>("/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    /** Console only — admin and moderator. */
    list() {
      return request<ApiResponse<Order[]>>("/orders");
    },

    /** Admin only. */
    setStatus(id: string, status: OrderStatus) {
      return request<ApiResponse<Order>>(`/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
  },

  /* ------------------------------------------------------------ reviews */

  reviews: {
    /** Console only — admin and moderator. Every review in the store. */
    list() {
      return request<ApiResponse<Review[]>>("/reviews");
    },

    /** The author may edit their own; an admin may edit anybody's. */
    update(id: string, payload: Partial<ReviewInput>) {
      return request<ApiResponse<Review>>(`/reviews/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },

    /** The author may remove their own; an admin may remove anybody's. */
    remove(id: string) {
      return request<ApiResponse<null>>(`/reviews/${id}`, { method: "DELETE" });
    },
  },
};

/**
 * Where the Google button sends the browser.
 *
 * This is the route that *starts* the handshake — passport redirects on to
 * Google from here. The callback route is where Google sends the browser back
 * afterwards, carrying a code; opening it directly, with no code to exchange,
 * only ever fails.
 *
 * A getter rather than a constant because the base is resolved per call: this
 * module is imported on the server too, where a relative base is meaningless.
 */
export const googleLoginUrl = () => `${apiBase()}/auth/google`;
