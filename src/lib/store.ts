// Simple in-memory store for MVP
// TODO: Replace with SQLite/Prisma when ready

export interface Trend {
  id: string;
  term: string;
  score: number;
  source: string;
  rank: number;
  status: "pending" | "approved" | "rejected";
  discoveredAt: string;
  traffic?: string;
  upvotes?: number;
  comments?: number;
  question?: string;
  interestOverTime?: { trend: string; values: number[] };
  relatedQueries?: { top: { query: string; value: number }[]; rising: any[] };
  peopleAlsoAsk?: { question: string }[];
}

export interface Product {
  id: string;
  name: string;
  status: "draft" | "generating" | "published";
  platform: string;
  createdAt: string;
  trendTerm: string;
}

class Store {
  trends: Map<string, Trend> = new Map();
  products: Map<string, Product> = new Map();

  // Trends
  getTrends(filter?: { status?: string }): Trend[] {
    let items = Array.from(this.trends.values());
    if (filter?.status) {
      items = items.filter((t) => t.status === filter.status);
    }
    return items.sort((a, b) => b.score - a.score);
  }

  getTrend(id: string): Trend | undefined {
    return this.trends.get(id);
  }

  saveTrend(trend: Trend): Trend {
    this.trends.set(trend.id, trend);
    return trend;
  }

  updateTrend(id: string, updates: Partial<Trend>): Trend | undefined {
    const existing = this.trends.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.trends.set(id, updated);
    return updated;
  }

  // Products
  getProducts(filter?: { status?: string }): Product[] {
    let items = Array.from(this.products.values());
    if (filter?.status) {
      items = items.filter((p) => p.status === filter.status);
    }
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  saveProduct(product: Product): Product {
    this.products.set(product.id, product);
    return product;
  }
}

export const store = new Store();
