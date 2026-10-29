export interface ApiPagination {
  page?: number
  page_size?: number
  total_pages?: number
  total_items?: number
}

export interface ApiListResponse<T> {
  items?: T[]
  pagination?: ApiPagination
  [key: string]: unknown
}

export interface ApiError {
  message?: string
  [key: string]: unknown
}
