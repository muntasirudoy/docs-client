const API_BASE_URL = "https://docs-server-1.onrender.com/api";
export interface PublicDocument {
  _id: string;
  fullName: string;
  email: string;
  avatar: string;
}

export interface PublicDocumentDto {
  _id: string;
  title: string;
  content: string;
  owner: PublicDocument;
  publicRole: "viewer" | "editor";
}
interface PublicDocumentResponse {
  data: PublicDocumentDto;
}
interface User {
  _id: string;
  fullName: string;
  email: string;
  password: string;
  createdAt: string;
  avater?: string;
  updatedAt: string;
  __v: number;
}

interface AuthResponse {
  token: string;
  data: User;
  error?: true | string;
  message?: string;
  status?: number;
}

interface ApiResponse<T> {
  data?: T;
  error?: true | string;
  message?: string;
  status?: number;
}

class ApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: this.getAuthHeaders(),
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || "An error occurred",
          message: data.message,
          status: response.status,
        };
      }

      return { data, status: response.status };
    } catch (error) {
      return { error: true, message: "Network Error" };
    }
  }

  async register(userData: {
    fullName: string;
    email: string;
    password: string;
    avater?: string;
  }): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: {
    email: string;
    password: string;
  }): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async getDocuments(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>("/documents");
  }

  async createDocument(data: {
    title: string;
    owner: string;
    content: string;
    sharedWith?: string[];
    role: "owner" | "editor" | "viewer";
  }): Promise<ApiResponse<any>> {
    return this.request<any>("/documents", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getDocumentsByUserId(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/documents/user/${id}`);
  }

  async getDocumentByDocumentId(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/documents/single/${id}`);
  }

  async updateDocument(
    id: string,
    updates: { title?: string; content?: string }
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/documents/single/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async deleteDocument(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/documents/${id}`, {
      method: "DELETE",
    });
  }

  async shareDocument(
    id: string,
    email: string,
    role: "editor" | "viewer"
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/documents/share/${id}`, {
      method: "POST",
      body: JSON.stringify({ email, role }),
    });
  }

  async setPublicAccess(
    id: string,
    publicAccess: boolean,
    publicRole: "viewer" | "editor"
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/documents/share/${id}`, {
      method: "POST",
      body: JSON.stringify({ publicAccess, publicRole }),
    });
  }

  async getPublicDocument(
    id: string
  ): Promise<ApiResponse<PublicDocumentResponse>> {
    return this.request<PublicDocumentResponse>(`/documents/share/${id}`);
  }
}

export const apiService = new ApiService();
