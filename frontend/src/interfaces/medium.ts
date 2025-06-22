export interface Article {
    id: string;
    title: string;
    url: string;
    author?: {
      id: string;
      name: string;
      profileUrl: string;
    };
    publication?: {
      id: string;
      name: string;
      url: string;
    };
    date: string;
    content?: string;
    summary?: string;
  }
  