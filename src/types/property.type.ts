export type CreatePropertyInput = {
  name: string;
  address: string;
  city: string;
  state: string;
  country?: string;
  imageUrl?: string;
  description?: string;
};

export type UpdatePropertyInput = {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  description?: string;
  imageUrl?: string;
};
