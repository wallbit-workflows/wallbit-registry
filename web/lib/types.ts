export type ListItem = {
  username: string;
  slug: string;
  display_name: string;
  description?: string;
  version: string;
  published_at: string;
};

export type ListResponse = {
  items: ListItem[];
  limit: number;
  offset: number;
};

export type Metadata = {
  username: string;
  slug: string;
  display_name: string;
  description?: string;
  version: string;
  digest: string;
  created_at: string;
  published_at: string;
};
