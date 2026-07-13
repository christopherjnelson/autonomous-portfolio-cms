export interface Post {
  id: number;
  title: string | null;
  content: string | null;
  type: string;
  date: string;
  issuer: string | null;
  image_url: string | null;
  url: string | null;
  source: string | null;
}