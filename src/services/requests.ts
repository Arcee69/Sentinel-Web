import type { AxiosRequestConfig } from "axios";
import apiInstance from "./instance";

/** Every ordinary JSON response: `{success, message, data, meta}`. */
export interface ApiEnvelope<T, M = Record<string, unknown>> {
  success: boolean;
  message: string;
  data: T;
  meta: M;
}

/** `meta` on paginated list routes. */
export interface PageMeta {
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
  [key: string]: unknown;
}

export type Query = Record<string, string | number | boolean | null | undefined>;

/** Drops null, undefined and empty-string values so they never reach the URL. */
export function cleanQuery(obj?: Query) {
  if (!obj || typeof obj !== "object") return undefined;
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value != null && value !== ""),
  );
}

export const getMethod = async <T = unknown, M = Record<string, unknown>>(
  url: string,
  query?: Query,
  config?: AxiosRequestConfig,
): Promise<ApiEnvelope<T, M>> => {
  const res = await apiInstance.get<ApiEnvelope<T, M>>(url, {
    ...config,
    params: cleanQuery(query),
  });
  return res.data;
};

export const getList = <T = unknown>(url: string, query?: Query, config?: AxiosRequestConfig) =>
  getMethod<T[], PageMeta>(url, query, config);

/**
 * Every page of a paginated list, concatenated. An agent's own lists are
 * short; `maxPages` caps a runaway one on a metered connection.
 */
export async function getAllPages<T = unknown>(
  url: string,
  query?: Query,
  maxPages = 10,
): Promise<T[]> {
  const first = await getList<T>(url, query);
  const items = [...first.data];
  const last = Math.min(Number(first.meta?.last_page ?? 1), maxPages);
  for (let page = 2; page <= last; page++) {
    const next = await getList<T>(url, { ...query, page });
    items.push(...next.data);
  }
  return items;
}

export const postMethod = async <T = unknown>(
  url: string,
  payload?: unknown,
  config?: AxiosRequestConfig,
): Promise<ApiEnvelope<T>> => {
  const res = await apiInstance.post<ApiEnvelope<T>>(url, payload, config);
  return res.data;
};

export const patchMethod = async <T = unknown>(
  url: string,
  payload?: unknown,
  config?: AxiosRequestConfig,
): Promise<ApiEnvelope<T>> => {
  const res = await apiInstance.patch<ApiEnvelope<T>>(url, payload, config);
  return res.data;
};

export const putMethod = async <T = unknown>(
  url: string,
  payload?: unknown,
  config?: AxiosRequestConfig,
): Promise<ApiEnvelope<T>> => {
  const res = await apiInstance.put<ApiEnvelope<T>>(url, payload, config);
  return res.data;
};
