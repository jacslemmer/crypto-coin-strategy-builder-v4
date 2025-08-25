import type { ParsedQs } from 'qs';

// Utility function to safely extract string query parameters
export function getStringParam(value: any): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
    return value[0];
  }
  return undefined;
}

// Utility function to safely extract number query parameters
export function getNumberParam(value: string | ParsedQs | string[] | ParsedQs[] | undefined): number | undefined {
  const strValue = getStringParam(value);
  if (strValue) {
    const num = Number(strValue);
    return isNaN(num) ? undefined : num;
  }
  return undefined;
}

// Utility function to safely extract boolean query parameters
export function getBooleanParam(value: string | ParsedQs | string[] | ParsedQs[] | undefined): boolean {
  const strValue = getStringParam(value);
  return strValue === 'true';
}
